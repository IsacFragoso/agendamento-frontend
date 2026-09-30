# Frontend architecture

Single-page app for the appointment-booking system (school project). The backend is a separate repository, `TODO: GitHub URL of agendamento-backend`: a NestJS REST API under `/api`.

**Stack:** React 19, Vite 8, React Router 7, JavaScript/JSX (not TypeScript), plain CSS, `fetch`-based HTTP helpers, an auth context.

> Placeholders marked `TODO` need facts from the repo. Describe what the code does today; if the code and this file disagree, the code wins and this file should be fixed.

```text
Browser (React SPA)  ──fetch, JSON, Authorization: Bearer <JWT>──▶  NestJS API (/api)  ──▶  PostgreSQL
```

The SPA only talks to the API. It never touches the database, and it cannot enforce rules on its own: the backend is the final authority on permissions and on booking conflicts.

## 1. Folder structure

```text
src/
├── core/      # app wiring: router, auth context, HTTP helpers
├── modules/   # one folder per feature (pages, hooks, services)
│   └── TODO: auth/, appointments/, ...
└── shared/    # reusable components and helpers with no feature logic
```

Typical feature folder (`TODO: adjust to what the repo really has`):

```text
modules/<feature>/
├── <Feature>Page.jsx      # composes the screen
├── components/            # pieces used only by this feature
├── hooks/                 # state, effects, data fetching
└── services/              # API calls and API-to-UI mapping
```

## 2. Data flow

```text
Router → Page → Hook → Service → HTTP helper → API
```

| Piece | Does | Does not |
| --- | --- | --- |
| Router (`core`) | Maps URLs to pages, protects private routes | Contain business logic |
| Page | Composes the screen from components | Call `fetch` directly |
| Hook | Owns state, loading/error handling and effects | Know URLs or response formats |
| Service | Knows endpoints; maps API data to what the UI needs | Hold React state |
| HTTP helper (`core`) | Sends requests, attaches the token, normalizes errors | Know about features |
| Shared component | Renders generic UI | Contain feature or booking rules |

## 3. Dependency rules

```text
modules  →  shared  →  core
```

- `modules` may import `shared` and `core`. `shared` may import `core`. `core` and `shared` never import `modules`.
- The router in `core` is the one exception, because it wires pages from `modules`.
- A module never imports another module. If two features need the same thing, move it to `shared`.
- Move code to `shared` only when at least two features really use it.

## 4. Authentication

- Login calls `TODO: endpoint`; the JWT is stored in `TODO: memory / localStorage / other`.
- The auth context holds the current user and exposes `TODO: login, logout`.
- The HTTP helper attaches `Authorization: Bearer <token>` to every request.
- `401` (missing, expired or revoked token): clear the session and redirect to login.
- `403` (authenticated but not allowed): show a "not allowed" message; do not log the user out.
- Hiding a button is only UX. The backend enforces permissions.

## 5. Handling requests in the UI

- Every fetch has three distinct states: loading, error and empty. An empty list is not a loading list.
- Stale responses must not overwrite newer data: use `AbortController` or an ignore flag in effects.
- A cancelled request (unmount, parameter change) is not shown as an error.
- Form validation is for UX only; show the backend's field errors when it rejects input.
- A booking conflict (`409`) shows a clear message and refreshes the available slots.

## 6. Dates and time zones

The backend stores UTC. The UI shows times in `TODO: America/Sao_Paulo`, formatted explicitly. Never rely on the browser's default zone and never build dates from local-time strings.

## 7. Configuration

- API base URL: `TODO: e.g. VITE_API_URL, or a Vite dev proxy`.
- Environment variables are read through `import.meta.env` and must start with `VITE_`. Never put secrets in them; everything in a Vite bundle is public.

## 8. Testing

`TODO: describe the setup, or "no automated tests; changes are verified manually" and list the main flows to check (login, list appointments, book, cancel, session expiry).`

## 9. Adding a feature (checklist)

1. Confirm the endpoint's path, request body and response with the backend team or the backend repo.
2. Create `modules/<feature>/` following the reference module (`TODO: which one`).
3. Write the service (API calls), then the hook, then the page and components.
4. Register the route in the router; protect it if it needs a session.
5. Handle loading, error, empty and (for bookings) conflict states.
6. Run lint and build; test the flow manually.

## 10. Not in this project (on purpose)

- No TypeScript: do not rename files to `.tsx` or add type-only tooling.
- No UI framework, state-management library or API-client library.
- No i18n or route/menu registries. `TODO: confirm.`
