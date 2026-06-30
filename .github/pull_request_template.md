## Summary

- 

## Test Plan

- [ ] `npm run check`

## Chatbot / Recommendation Changes

If this PR changes chatbot intake, Food V2 recommendation ranking, customer
recommendation copy, nutrition rules, or medical/safety guardrails:

- [ ] `npm.cmd run qa:chatbot-golden-suite:fast`
- [ ] Confirm customer-facing copy does not expose scores, review status, source tiers, or missing-field internals.
- [ ] Confirm food cards still give a clear next action for portion estimates.

## Live Follow-Up

After merge/deploy, run when this PR affects live chatbot, auth, admin Food V2,
or recommendation behavior:

- [ ] `npm.cmd run qa:post-deploy-readiness:refresh-chatbot`
