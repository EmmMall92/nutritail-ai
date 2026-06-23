# Dog 201-600 Fixture Integrity QA

Generated: 2026-06-23T06:22:21.757Z
Fixture: `data/evals/chatbot-extra-cases-dog-201-600.json`
Result: PASS

## Summary

- Cases checked: 400
- Expected cases: 400
- Issues: 0

## Checks

- Sequential numeric IDs from `201` to `600`
- Prompt text is present
- Prompt text does not contain common Greek mojibake markers
- Goal is one of the supported live QA goals
- Safety level is one of `normal`, `vet_referral`, `emergency`
- Expected extraction object exists and uses `species: dog`
- Checks object exists

## Issues

- None
