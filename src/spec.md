# Specification

## Summary
**Goal:** Add an additional admin sign-in option using a fixed username/password while keeping the existing Internet Identity admin sign-in flow working.

**Planned changes:**
- Add an Admin Sign-In form (username/id + password) as a separate option alongside the current Internet Identity admin sign-in.
- Implement a backend method in the Motoko canister to verify username/password and return success/failure.
- Establish and expose an admin-authenticated session state for route protection and admin-only backend calls after successful username/password login.
- Persist the admin username/password authentication configuration across canister upgrades, with initial defaults: username/id `adminumar`, password `umar9945`.
- Show an English error message on invalid username/password and deny admin access.

**User-visible outcome:** Admins can sign into `/app/admin` either via the existing Internet Identity flow or by entering username `adminumar` and password `umar9945`; any other credentials are rejected with an English error and admin routes remain blocked.
