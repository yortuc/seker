"""
Merge the LoRA adapter back into the base model weights, producing a
standalone model ready for MLC/WebLLM conversion.

Usage:
  python merge.py runs/sft-v1
  python merge.py runs/sft-v1 --output models/strudel-coder-merged
"""

import argparse
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

MODEL_DIR = Path("models/qwen2.5-coder-1.5b")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("adapter_dir", help="Path to LoRA adapter (e.g. runs/sft-v1)")
    parser.add_argument("--base",   default=str(MODEL_DIR), help="Base model dir")
    parser.add_argument("--output", default=None,           help="Output dir (default: adapter_dir + '-merged')")
    args = parser.parse_args()

    adapter_dir = Path(args.adapter_dir)
    out_dir     = Path(args.output) if args.output else Path(str(adapter_dir) + "-merged")

    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    dtype  = torch.bfloat16 if device != "cpu" else torch.float32

    print(f"Base model : {args.base}")
    print(f"Adapter    : {adapter_dir}")
    print(f"Output     : {out_dir}")
    print(f"Device     : {device}\n")

    print("Loading base model...")
    model = AutoModelForCausalLM.from_pretrained(
        args.base,
        dtype      = dtype,
        device_map = "auto",
    )

    print("Loading LoRA adapter...")
    model = PeftModel.from_pretrained(model, str(adapter_dir))

    print("Merging weights...")
    model = model.merge_and_unload()

    print(f"Saving merged model to {out_dir}...")
    out_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(out_dir, safe_serialization=True)

    tokenizer = AutoTokenizer.from_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(out_dir)

    print(f"\nDone. Merged model saved to {out_dir}/")
    print("Next step: convert to MLC format for browser inference:")
    print(f"  mlc_llm convert_weight {out_dir} --quantization q4f16_1 -o dist/strudel-coder-q4f16-MLC")
    print(f"  mlc_llm gen_config {out_dir} --quantization q4f16_1 --conv-template qwen2 -o dist/strudel-coder-q4f16-MLC/")

if __name__ == "__main__":
    main()
