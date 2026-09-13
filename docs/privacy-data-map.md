# Nutritail privacy data map

Status: technical baseline for legal review

Policy version: 2026-08-17

Last reviewed: 2026-08-17

This document records the personal-data processing currently implemented by
Nutritail. It is an engineering record, not a substitute for legal advice or a
full Article 30 record of processing activities where one is required.

## Processing activities

| Activity | Data categories | Purpose | Legal basis | Recipients/processors | Retention and deletion |
| --- | --- | --- | --- | --- | --- |
| Account and authentication | Email, authentication identifiers and security metadata | Create and secure the customer account | Contract; legitimate interests for security | Supabase | Until account deletion, subject to any mandatory legal hold |
| Customer profile | Name and account preferences | Provide and personalize the service | Contract | Supabase, Vercel | Until account deletion |
| Pet profile and analysis | Pet identity, species, breed, age, weight, health and nutrition inputs, generated analyses | Produce nutrition guidance requested by the customer | Contract; explicit consent where health-related information can identify the customer | Supabase, Vercel, OpenAI | Until the pet or account is deleted |
| Chat processing | Messages and nutrition inputs submitted during a request | Generate the requested response and recommendation | Contract | Vercel, OpenAI | Request content is processed for the response; persisted outputs follow the pet-analysis retention period |
| Nearby store lookup | City or postcode supplied for the current lookup | Return relevant local shops or online stores | User request / contract | Vercel and listed store services when a customer follows an external link | Not stored in the customer profile; request-level technical logs follow the 90-day period |
| Partner referral measurement | Partner, exact listing, action type and timestamp; no account, pet, area, IP, device or chat field | Produce aggregate, directional partner-performance metrics | Legitimate interests with data minimisation | Supabase, Vercel | 365 days through a daily retention job; not used as proof of sale or linked to an account export |
| Runtime monitoring | Request path, status, timing, IP-derived and user-agent metadata where recorded | Reliability, abuse prevention and incident investigation | Legitimate interests | Supabase, Vercel | 90 days, removed by the daily retention job |
| Chatbot feedback | Rating, feedback text and related technical context | Improve answer quality and investigate defects | Legitimate interests; optional analytics remains opt-in | Supabase, Vercel | 365 days, removed by the daily retention job |
| Product analytics preference | Consent state and consent history | Respect and demonstrate the customer's optional analytics choice | Consent; legal obligation/accountability for the audit record | Supabase | Preference and audit history until account deletion |
| Partner offers preference | Consent state and consent history | Send partner offers only after an affirmative opt-in | Consent | Supabase; a future messaging processor only after documented onboarding | Preference and audit history until account deletion |
| Legal-document acceptance | Account identifier, document type, version, acceptance time and source | Demonstrate acceptance of Terms and acknowledgement of the Privacy Notice | Contract; legal obligation/accountability | Supabase | Until account deletion, subject to a documented legal hold where required |
| Beta waitlist | Email, name, role, pet summary, stated goal and request metadata | Manage requested early access | Consent / user request | Supabase, Vercel | Removed during account erasure when the verified account email matches; otherwise until withdrawal or the waitlist purpose ends |
| Administrative audit | Actor identifiers, affected entity identifiers and action metadata | Security, accountability and support investigations | Legitimate interests; legal obligation where applicable | Supabase | Linked customer records are removed during account erasure; broader legal retention must be confirmed before launch |

## Customer controls

| Right or control | Product implementation |
| --- | --- |
| Information and transparency | `/privacy` and the authenticated `/account/privacy` center |
| Access and portability | Authenticated JSON download from `/api/account/privacy/export` |
| Erasure | Confirmed self-service deletion through `/api/account/privacy/delete` |
| Withdraw optional consent | Product analytics and partner-offer switches in `/account/privacy` |
| Rectification | Existing account and pet profile editing; support contact for other corrections |
| Objection or restriction | `info@nutritail.ai`, with identity verification before action |

## Security and minimization controls

- Browser clients cannot query the privacy tables directly. They use
  authenticated server routes and the Supabase service role remains server-only.
- Row Level Security is enabled on all public tables and direct grants are
  restricted according to each table's ownership model.
- Optional consent starts disabled and every change creates an audit event.
- Store-area input is request-scoped and is not written to the customer profile.
- Partner referral events are structurally anonymous within the application
  schema and never include account, pet, area, IP, device or conversation data.
- Export and erasure routes derive the account identity from the verified session;
  they do not trust a client-supplied user id.

## Incident response baseline

1. Contain the incident and preserve the minimum evidence needed to investigate.
2. Identify affected data, customers, processors, jurisdictions and likely harm.
3. Record the assessment and decision, including incidents that are not notified.
4. Notify the competent authority within 72 hours when GDPR Article 33 applies.
5. Notify affected people without undue delay when Article 34's high-risk test is met.
6. Complete remediation, processor follow-up and a documented post-incident review.

## Pre-launch legal and operational confirmations

- Confirm the controller's exact legal name, postal address and privacy contact.
- Execute and archive processor agreements, including international-transfer
  safeguards where applicable, for Supabase, Vercel and OpenAI.
- Decide whether a DPO, DPIA or formal Article 30 record is required.
- Define any mandatory tax, contract, dispute or safety retention that overrides a
  deletion request, and expose that exception in the public notice.
- Enable Supabase leaked-password protection and document security ownership.
- Review all future analytics, email and partner integrations before activation;
  no optional processing may rely on a pre-enabled switch.
