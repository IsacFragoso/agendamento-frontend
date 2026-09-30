# Frontend architecture

Single-page app for the appointment-booking system (school project). The backend is a separate repository, <https://github.com/IsacFragoso/agendamento-backend>: a NestJS REST API under `/api`.

**Stack:** React 19, Vite 8, React Router 7, JavaScript/JSX (not TypeScript), plain CSS, `fetch`-based HTTP helpers, an auth context.

Code and package manifests are the source of truth; keep this file aligned with the current implementation.

```text
Browser (React SPA)  ──fetch, JSON, Authorization: Bearer <JWT>──▶  NestJS API (/api)  ──▶  PostgreSQL
```

The SPA only talks to the API. It never touches the database, and it cannot enforce rules on its own: the backend is the final authority on permissions and on booking conflicts.

## 1. Folder structure

```text
src/
├── core/      # app wiring: router, auth context, HTTP helpers
├── modules/   # one folder per feature (pages, hooks, services)
│   ├── auth/         # login, registration, account settings
│   ├── appointments/ # appointment requests and status updates
│   ├── dashboard/    # client/provider dashboards and provider portfolio
│   ├── schedules/    # provider availability
│   └── services/     # services, categories, and provider service state
└── shared/    # reusable components and helpers with no feature logic
```

Small module example: `modules/schedules/` contains the endpoint service and stateful hook:

```text
modules/schedules/
├── hooks/useProviderSchedule.js
└── services/schedules.service.js
```

`ProviderDashboardPage.jsx` composes `useProviderSchedule`; the hook owns loading, form state, and save/remove operations; the service owns schedule endpoint paths and HTTP methods.

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
| HTTP helper (`core`) | Sends requests, attaches a supplied token, normalizes errors | Know about features |
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

- Login calls `POST /auth/login`; the response provides `access_token` and `usuario`.
- The auth context exposes `token`, `user`, `isAuthenticated`, `login`, and `logout`. The session is persisted in `localStorage` under `agendamento-web/session`; logout clears the client-side session.
- The HTTP helper attaches `Authorization: Bearer <token>` when a request is given a token.
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

The backend stores appointment timestamps in UTC. The UI displays and converts appointment times in `America/Sao_Paulo` using `src/shared/utils/format.js`. Never rely on the browser's default zone or construct timestamps from local-time strings.

## 7. Configuration

- API base URL: `VITE_API_BASE_URL`, defaulting to `http://localhost:8000/api`; the frontend has no Vite API proxy.
- Vite serves from `/` in development and builds with `/agendamento-frontend/` as its base path in production.
- Environment variables are read through `import.meta.env` and must start with `VITE_`. Never put secrets in them; everything in a Vite bundle is public.

## 8. Testing

Automated tests use Vitest with jsdom and run with `npm test`. The current suite covers route helpers, auth session expiry, date/time formatting, and provider-card mapping. Run `npm run lint` and `npm run build` as well.

## 9. Adding a feature (checklist)

1. Confirm the endpoint's path, request body and response with the backend team or the backend repo.
2. Create `modules/<feature>/` following the small `modules/schedules/` example: endpoint calls in a service, request/UI state in a hook, and screen composition in a page or the owning page.
3. Write the service (API calls), then the hook, then the page and components.
4. Register the route in the router; protect it if it needs a session.
5. Handle loading, error, empty and (for bookings) conflict states.
6. Run lint and build; test the flow manually.

## 10. Not in this project (on purpose)

- No TypeScript: do not rename files to `.tsx` or add type-only tooling.
- No UI framework, state-management library or API-client library.
- User-facing copy is Brazilian Portuguese (`pt-BR`); there is no i18n framework. Routes are defined in `core/router/paths.js` and wired in `core/router/AppRouter.jsx`.
- Appointment status updates currently accept `PENDENTE`, `CONFIRMADO`, `CANCELADO`, or `CONCLUIDO` and are provider/admin operations. There is no appointment rescheduling endpoint or client cancellation action in the current API; do not invent those flows in the frontend.
