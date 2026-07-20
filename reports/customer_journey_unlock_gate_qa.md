# Customer Journey Unlock Gate QA

Generated: 2026-07-20T20:33:57.822Z

This report is customer-product evidence, not a substitute for a logged-in browser smoke test.
It proves that the five Customer UX unlock journeys have protected code paths across chatbot, account, report, timeline, and CI scripts.

## Summary

- Result: PASS
- Journeys checked: 5
- Evidence markers checked: 68
- Unlock gates covered: Full recommendation journey proof, Returning pet proof, Report/account proof
- Next manual proof: run these same journeys on production with a logged-in customer account.

## Journey Evidence

| Journey | Unlock gate | Evidence markers | Files checked | Customer goal |
| --- | --- | ---: | --- | --- |
| new-pet-recommendation-to-grams | Full recommendation journey proof | 15 | chatbot, account, report, timeline, packageJson | A new customer completes intake, sees 3 premium + 3 value food choices, taps one, and gets grams/day. |
| save-analysis-to-report-and-profile | Full recommendation journey proof | 12 | chatbot, account, report, timeline, packageJson | A customer saves the chosen food, then can open profile, report, timeline, and progress check. |
| returning-pet-progress-check | Returning pet proof | 12 | chatbot, account, report, timeline, packageJson | A returning customer chooses a saved pet and records progress without restarting intake. |
| returning-pet-no-result-or-food-change | Returning pet proof | 13 | chatbot, account, report, timeline, packageJson | A returning customer can say the plan did not work, request a new food, or change flavour/brand. |
| mobile-report-account-handoff | Report/account proof | 16 | chatbot, account, report, timeline, packageJson | A mobile customer can read the report/account handoff and knows what to do today and when to return. |

## Manual Live Follow-Up

1. Create or log in to a QA customer account.
2. Run a new-pet recommendation until 3 premium/value food cards are visible.
3. Choose one food and confirm grams/day appears.
4. Save the analysis and open profile, printable report, and timeline.
5. Return to the same pet for progress check, no-result advice, and flavour/brand change.
