# Specification

## Summary
**Goal:** Build the HandyConnect web MVP for local worker discovery and booking requests with role-based access, persistent data, and a consistent warm visual theme.

**Planned changes:**
- Create and apply a coherent HandyConnect visual theme (non-blue/non-purple primary palette), with responsive mobile/desktop layouts.
- Add Internet Identity sign-in/sign-out and a first-time onboarding step to choose and persist account type (Client or Worker).
- Implement role-based navigation, routing, and page access (unauthenticated users directed to sign-in/onboarding).
- Build Worker profile creation/editing for Workers (display name, category, description, service area, hourly rate) with backend persistence and owner-only editing.
- Build client worker discovery: browse list, filter by category, sort by hourly rate (asc/desc), and worker detail pages.
- Implement bookings: clients create requests (requested date/time text, job details, location), workers accept/decline, clients cancel before acceptance; enforce booking visibility to only involved client/worker.
- Add dashboards: Client (upcoming vs past bookings) and Worker (profile completion status, bookings grouped by status with actions).
- Implement backend persistence and authorization in a single Motoko actor for user role, worker profiles, and bookings, with query endpoints needed by the UI.
- Generate static logo and hero illustration assets under `frontend/public/assets/generated` and render them in the app shell.

**User-visible outcome:** Users can sign in with Internet Identity, choose Client or Worker, and then (as a client) browse and book local workers or (as a worker) manage a profile and respond to booking requests, with dashboards and role-appropriate navigation.
