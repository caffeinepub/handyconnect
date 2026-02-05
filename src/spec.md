# Specification

## Summary
**Goal:** Restore admin portal access by using Internet Identity as the source of truth and enabling a secure token-based admin bootstrap flow.

**Planned changes:**
- Backend: Add an Internet Identity admin bootstrap method that accepts a secret token and elevates the caller to admin on success, returning a non-trapping failure when the token is unset or incorrect.
- Backend: Fix admin credential sign-in so it no longer fails due to requiring the caller to already be admin when elevation is successful, or explicitly disable credential-based elevation with a clear non-trapping failure response.
- Frontend: Remove duplicate React Query and Internet Identity provider initialization so only one QueryClientProvider and one InternetIdentityProvider are active at runtime (without modifying immutable paths).
- Frontend: Update Admin Sign-In UI to support II login plus a token-based bootstrap form for authenticated non-admin users; on success, refresh admin status and redirect to `/app/admin`.
- Frontend/Routes: Ensure admin route protection relies on a single, stable admin-status source derived from Internet Identity so `/app/admin` works end-to-end after bootstrap and remains protected for non-admins.

**User-visible outcome:** An admin can log in with Internet Identity, bootstrap admin access with a token when needed, and reliably access `/app/admin`; non-admin II users remain blocked from admin pages and data.
