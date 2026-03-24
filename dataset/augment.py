"""
Augment scraped examples that have no prompt by asking Claude to describe them.
Takes the scored scraped examples above the quality threshold and generates
a natural-language description for each piece of code.

Input:  output/scraped_raw.jsonl
Output: output/scraped_augmented.jsonl  (same records + "prompt" field added)

Usage:
  python augment.py
  python augment.py --limit 20
"""

import json, re, time, argparse, hashlib
from pathlib import Path
import boto3

IN  = Path("output/scraped_raw.jsonl")
OUT = Path("output/scraped_augmented.jsonl")

MODEL_ID = "us.anthropic.claude-sonnet-4-6"

DESCRIBE_SYSTEM = """\
You are a music expert who describes Strudel/TidalCycles live-coding patterns \
in plain English, from the perspective of someone requesting the pattern.

Given Strudel code, write a short (5–15 word) description of what it sounds like \
as a user request — as if someone typed it into a music app search box.

Rules:
- Write in the style of a user prompt, not a code explanation
- Focus on the musical result, not the code techniques used
- Be specific about genre, mood, and instrumentation
- Do NOT mention Strudel, TidalCycles, euclid, or any code terms
- Output ONLY the description — no quotes, no punctuation at the end
- Examples of good output style:
    "funky acid bassline with filter sweep"
    "ambient evolving pad in C minor"
    "minimal techno kick with occasional ghost notes"
    "jazz-style melodic bass riff, melancholic mood"
"""

def fingerprint(code: str) -> str:
    return hashlib.md5(re.sub(r'\s+', '', code).encode()).hexdigest()

def load_done() -> set[str]:
    if not OUT.exists():
        return set()
    done = set()
    with OUT.open() as f:
        for line in f:
            try:
                obj = json.loads(line)
                done.add(fingerprint(obj["code"]))
            except Exception:
                pass
    return done

def describe_code(client, code: str, retries: int = 3) -> str | None:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 64,
        "system": DESCRIBE_SYSTEM,
        "messages": [{"role": "user", "content": f"Describe this Strudel pattern:\n\n{code}"}],
    }
    for attempt in range(retries):
        try:
            resp = client.invoke_model(
                modelId=MODEL_ID,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )
            text = json.loads(resp["body"].read())["content"][0]["text"].strip()
            # Strip quotes if the model wraps in them
            return text.strip('"\'')
        except Exception as e:
            wait = 2 ** attempt * 3
            print(f"    error ({e}) — retrying in {wait}s...")
            time.sleep(wait)
    return None

def main():
    from score import score_code, is_valid
    from config import MIN_QUALITY_SCORE

    parser = argparse.ArgumentParser()
    parser.add_argument("--limit",     type=int,   default=None)
    parser.add_argument("--min-score", type=int,   default=MIN_QUALITY_SCORE)
    parser.add_argument("--delay",     type=float, default=0.4)
    args = parser.parse_args()

    if not IN.exists():
        print(f"{IN} not found — run scrape.py first")
        return

    # Load scraped records, filter to quality ones without prompts
    records = []
    with IN.open() as f:
        for line in f:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                pass

    valid_quality = []
    for r in records:
        if r.get("prompt"):
            continue  # already has a prompt
        valid, _ = is_valid(r["code"])
        if not valid:
            continue
        sc, _ = score_code(r["code"])
        if sc < args.min_score:
            continue
        valid_quality.append(r)

    done = load_done()
    todo = [r for r in valid_quality if fingerprint(r["code"]) not in done]
    if args.limit:
        todo = todo[:args.limit]

    print(f"Scraped records  : {len(records)}")
    print(f"Quality >= {args.min_score}     : {len(valid_quality)}")
    print(f"Already augmented: {len(done)}")
    print(f"To augment now   : {len(todo)}")
    print(f"Model: {MODEL_ID}  |  delay: {args.delay}s\n")

    client = boto3.client("bedrock-runtime", region_name="us-east-1")

    with OUT.open("a") as f:
        for i, record in enumerate(todo, 1):
            preview = record["code"][:60].replace('\n', ' ')
            print(f"  [{i}/{len(todo)}] {preview}...", end=" ", flush=True)
            prompt = describe_code(client, record["code"])
            if prompt is None:
                print("FAILED — skipping")
                continue
            augmented = {**record, "prompt": prompt}
            f.write(json.dumps(augmented) + "\n")
            f.flush()
            print(f'→ "{prompt}"')
            time.sleep(args.delay)

    total = sum(1 for _ in OUT.open())
    print(f"\nDone. {OUT} has {total} examples.")

if __name__ == "__main__":
    main()
