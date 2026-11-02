# `unitaid` module

This folder and `src/app/api/unitaid/` are the only areas editable by the external team. Everything in here will be copied as-is into the Global Malaria Dashboard.

## Responsibility of each folder

| Folder / file | What goes here |
| --- | --- |
| `page.tsx` | Server component: only `generateMetadata` and `<PageContent />` |
| `page-content.tsx` | `"use client"`: page composition |
| `components/` | React components exclusive to the module (charts, filters, cards) |
| `hooks/` | Hooks (e.g. `useUnitaidDataset`) |
| `services/` | Typed calls to `/api/unitaid/...` (client-side) |
| `lib/` | **Server-only** code: external sources, parsers, cache, env. Starts with `import "server-only"` |
| `types/` | Types and contracts shared between the page and the API |
| `utils/` | Pure functions (formatters, chart options) |
| `data/` | Small static data (lists, mappings). Larger assets go in `public/unitaid/` |
| `styles/` | Module's own CSS, classes prefixed with `.unitaid-` |
| `i18n/` | Module translations (`en`, `fr`, `pt`), same keys in all three |
| `.env.example` | Every `UNITAID_*` variable with an example value |
| `INTEGRATION.md` | What the internal team needs to do outside the module |

## Quick rules

- The browser only calls `/api/unitaid/...`; external sources and secrets stay in `lib/` and in the API routes.
- `process.env` only in `lib/env.ts` and in `src/app/api/unitaid/**`.
- Allowed host imports: `@/navigation`, `@/fonts`, `@/utils/server/crypto`, `@/utils/common-functions`, `next-intl`.
- No user-visible string outside `i18n/`.
- `npm run check:contract` validates all of this; CI runs the same command.

## Sample data source

`GET /api/unitaid/data?dataset=sample` reads `UNITAID_SOURCE_URL` (published CSV) and, if the variable is empty or the source fails, uses `public/unitaid/sample.csv`. The build and local development work without network access.

## Notifications

`POST /api/unitaid/notifications` requires `Authorization: Bearer <UNITAID_NOTIFICATIONS_TOKEN>` and a JSON body with `eventId`, `type`, `occurredAt` (ISO 8601) and optional `data`.

```bash
curl -X POST http://localhost:3000/api/unitaid/notifications \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt-001","type":"dataset.updated","occurredAt":"2026-10-27T12:00:00Z","data":{"dataset":"sample"}}'
```

| Response | Meaning |
| --- | --- |
| 202 | Accepted and recorded; dataset cache invalidated |
| 200 `duplicate: true` | `eventId` already received |
| 400 | Invalid JSON or missing fields |
| 401 | Missing or invalid token |
| 413 | Body larger than 1 MB |
| 503 | `UNITAID_NOTIFICATIONS_TOKEN` not configured on the server |

The current persistence is in memory (`src/app/api/unitaid/_lib/store.ts`) and does not survive restarts; the durable implementation is decided by the internal team during integration.
