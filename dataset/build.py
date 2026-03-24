"""
Assemble, deduplicate, score-filter, and format the final SFT dataset.

Sources (all optional — uses whatever exists):
  output/scraped_raw.jsonl   — from scrape.py
  output/synthetic_raw.jsonl — from generate.py

Outputs:
  output/train.jsonl   — 90% split, chat-format for SFT
  output/val.jsonl     — 10% split
  output/stats.json    — summary statistics

Usage:
  python build.py
  python build.py --min-score 8  # stricter quality filter
"""

import json, re, random, hashlib, argparse
from pathlib import Path
from score import score_file
from config import SYSTEM_PROMPT, MIN_QUALITY_SCORE

SOURCES = [
    Path("output/scraped_augmented.jsonl"),  # scraped + Claude-generated prompts
    Path("output/synthetic_raw.jsonl"),       # fully synthetic (prompt + code)
]

def fingerprint(code: str) -> str:
    return hashlib.md5(re.sub(r'\s+', '', code).encode()).hexdigest()

def to_chat_format(prompt: str, code: str) -> dict:
    """Convert a (prompt, code) pair into the chat message format for SFT."""
    return {
        "messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": prompt},
            {"role": "assistant", "content": code},
        ]
    }

def infer_prompt(record: dict) -> str | None:
    """For scraped examples that have no prompt, generate a minimal description."""
    if record.get("prompt"):
        return record["prompt"]
    # Scraped examples have no prompt — skip them here;
    # a separate augment step (using Claude) would write prompts for them.
    # For now we only use examples that already have a prompt field.
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--min-score", type=int, default=MIN_QUALITY_SCORE)
    parser.add_argument("--val-split", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)

    # ── Load & score all sources ─────────────────────────────────────────────
    all_records: list[dict] = []
    for src in SOURCES:
        if not src.exists():
            print(f"  skip {src.name} (not found)")
            continue
        scored = score_file(src)
        print(f"  loaded {src.name}: {len(scored)} records")
        all_records.extend(scored)

    if not all_records:
        print("\nNo source files found. Run scrape.py and/or generate.py first.")
        return

    # ── Filter ───────────────────────────────────────────────────────────────
    valid    = [r for r in all_records if r["valid"]]
    quality  = [r for r in valid if r["quality_score"] >= args.min_score]
    has_prompt = [r for r in quality if infer_prompt(r)]

    print(f"\n  total loaded  : {len(all_records)}")
    print(f"  valid         : {len(valid)}")
    print(f"  quality >= {args.min_score:2d}  : {len(quality)}")
    print(f"  has prompt    : {len(has_prompt)}")

    # ── Deduplicate by code fingerprint ──────────────────────────────────────
    seen: set[str] = set()
    unique: list[dict] = []
    for r in has_prompt:
        fp = fingerprint(r["code"])
        if fp not in seen:
            seen.add(fp)
            unique.append(r)

    print(f"  after dedup   : {len(unique)}")

    if not unique:
        print("\nNothing to save after filtering. Lower --min-score or generate more data.")
        return

    # ── Format into chat messages ─────────────────────────────────────────────
    formatted = [
        to_chat_format(infer_prompt(r), r["code"])  # type: ignore[arg-type]
        for r in unique
    ]

    # ── Train / val split ────────────────────────────────────────────────────
    random.shuffle(formatted)
    n_val   = max(1, int(len(formatted) * args.val_split))
    val     = formatted[:n_val]
    train   = formatted[n_val:]

    out = Path("output")
    out.mkdir(exist_ok=True)

    def write_jsonl(path: Path, records: list[dict]):
        with path.open("w") as f:
            for r in records:
                f.write(json.dumps(r) + "\n")

    write_jsonl(out / "train.jsonl", train)
    write_jsonl(out / "val.jsonl",   val)

    stats = {
        "total_loaded":   len(all_records),
        "valid":          len(valid),
        "quality_filter": args.min_score,
        "after_quality":  len(quality),
        "after_dedup":    len(unique),
        "train":          len(train),
        "val":            len(val),
        "sources":        [s.name for s in SOURCES if s.exists()],
        "score_distribution": {
            str(sc): sum(1 for r in unique if r["quality_score"] == sc)
            for sc in sorted(set(r["quality_score"] for r in unique))
        }
    }
    (out / "stats.json").write_text(json.dumps(stats, indent=2))

    print(f"\n  train examples : {len(train)}")
    print(f"  val   examples : {len(val)}")
    print(f"\nOutput:")
    print(f"  {out}/train.jsonl")
    print(f"  {out}/val.jsonl")
    print(f"  {out}/stats.json")

if __name__ == "__main__":
    main()
