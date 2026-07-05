# NutriTail Auth Emails With Resend

Goal: Supabase Auth should still manage secure confirmation and recovery links, but customers should receive branded NutriTail emails sent through Resend.

## What Changes

- Sender becomes `NutriTail AI <no-reply@nutritail.ai>` or another verified address on the NutriTail domain.
- Delivery, bounces, and complaints are visible in Resend.
- Supabase remains the auth source of truth.
- Email templates use NutriTail language and do not mention Supabase.

## Resend Setup

1. In Resend, add and verify the domain `nutritail.ai`.
2. Add the DNS records Resend gives you for SPF/DKIM/MX.
3. Create or use a Resend API key for SMTP.
4. In Supabase, go to `Authentication -> Email -> SMTP Settings`.
5. Enable custom SMTP and set:

| Field | Value |
| --- | --- |
| Sender name | `NutriTail AI` |
| Sender email | `no-reply@nutritail.ai` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Resend API key |

Resend also has a native Supabase integration that can auto-fill the SMTP settings. Manual setup is still useful as a checklist.

## Supabase Templates

Paste the HTML files from `docs/email/supabase-auth-templates/` into the matching Supabase email template screens:

| Supabase template | File |
| --- | --- |
| Confirm sign up | `confirm-signup.html` |
| Reset password | `reset-password.html` |
| Magic link / OTP | `magic-link.html` |
| Invite user | `invite-user.html` |
| Confirm email change | `email-change.html` |
| Reauthentication | `reauthentication.html` |
| Password changed notification | `password-changed.html` |

Recommended subjects:

- Confirm sign up: `Επιβεβαίωσε τον λογαριασμό σου στο NutriTail`
- Reset password: `Επαναφορά κωδικού NutriTail`
- Magic link: `Ο σύνδεσμος σύνδεσης στο NutriTail`
- Invite user: `Πρόσκληση στο NutriTail`
- Confirm email change: `Επιβεβαίωσε το νέο email σου`
- Reauthentication: `Ο κωδικός επιβεβαίωσης NutriTail`
- Password changed notification: `Ο κωδικός σου άλλαξε`

## QA Checklist

- Send a signup confirmation to a real inbox.
- Check From name and address.
- Confirm the button opens `https://nutritail.ai` and not a Supabase-branded page.
- Check mobile Gmail and mobile Outlook rendering.
- Check spam/promotions folder.
- Confirm the same flow works for password reset.
- In Resend, confirm delivered status and no bounce/complaint.

## Future Asset

If NutriTail later sends non-auth emails, use Resend API from the app for:

- saved report email
- weekly progress reminder
- beta invite
- customer support confirmation

Auth emails should stay on Supabase Auth SMTP unless we intentionally move to a Send Email Hook.
