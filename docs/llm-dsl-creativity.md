# LLM Creativity for DSL Generation — Research Notes

How to make LLMs generate deep, creative, structurally rich outputs for domain-specific languages. Written in the context of Seker (Strudel music patterns) but applies equally to parametric CAD, GLSL shaders, architectural layout, and any creative DSL.

---

## The Core Problem: Capability-Knowledge Mismatch

LLMs trained on general code have *syntax knowledge* for a DSL — they've seen TidalCycles/Strudel patterns in training data — but lack *grounded domain knowledge* at the intersection of:
- What the DSL can express
- How a specific creative brief maps to concrete DSL constructs

The model fills this gap with statistically average patterns. This is why "funky drum pattern" gives you `s("bd sd hh bd")` every time, and "punk bassline influenced by Bach" gives you something that sounds neither punk nor Bach.

The same failure mode appears in:
- Parametric design (Grasshopper, OpenSCAD) — shapes are geometrically valid but compositionally shallow
- GLSL shaders — syntactically correct but visually generic
- Architectural layout DSLs — valid but uninteresting spatial arrangements

---

## Solution Stack (Layered — Each Adds Independently)

### Layer 1 — Structured Chain-of-Thought
**Biggest single gain. Zero infrastructure. Implement first.**

Don't go description → DSL code in one shot. Force the model to reason through a typed intermediate specification before touching syntax.

Current Seker approach (two-step):
1. Description → music theory analysis JSON (key, notes, rhythm, character)
2. Analysis + description → Strudel code

What the research recommends enhancing this to:
```json
{
  "root": "C", "scale": "minor",
  "chord_progression": ["i", "VII", "VI", "VII"],
  "rhythmic_character": "driving eighth notes, pedal tone",
  "genre_primary": "punk",
  "genre_influences": ["Bach"],
  "compositional_techniques": [
    "chromatic descending bass line",
    "sequential motif repetition at different pitch levels",
    "root/fifth pedal tone ostinato"
  ],
  "register": "low",
  "strudel_functions_needed": ["note", "scale", "struct", "slow"]
}
```

The key: **making the model articulate compositional intent as a typed structure before writing code**. MuseCoco (2023) showed a 20% improvement in style-attribute control accuracy with this bridge.

**References:**
- MuseCoco: Text-to-symbolic music via attribute bridge — [arXiv:2306.00110](https://arxiv.org/abs/2306.00110)
- TOMI: Hierarchical planning for multi-track music generation — [arXiv:2506.23094](https://arxiv.org/abs/2506.23094)
- Planning-Driven Programming (98.2% HumanEval via plan-first pipeline) — [arXiv:2411.14503](https://arxiv.org/abs/2411.14503)
- CoComposer: Five-agent composition workflow (concept → harmony → melody → rhythm → arrangement) — [arXiv:2509.00132](https://arxiv.org/abs/2509.00132)

---

### Layer 2 — Explicit Domain Knowledge in Prompts
**High impact. No infrastructure. 1–2 days.**

Don't trust the LLM to know what "Bach-influenced" means computationally — define it explicitly in the system prompt as DSL patterns:

```
"Bach-influenced" in Strudel means:
  - Chromatic descending bass: note("[c3,b2,bb2,a2,ab2,g2]").slow(2)
  - Sequential patterns: same motif transposed by scale degree
  - Regular harmonic rhythm: .struct("x ~ x ~")
  - Diminished passing chords between diatonic roots

"Punk bassline" in Strudel means:
  - Root/fifth pedal: note("[c2,g2]*2").s("bass")
  - Straight 8th-note feel, narrow register
  - Repetitive, driving, no swing
```

This *externalization of domain knowledge into the prompt* is the highest-leverage browser-compatible technique. Particularly powerful for cross-genre mixing: each genre/style gets a mini-dictionary of its computable musical fingerprints.

**Encoding "influenced by Bach" as computable features:**
1. Chromatic passing tones on weak beats
2. Descending bass lines using diminished 7th passing chords
3. Sequential (Rosalia) patterns — motif repeated at different pitch levels
4. Regular harmonic rhythm (1–2 chords/bar)
5. Voice-leading priority over harmonic boldness

**References:**
- MuseCoco attribute schema for style encoding — [arXiv:2306.00110](https://arxiv.org/abs/2306.00110)
- ImprovNet: Cross-genre style transfer via corruption-refinement — [arXiv:2502.04522](https://arxiv.org/abs/2502.04522)
- MuseMorphose: Bar-level style control with Transformer-VAE — [arXiv:2105.04090](https://arxiv.org/abs/2105.04090)

---

### Layer 3 — Curated Example Library + Semantic RAG
**Very high impact. Browser-feasible. 1–2 weeks.**

Build a library of 100–200 richly annotated DSL examples. At generation time, semantically retrieve the 3–5 most relevant ones and inject them as few-shot examples.

Each entry in the library:
```json
{
  "code": "note(\"[c3,b2,bb2,a2] ~ [g2,f#2,f2,e2] ~\").s(\"bass\").slow(2)",
  "description": "Chromatic descending bass line over two bars, Baroque-style",
  "tags": ["bass", "chromatic", "baroque", "descending", "C minor"],
  "genre": "classical",
  "influences": ["Bach", "Handel"],
  "techniques": ["voice leading", "chromatic passing tones"],
  "key": "C minor",
  "rhythm": "whole note feel, one note per beat"
}
```

**Browser-feasible embedding**: `Xenova/all-MiniLM-L6-v2` via [Transformers.js](https://huggingface.co/docs/transformers.js) runs fully in-browser via WASM/ONNX (~25MB). Embed all pattern descriptions at load time, cosine-similarity search at generation time. No backend or vector DB needed for < 5,000 examples.

**Important**: Retrieve against the *Step 1 musical brief JSON*, not the raw user description. The plan makes a much better retrieval query than the natural language prompt.

ZK-Coder showed RAG taking DSL generation success from 20% to 87–97% for a specialized DSL (zero-knowledge proof code). The GEE-OPs paper demonstrated 20–30% improvement for geospatial DSL generation — a near-identical problem structure to Strudel.

**References:**
- ZK-Coder: RAG + repair for zero-knowledge proof DSL (20%→97%) — [arXiv:2509.11708](https://arxiv.org/abs/2509.11708)
- GEE-OPs: RAG knowledge base for geospatial DSL — [arXiv:2412.05587](https://arxiv.org/abs/2412.05587)
- PERC: Use plan-as-query for retrieval, not raw description — [arXiv:2412.12447](https://arxiv.org/abs/2412.12447)
- CodeXEmbed: State-of-the-art code embeddings — [arXiv:2411.12644](https://arxiv.org/abs/2411.12644)
- Transformers.js for browser-based embeddings — [github.com/xenova/transformers.js](https://github.com/huggingface/transformers.js)

---

### Layer 4 — Execute → Validate → Repair Loop
**Medium-high impact. Browser-feasible (Strudel runs in browser). 2–3 days.**

```
Generate → Execute in Strudel → Catch errors → Feed back → Regenerate (max 3×)
```

Since Strudel evaluates in the browser, you can close the loop automatically:
1. Generate candidate code
2. Evaluate; capture runtime errors
3. If error: `"This code produced: {error}. Fix while maintaining: {musical_brief_json}"`
4. Repeat max 2–3 times

Add a musical validator layer:
- Valid note names within declared scale
- Valid chord symbol syntax
- Non-empty pattern
- Sensible note range for declared register

Self-Refine showed ~20% absolute improvement from a single self-critique pass with no additional training.

**References:**
- Self-Refine: ~20% gain from iterative self-critique — [arXiv:2303.17651](https://arxiv.org/abs/2303.17651)
- RGD: Multi-agent code refinement pipeline — [arXiv:2410.01242](https://arxiv.org/abs/2410.01242)
- AutoPLC: Four-stage pipeline with runtime validation for industrial DSL — [arXiv:2412.02410](https://arxiv.org/abs/2412.02410)
- CRANE: Grammar constraints + free reasoning (scratch pad → constrained output) — [arXiv:2502.09061](https://arxiv.org/abs/2502.09061)

---

### Layer 5 — Evolutionary Variation UI
**High UX impact. Browser-feasible. 1 week.**

Inspired by Picbreeder / AI Co-Artist for GLSL shader generation:
1. Generate 3–4 parallel variants of a pattern (different Step 1 samples)
2. User selects the most interesting one
3. LLM recombines: *"take the rhythmic character of pattern A and the harmonic movement of pattern B, generate 3 new variations"*

This creates a **human-guided evolutionary search** through the creative space — the approach used in AI Co-Artist. It's particularly effective because humans are good at recognizing creative quality even when they can't specify it in advance.

**References:**
- AI Co-Artist: Evolutionary LLM shader generation (Picbreeder-inspired) — [arXiv:2512.08951](https://arxiv.org/abs/2512.08951)
- Tidal MerzA: RL + affective alignment for TidalCycles (the only published ML paper directly on TidalCycles generation) — [arXiv:2409.07918](https://arxiv.org/abs/2409.07918)
- CAD-RL: RL with executability + geometric accuracy rewards for CAD DSL — [arXiv:2508.10118](https://arxiv.org/abs/2508.10118)

---

### Layer 6 — Fine-tuning (Future / Requires Backend)
**Highest quality ceiling. Not browser-compatible. Revisit after Layers 1–5.**

LoRA fine-tuning on a curated annotated example library (500+ entries) with a 7–8B model. The research shows 9–32% accuracy improvements over zero-shot for DSL generation tasks, and recognizable genre-transfer rates of ~79% for musical style mixing.

Not currently viable for this browser-only app. Worth revisiting once prompt-based layers are saturated and a backend is introduced.

**References:**
- HNote: LoRA fine-tune on folk music notation (LLaMA-3.1-8B, 82.5% syntactic correctness) — [arXiv:2509.25694](https://arxiv.org/abs/2509.25694)
- GeoCode-GPT: QLoRA for geospatial DSL (9–32% improvement) — [arXiv:2410.17031](https://arxiv.org/abs/2410.17031)
- From Generality to Mastery: Adapter fine-tuning per composer style — [arXiv:2506.17497](https://arxiv.org/abs/2506.17497)
- ImprovNet: Corruption-refinement training for cross-genre style transfer — [arXiv:2502.04522](https://arxiv.org/abs/2502.04522)

---

## The Quality Ceiling

Research indicates that prompting alone caps at roughly **40–60% user satisfaction for complex multi-genre briefs**. The gap is not prompt engineering — it's the model's implicit domain theory. Layers 1–4 push toward this ceiling. Layer 6 raises it.

The most tractable path to closing the gap without fine-tuning: **encode domain knowledge explicitly in prompts**. Rather than relying on the model to know what "Bach-influenced" means computationally, define it. This externalization of domain expertise is the highest-leverage browser-compatible technique.

---

## Implementation Priority for Seker

| # | What | Expected gain | Effort |
|---|---|---|---|
| 1 | Richer Step 1 brief (genre-mixing logic, compositional techniques field) | High | 1 day |
| 2 | Genre knowledge dictionary injected per-brief into system prompt | High | 1–2 days |
| 3 | Execute → validate → repair loop (2 iterations max) | Medium-High | 2–3 days |
| 4 | Curated pattern library + MiniLM browser RAG | Very High | 1–2 weeks |
| 5 | Evolutionary variation UI (3 variants → user pick → recombine) | High (UX) | 1 week |
| 6 | LoRA fine-tuning (requires backend) | Highest | Future |

---

## Cross-Domain Applicability

| Domain | DSL | Analogous Technique |
|---|---|---|
| Music composition | Strudel / TidalCycles | Genre dictionaries, MuseCoco attribute bridge |
| Parametric design | Grasshopper, OpenSCAD | Shape grammar dictionaries, CAD-Coder two-stage pipeline |
| Shader generation | GLSL | AI Co-Artist evolutionary approach |
| Architectural layout | Custom DSLs | APT multi-modal CoT with memory/reflection |
| Industrial control | PLC structured text | AutoPLC four-stage plan+retrieve+validate |
| Geospatial analysis | Google Earth Engine | GEE-OPs AST-based knowledge base |

The pattern is consistent across all domains: **plan → retrieve similar examples → generate → validate → repair**. The domain-specific part is the intermediate representation (the "musical brief" equivalent) and the validation rules.

---

## Key References

| Paper | arXiv | Topic |
|---|---|---|
| MuseCoco | [2306.00110](https://arxiv.org/abs/2306.00110) | Text → attribute → symbolic music (direct parallel) |
| TOMI | [2506.23094](https://arxiv.org/abs/2506.23094) | Hierarchical LLM planning for multi-track music |
| CoComposer | [2509.00132](https://arxiv.org/abs/2509.00132) | Five-agent music composition workflow |
| ImprovNet | [2502.04522](https://arxiv.org/abs/2502.04522) | Jazz/classical cross-genre style transfer (79% recognizable) |
| MuseMorphose | [2105.04090](https://arxiv.org/abs/2105.04090) | Fine-grained style control via Transformer-VAE |
| Text2midi | [2412.16526](https://arxiv.org/abs/2412.16526) | Text → MIDI via LLM encoder + AR decoder |
| Tidal MerzA | [2409.07918](https://arxiv.org/abs/2409.07918) | Only published ML paper on TidalCycles generation |
| Self-Refine | [2303.17651](https://arxiv.org/abs/2303.17651) | ~20% gain from iterative self-critique, no training |
| ZK-Coder | [2509.11708](https://arxiv.org/abs/2509.11708) | RAG + repair: 20%→97% for specialized DSL |
| GEE-OPs | [2412.05587](https://arxiv.org/abs/2412.05587) | RAG knowledge base for geospatial DSL |
| PERC | [2412.12447](https://arxiv.org/abs/2412.12447) | Plan-as-query retrieval strategy |
| CRANE | [2502.09061](https://arxiv.org/abs/2502.09061) | Grammar constraints without hurting reasoning |
| Planning-Driven Programming | [2411.14503](https://arxiv.org/abs/2411.14503) | Plan-first pipeline (98.2% HumanEval) |
| AutoPLC | [2412.02410](https://arxiv.org/abs/2412.02410) | Four-stage plan+RAG+validate for industrial DSL |
| AI Co-Artist | [2512.08951](https://arxiv.org/abs/2512.08951) | Evolutionary LLM generation for GLSL shaders |
| CAD-RL | [2508.10118](https://arxiv.org/abs/2508.10118) | RL with multi-reward for CAD DSL generation |
| HNote | [2509.25694](https://arxiv.org/abs/2509.25694) | LoRA fine-tune on folk music notation |
| MusicGen | [2306.05284](https://arxiv.org/abs/2306.05284) | Meta's single-stage text+melody conditioned music |
