# Specification

## Summary
**Goal:** Make HandyConnect an installable Progressive Web App (PWA) with offline-capable app-shell behavior.

**Planned changes:**
- Add a Web App Manifest to frontend static assets and link it from the HTML entry point (including name/short_name, start_url, standalone display, theme/background colors, and required icons).
- Add and register a service worker from a non-immutable file to precache built static assets, serve `index.html` for navigation requests, and provide an offline fallback for uncached requests.
- Update the HTML entry point with required PWA metadata (manifest link, theme-color, and Apple PWA meta tags) while avoiding changes to immutable frontend paths.

**User-visible outcome:** Users can install HandyConnect from supported browsers (“Add to Home screen” / “Install app”), reopen it offline to a functioning app shell (or explicit offline page), and navigate client-side routes offline without hitting network 404 errors.
