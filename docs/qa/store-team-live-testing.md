# Store Team Live Testing

Use this checklist before inviting pet-shop colleagues to test NutriTail with
the live customer flow.

## 1. Activate the store assortment

Open `/admin/foods/v2-recommendation-visibility`.

In **Store testing catalog**:

1. Add one brand per line only when the stores carry the full imported range.
2. Prefer `Brand | Exact product name` when only specific formulas are stocked.
3. Select **Preview matches**.
4. Resolve every unmatched or ambiguous entry.
5. Confirm the number of matched Food V2 rows.
6. Select **Use only matched products**.

Applying the list changes product eligibility only. It does not change
nutrition scores, safety rules, or product data.

## 2. Run a short owner smoke test

Before sharing the link, test:

- a healthy adult dog;
- a sterilised small dog;
- a large-breed puppy;
- a chicken-allergy case;
- a urinary cat red flag.

Confirm that every recommendation is sold by the stores and that safety
interrupts still stop shopping advice.

## 3. Team testing guidance

Ask colleagues to use fictional pet names and test profiles first. For each
conversation, record:

- pet profile and goal;
- foods proposed;
- any product that is not stocked;
- any clearly unsuitable recommendation;
- whether the explanation was easy to understand;
- whether the grams-per-day step worked;
- device and browser.

Use the chatbot feedback action immediately after a problematic answer so the
admin analytics retain the relevant query and recommendation context.

## 4. Release rule

Do not widen the active assortment to fix a missing recommendation. First
confirm that the formula is genuinely stocked, correctly matched in Food V2,
and nutritionally eligible for the pet profile.
