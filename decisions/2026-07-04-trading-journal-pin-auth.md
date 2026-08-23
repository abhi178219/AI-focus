## Decision: Trading journal auth uses email + 4-digit numeric PIN (sign-in, self-service sign-up, forgot-PIN reset), mapped internally to a longer Supabase Auth password

## Context: Needed a login flow now that real Supabase credentials were wired into the app (previously running in demo mode with no auth at all, which meant RLS silently blocked all reads/writes). User explicitly requested email + 4-digit PIN as the credential, with a forgot-PIN flow, and self-service sign-up (not just sign-in for pre-created accounts).

## Alternatives considered:
- **Standard email + password (6+ chars)** — Supabase's native default, stronger entropy, no extra mapping layer needed.
- **Magic link / OTP only** — no password/PIN to remember or leak, but user specifically wanted a PIN-based flow.
- **Email + 4-digit PIN, mapped to a longer internal string** (chosen) — matches the user's explicit request for a fast, simple credential; Supabase's default minimum password length (6 chars) is satisfied by prefixing the PIN (`tj-pin-XXXX`) before calling Supabase Auth, so no dashboard config change was needed.

## Reasoning: User explicitly asked for the PIN-based UX. Implemented as a thin mapping layer (`src/lib/auth.js`) so the constraint lives in one place and the rest of the app just calls `signInWithPin`/`signUpWithPin`/`confirmNewPin`.

## Trade-offs accepted: A 4-digit PIN has only 10,000 possible combinations — meaningfully weaker than a real password. Acceptable for personal/small-scale use as stated by the user, but this should NOT be used as-is if the app is ever opened to a broader public user base without adding brute-force protection (Supabase has some built-in rate limiting on auth endpoints, but no PIN-specific lockout was added). Revisit if/when the multi-user scope grows beyond a small trusted group.

## Supersedes: None
