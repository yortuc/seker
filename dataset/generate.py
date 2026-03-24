"""
Generate synthetic (prompt → Strudel code) pairs using Claude.
Checkpoints progress so it can be resumed if interrupted.
Saves: dataset/output/synthetic_raw.jsonl

Usage:
  ANTHROPIC_API_KEY=sk-... python generate.py
  python generate.py --limit 20   # generate only first 20 prompts
"""

import json, re, time, argparse, hashlib
from pathlib import Path
import boto3
from config import SYSTEM_PROMPT, GENERATION_PROMPTS

OUT      = Path("output/synthetic_raw.jsonl")
MODEL_ID = "us.anthropic.claude-sonnet-4-6"

def make_client():
    return boto3.client("bedrock-runtime", region_name="us-east-1")

def fingerprint(text: str) -> str:
    return hashlib.md5(text.strip().encode()).hexdigest()

def load_done() -> set[str]:
    """Return set of prompt fingerprints already generated."""
    if not OUT.exists():
        return set()
    done = set()
    with OUT.open() as f:
        for line in f:
            try:
                obj = json.loads(line)
                done.add(fingerprint(obj["prompt"]))
            except Exception:
                pass
    return done

def generate_one(client, prompt: str, retries: int = 3) -> str | None:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": prompt}],
    }
    for attempt in range(retries):
        try:
            resp = client.invoke_model(
                modelId=MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )
            result = json.loads(resp["body"].read())
            code = result["content"][0]["text"].strip()
            # Strip accidental markdown fences
            code = re.sub(r'^```\w*\n?', '', code)
            code = re.sub(r'\n?```$', '', code).strip()
            return code
        except Exception as e:
            wait = 2 ** attempt * 3
            print(f"    error ({e}) — retrying in {wait}s...")
            time.sleep(wait)
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None,
                        help="Only generate first N prompts (for testing)")
    parser.add_argument("--delay", type=float, default=0.5,
                        help="Seconds between API calls (default 0.5)")
    args = parser.parse_args()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    done = load_done()

    prompts = GENERATION_PROMPTS[:args.limit] if args.limit else GENERATION_PROMPTS
    todo    = [p for p in prompts if fingerprint(p) not in done]

    print(f"Generating {len(todo)} examples  ({len(done)} already done, {len(prompts)} total)")
    print(f"Model: {MODEL_ID}  |  delay: {args.delay}s\n")

    bedrock = make_client()
    with OUT.open("a") as f:
        for i, prompt in enumerate(todo, 1):
            print(f"  [{i}/{len(todo)}] {prompt[:70]}...", end=" ", flush=True)
            code = generate_one(bedrock, prompt)
            if code is None:
                print("FAILED — skipping")
                continue
            if len(code) < 20:
                print(f"TOO SHORT ({len(code)} chars) — skipping")
                continue

            record = {
                "source": "synthetic",
                "prompt": prompt,
                "code": code,
            }
            f.write(json.dumps(record) + "\n")
            f.flush()
            print(f"ok ({len(code)} chars)")
            time.sleep(args.delay)

    total = sum(1 for _ in OUT.open())
    print(f"\nDone. {OUT} now has {total} examples.")

if __name__ == "__main__":
    main()
