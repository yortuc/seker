"""
SFT fine-tuning of Qwen2.5-Coder-1.5B-Instruct on Strudel patterns.
Uses LoRA so the full model is never updated — only a small adapter (~20 MB).

Usage:
  python train.py                         # default settings
  python train.py --epochs 3              # more epochs
  python train.py --output runs/v2        # custom output dir
  python train.py --no-eval               # skip validation (faster)

Output:
  runs/sft-v1/                            # LoRA adapter weights
    adapter_config.json
    adapter_model.safetensors
    training_args.bin
    trainer_state.json

After training, merge & save the full model:
  python merge.py runs/sft-v1
"""

import argparse, json
from pathlib import Path

import torch
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, TaskType, get_peft_model
from trl import SFTTrainer, SFTConfig

# ── Paths ─────────────────────────────────────────────────────────────────────
MODEL_DIR  = Path("models/qwen2.5-coder-1.5b")
TRAIN_FILE = Path("output/train.jsonl")
VAL_FILE   = Path("output/val.jsonl")

# ── LoRA config ───────────────────────────────────────────────────────────────
LORA_CONFIG = LoraConfig(
    task_type     = TaskType.CAUSAL_LM,
    r             = 16,       # rank — higher = more capacity, more memory
    lora_alpha    = 32,       # scaling factor (alpha/r = effective lr scale)
    lora_dropout  = 0.05,
    # Target the attention projection layers — standard for Qwen2 architecture
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    bias          = "none",
)

def load_jsonl(path: Path) -> list[dict]:
    records = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records

def format_messages(record: dict, tokenizer) -> str:
    """Apply the model's chat template to a messages record."""
    return tokenizer.apply_chat_template(
        record["messages"],
        tokenize=False,
        add_generation_prompt=False,
    )

def build_dataset(records: list[dict], tokenizer) -> Dataset:
    texts = [format_messages(r, tokenizer) for r in records]
    return Dataset.from_dict({"text": texts})

def print_trainable_params(model):
    total     = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  trainable params : {trainable:,}  ({100 * trainable / total:.2f}% of {total:,})")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir",  default=str(MODEL_DIR))
    parser.add_argument("--train-file", default=str(TRAIN_FILE))
    parser.add_argument("--val-file",   default=str(VAL_FILE))
    parser.add_argument("--output",     default="runs/sft-v1")
    parser.add_argument("--epochs",     type=int,   default=5)
    parser.add_argument("--batch-size", type=int,   default=2)
    parser.add_argument("--grad-accum", type=int,   default=4)
    parser.add_argument("--lr",         type=float, default=2e-4)
    parser.add_argument("--max-seq-len",type=int,   default=512)
    parser.add_argument("--no-eval",    action="store_true")
    args = parser.parse_args()

    # ── Detect device ─────────────────────────────────────────────────────────
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"
    print(f"\nDevice: {device}")

    # ── Load tokenizer ────────────────────────────────────────────────────────
    print(f"Loading tokenizer from {args.model_dir}...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    tokenizer.padding_side = "right"
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # ── Load dataset ──────────────────────────────────────────────────────────
    print(f"Loading dataset...")
    train_records = load_jsonl(Path(args.train_file))
    print(f"  train : {len(train_records)} examples")

    do_eval = not args.no_eval and Path(args.val_file).exists()
    val_records = load_jsonl(Path(args.val_file)) if do_eval else []
    if do_eval:
        print(f"  val   : {len(val_records)} examples")

    train_dataset = build_dataset(train_records, tokenizer)
    val_dataset   = build_dataset(val_records, tokenizer) if do_eval else None

    # Preview one formatted example
    print(f"\nSample training text (first 300 chars):")
    print(train_dataset[0]["text"][:300])
    print("...\n")

    # ── Load model ────────────────────────────────────────────────────────────
    print(f"Loading model from {args.model_dir}...")
    model = AutoModelForCausalLM.from_pretrained(
        args.model_dir,
        dtype      = torch.bfloat16 if device != "cpu" else torch.float32,
        device_map = "auto",
    )
    model.config.use_cache = False  # required for gradient checkpointing

    # ── Wrap with LoRA ────────────────────────────────────────────────────────
    print("Attaching LoRA adapter...")
    model = get_peft_model(model, LORA_CONFIG)
    print_trainable_params(model)

    # ── Training args ─────────────────────────────────────────────────────────
    effective_batch = args.batch_size * args.grad_accum
    print(f"\nTraining config:")
    print(f"  epochs          : {args.epochs}")
    print(f"  batch size      : {args.batch_size} × {args.grad_accum} grad_accum = {effective_batch} effective")
    print(f"  learning rate   : {args.lr}")
    print(f"  max seq len     : {args.max_seq_len}")
    print(f"  output dir      : {args.output}\n")

    sft_config = SFTConfig(
        output_dir                  = args.output,
        num_train_epochs            = args.epochs,
        per_device_train_batch_size = args.batch_size,
        per_device_eval_batch_size  = args.batch_size,
        gradient_accumulation_steps = args.grad_accum,
        gradient_checkpointing      = True,
        learning_rate               = args.lr,
        lr_scheduler_type           = "cosine",
        warmup_ratio                = 0.1,
        max_length                  = args.max_seq_len,
        dataset_text_field          = "text",
        fp16                        = (device == "cuda"),
        bf16                        = False,
        logging_steps               = 1,
        eval_strategy               = "epoch" if do_eval else "no",
        save_strategy               = "epoch",
        save_total_limit            = 2,
        load_best_model_at_end      = do_eval,
        metric_for_best_model       = "eval_loss" if do_eval else None,
        report_to                   = "none",   # disable wandb/tensorboard
        optim                       = "adamw_torch",
        dataloader_num_workers      = 0,
    )

    # ── Trainer ───────────────────────────────────────────────────────────────
    trainer = SFTTrainer(
        model           = model,
        args            = sft_config,
        train_dataset   = train_dataset,
        eval_dataset    = val_dataset,
        processing_class = tokenizer,
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    print("Starting training...\n")
    trainer.train()

    # ── Save adapter ──────────────────────────────────────────────────────────
    print(f"\nSaving LoRA adapter to {args.output}...")
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)

    print(f"\nDone. Adapter saved to {args.output}/")
    print(f"Next step: python merge.py {args.output}")

if __name__ == "__main__":
    main()
