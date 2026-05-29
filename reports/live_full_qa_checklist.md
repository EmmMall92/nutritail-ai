# Nutritail AI Live QA Checklist

Use this checklist after deploying the combined product polish PR.

## Live Deploy Check

- Open `https://nutritail.ai/account` after login.
- Confirm the dashboard shows saved pets, saved analyses, ready reports, pets needing analysis, latest report, and quick actions.
- Open `https://nutritail.ai/account/chatbot`.
- Confirm quick replies still work and free-text input still works.
- Open `https://nutritail.ai/account/pets`.
- Confirm pet readiness badges and report metrics display.
- Open `https://nutritail.ai/admin/chat-feedback` as admin.
- Confirm filters, not-helpful patterns, cleanup batches, and raw log still load.

## Full User Flow

1. Log in as a normal customer.
2. Start a chatbot analysis from `/account/chatbot`.
3. Use quick replies for at least species, activity, neutered status, and weight goal.
4. Enter a current food that should match a known formula.
5. Save the analysis.
6. Open the saved pet profile from the chatbot success message.
7. Open the printable report from the chatbot success message or pet page.
8. Return to `/account/pets` and confirm report readiness.
9. Submit helpful or not-helpful feedback after a saved analysis.
10. Log in as admin and confirm the event appears in `/admin/chat-feedback`.

## Comparison Flow

- In `/account/chatbot`, send `compare Royal Canin Mini Adult vs Farmina N&D Pumpkin Lamb`.
- Confirm the response lists both items, nutrition fields, missing fields, cautions, and a short meaning/next-step section.
- Send a comparison with one vague product name and confirm it asks for a more exact product name instead of overclaiming.

## Pass Criteria

- No page is stuck loading.
- No customer route redirects unexpectedly after login.
- Chatbot save result includes pet profile, printable report, and new analysis links.
- Admin feedback grouping reflects not-helpful feedback by type, food/query, and goal.
- Printable report opens for a saved pet.
