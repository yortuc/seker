"""
Score Strudel code examples for creativity and quality.
Can be used standalone or imported by build.py.

Usage:
  python score.py output/scraped_raw.jsonl
  python score.py output/synthetic_raw.jsonl
"""

import json, re, sys
from pathlib import Path
from config import FEATURE_SCORES, MIN_QUALITY_SCORE, MIN_CODE_LENGTH, MAX_CODE_LENGTH

def score_code(code: str) -> tuple[int, list[str]]:
    """Return (total_score, list_of_matched_features)."""
    total = 0
    features = []
    for pattern, points, label in FEATURE_SCORES:
        if re.search(pattern, code, re.IGNORECASE):
            total += points
            features.append(label)
    return total, features

def is_valid(code: str) -> tuple[bool, str]:
    """Basic sanity checks — not execution, just structure."""
    code = code.strip()
    if len(code) < MIN_CODE_LENGTH:
        return False, f"too short ({len(code)} chars)"
    if len(code) > MAX_CODE_LENGTH:
        return False, f"too long ({len(code)} chars)"

    # Should contain at least one Strudel call
    strudel_calls = [r'\bs\(', r'\bnote\(', r'\bn\(', r'\bstack\(', r'\bsound\(']
    if not any(re.search(p, code) for p in strudel_calls):
        return False, "no strudel calls found"

    # Balanced parentheses
    if code.count('(') != code.count(')'):
        return False, "unbalanced parentheses"

    # No stray import/require statements
    if re.search(r'\b(import|require)\b', code):
        return False, "contains import/require"

    return True, "ok"

def score_file(path: Path) -> list[dict]:
    results = []
    with path.open() as f:
        for line in f:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            code = obj.get("code", "")
            valid, reason = is_valid(code)
            sc, features = score_code(code)
            results.append({
                **obj,
                "valid": valid,
                "invalid_reason": reason if not valid else None,
                "quality_score": sc,
                "features": features,
            })
    return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python score.py <input.jsonl> [input2.jsonl ...]")
        sys.exit(1)

    all_results = []
    for path_str in sys.argv[1:]:
        path = Path(path_str)
        if not path.exists():
            print(f"File not found: {path}")
            continue
        results = score_file(path)
        all_results.extend(results)
        print(f"\n{path.name}:")
        print(f"  total examples : {len(results)}")
        valid = [r for r in results if r["valid"]]
        print(f"  valid          : {len(valid)}")
        above_threshold = [r for r in valid if r["quality_score"] >= MIN_QUALITY_SCORE]
        print(f"  quality >= {MIN_QUALITY_SCORE}   : {len(above_threshold)}")

        if above_threshold:
            scores = [r["quality_score"] for r in above_threshold]
            print(f"  score range    : {min(scores)} – {max(scores)}")
            print(f"  avg score      : {sum(scores)/len(scores):.1f}")

            # Feature frequency
            feat_count: dict[str, int] = {}
            for r in above_threshold:
                for f in r["features"]:
                    feat_count[f] = feat_count.get(f, 0) + 1
            top = sorted(feat_count.items(), key=lambda x: -x[1])[:10]
            print("  top features   :", ", ".join(f"{k}({v})" for k, v in top))

if __name__ == "__main__":
    main()
