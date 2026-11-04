# `unitaid` module: the LAUNCH Malaria Product Launch Dashboard

This folder and `src/app/api/unitaid/` are the only areas editable by the external team. Everything in here will be copied as-is into the Global Malaria Dashboard. What the internal team does outside them is in `INTEGRATION.md`.

The dashboard follows four antimalarial medicines along the market and country access pathway, with a country access map, in English, French and Portuguese, in Unitaid's brand (colours and the Source Sans 3 typeface).

## Responsibility of each folder

| Folder / file | What goes here |
| --- | --- |
| `page.tsx` | Server component: `generateMetadata`, the server-side read of the dataset (5-minute cache, `export const revalidate = 300`), a banner when the dataset has a format this code does not read, then `<PageContent />` |
| `page-content.tsx` | `"use client"`: the host header band and the dashboard, with the open medicine kept in the address (`?product=`) |
| `unsubscribe/page.tsx` | `/{locale}/unitaid/unsubscribe`, the page the subscriber emails link to |
| `error.tsx` | What the page shows if it fails |
| `components/` | The dashboard's React components: `pathway/`, `board/` (the medicines table), `map/`, `frame/` (header, Subscribe, Send feedback, footer), `unsubscribe/` |
| `utils/` | Pure code the browser also runs: formatting, the pathway and map logic, interface text |
| `lib/` | **Server-only** code, each file starting with `import "server-only"`: the dataset read and its checks (`data.ts`, `dataset.ts`), settings (`env.ts`), the form relays (`forms.ts`), notifications |
| `types/` | The notification types shared with the host's store |
| `data/` | `map-countries.json`: the map's country list |
| `styles/` | `launch-dashboard.css` and `feedback.css` |
| `i18n/` | Translations (`en`, `fr`, `pt`), same keys in all three |
| `fonts/` | Source Sans 3 (`files/*.woff2`, `index.ts`, licence) |
| `.env.example` | Every `UNITAID_*` variable |
| `INTEGRATION.md` | What the internal team needs to do outside the module |

## Quick rules

- The browser only calls this site: the dataset is read on the server, and the three forms post to `/api/unitaid/…`, which relay them on the server.
- `process.env` only in `lib/env.ts` and in `src/app/api/unitaid/**`; no `NEXT_PUBLIC_` variable.
- Allowed host imports: `@/navigation`, `@/fonts`, `@/utils/server/crypto`, `@/utils/common-functions`, `@/ui/dashboard/TARequestBanner`, `@/ui/dashboard/BottlenecksBanner`, `@/ui/dashboard/Modal`, `next-intl`. The module uses none of the banners or the modal.
- Host assets used: `/bg-programmatic-min.webp`, as the band behind the host's header.
- No user-visible string outside `i18n/`.
- `npm run check:contract` validates all of this; CI runs the same command.

Two choices differ from the starter's guidance, on purpose:

- **The page reads its data on the server** (`page.tsx`) instead of calling `/api/unitaid/data` from the browser: no extra network hop, and `next build` has no server to call. The route reads the same data through the same cache, for other callers.
- **Styles are scoped under one root class, `.launch-dashboard`**, not prefixed `.unitaid-`: every selector in `styles/` starts with it, and the components render inside that one element, so no rule reaches the host's page. It also undoes, inside that element only, the parts of the host's global reset the dashboard does not expect.

## Fonts

The dashboard uses Source Sans 3, Unitaid's brand typeface, as one variable font (upright and italic, weights 200–900), declared in `fonts/index.ts` with `next/font/local`. Its `variable` class sits on every `.launch-dashboard` root, and `styles/launch-dashboard.css` reads it as `var(--font-launch)`, with Arial as the fallback. Licence and source: `INTEGRATION.md`, section 10.

## Data source

The page and `GET /api/unitaid/data?dataset=en|fr|pt` read the LAUNCH published dataset, one JSON file per language (address in `lib/data.ts`, or `UNITAID_DATA_URL`), cached on the server for 5 minutes under the tag `launch-data-{locale}`.

- If the source cannot be read and nothing is cached, both use the copy bundled in `public/unitaid/data/`, say so in the server log, and the route adds `X-Unitaid-Source: fallback`. So the build and local development work without network access.
- If the source is in a format this code does not read (another `schema_version`, or another language), the copy is not used: the page shows a banner and the route answers 502.

## Forms

Subscribe for updates, Send feedback and the unsubscribe page post to `/api/unitaid/subscribe`, `/feedback` and `/unsubscribe`. Each relays the request on the server to the LAUNCH forms service with `UNITAID_FORMS_URL` and `UNITAID_FORMS_TOKEN`, and returns its answer unchanged. Without those two settings, Subscribe is hidden, Send feedback is not connected and the relays answer 503.

## Notifications

`POST /api/unitaid/notifications` requires `Authorization: Bearer <UNITAID_NOTIFICATIONS_TOKEN>` and a JSON body with `eventId`, `type` (`dataset.updated`), `occurredAt` (ISO 8601 with an offset) and `data.dataset` (`en`, `fr` or `pt`).

```bash
curl -X POST http://localhost:3000/api/unitaid/notifications \
  -H "Authorization: Bearer change-me" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt-001","type":"dataset.updated","occurredAt":"2026-10-27T12:00:00Z","data":{"dataset":"en"}}'
```

| Response | Meaning |
| --- | --- |
| 202 | Accepted: the new file was read and that language's cache expired; recorded |
| 200 `duplicate: true` | `eventId` already received; nothing done |
| 400 | Invalid JSON or fields; the answer lists every problem |
| 401 | Missing or invalid token |
| 413 | Body larger than 1 MB |
| 502 | The new file cannot be used (unreachable, not JSON, another `schema_version`); the cached copy is kept and the event is not recorded, so it can be sent again |
| 503 | `UNITAID_NOTIFICATIONS_TOKEN` not configured on the server |

The current persistence is in memory (`src/app/api/unitaid/_lib/store.ts`) and does not survive restarts; the durable implementation is decided by the internal team during integration.
