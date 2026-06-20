# Chatbot Training Intake Playbook

This playbook keeps large NutriTail training drops usable, reviewable, and safe.
Use it for the next 600 dog/cat examples and for nutrition books or notes that
should become rules.

## Chatbot Cases

Store new example batches as JSON files named:

```text
data/evals/chatbot-extra-cases-<batch>.json
```

Use `data/evals/chatbot-case-intake-template.json` as the starting shape.

Each case must include:

- `id`: stable unique id, for example `bulk-002-041`
- `species`: `dog` or `cat`
- `locale`: `el-GR` or `en-GB`
- `prompt`: the real customer-style message
- `expectedSignals`: what the chatbot should detect
- `expectedSafetyLevel`: `normal`, `caution`, or `urgent`
- `expectedResponseMustMention`: terms the answer must include

Recommended batch size: 50-100 cases. This makes failures easy to inspect.

Run:

```bash
npm.cmd run qa:chatbot-case-intake
```

After a batch passes intake validation, promote it into the golden suite or a
dedicated live runner in a separate PR.

## Book And Notes Intake

Books and notes are not copied into NutriTail answers. They are used only to
extract decision logic.

Allowed outputs:

- structured rules
- contraindications
- uncertainty logic
- safety escalation rules
- customer-friendly explanation patterns
- source-map metadata

Forbidden outputs:

- copied paragraphs
- copied tables
- long excerpts
- unverified treatment claims
- LLM-only food ranking

Preferred rule targets:

- `lib/nutrition-v2/feedingRules.ts`
- `lib/nutrition-v2/growthRules.ts`
- `lib/nutrition-v2/obesityRules.ts`
- `lib/nutrition-v2/renalRules.ts`
- `lib/nutrition-v2/urinaryRules.ts`
- `lib/nutrition-v2/giRules.ts`
- `lib/nutrition-v2/seniorRules.ts`
- `lib/nutrition-v2/ingredientRules.ts`
- `lib/food-intelligence/evaluateFood.ts`

For every new book batch, create or update a source-map file under
`data/sources/`. The source map should include:

- local folder or file names
- source priority
- allowed uses
- topics
- target rule files
- copyright policy note

The source map is metadata only. It should not contain copied book content.

## Promotion Flow

1. Add raw examples or source-map metadata.
2. Run intake QA.
3. Convert one topic at a time into deterministic rules.
4. Add focused QA for the new rule.
5. Run the golden suite fast mode.
6. Promote to full live QA before release-level signoff.

Recommended commands:

```bash
npm.cmd run qa:chatbot-case-intake
npm.cmd run qa:nutrition-knowledge-sources
npm.cmd run qa:food-intelligence-use-cases
npm.cmd run qa:chatbot-golden-suite:fast
```
