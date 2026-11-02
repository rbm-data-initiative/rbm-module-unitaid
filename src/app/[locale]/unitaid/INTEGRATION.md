# INTEGRATION.md — `unitaid` module

Filled in by the external team. Lists everything the internal team needs to do **outside** the module folders when migrating to the Global Malaria Dashboard.

## 1. Identification

| Item | Value |
| --- | --- |
| Slug | `unitaid` |
| i18n namespace | `Unitaid` |
| Final URL | `/{locale}/unitaid` |
| API routes | `GET /api/unitaid/data?dataset=sample`, `POST /api/unitaid/notifications` |
| Delivered version | _to fill in (sandbox tag or commit)_ |

## 2. Menu item (sidebar)

| Field | Value |
| --- | --- |
| Sidebar group | _to be defined by the internal team_ |
| `href` | `/unitaid` |
| `translationKey` | `partners_subitem_unitaid` (rename together with the keys in `i18n/*.json` if the group changes) |
| `tooltipTranslationKey` | `partners_subitem_unitaid_tooltip` |
| Icon (lucide-react) | `Activity` |
| `New` tag | yes |

## 3. Environment variables

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `UNITAID_SOURCE_URL` | no | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv` | Published CSV of the external source; empty uses the bundled sample |
| `UNITAID_NOTIFICATIONS_TOKEN` | yes (production) | `<long secret>` | Bearer token required by the notifications endpoint |
| `UNITAID_REVALIDATE_SECONDS` | no | `300` | Cache of the external fetch, in seconds |

## 4. New dependencies

None. (If any, list name, version, justification and approval.)

## 5. External sources

| Source | Base URL | Authentication | Format | Update frequency | Cache tag | Contact |
| --- | --- | --- | --- | --- | --- | --- |
| _to fill in_ | | | CSV | | `unitaid-sample` | |

## 6. Notifications endpoint

- Contract: see `README.md` (fields `eventId`, `type`, `occurredAt`, `data`).
- Sender: _who sends, how often, from which IP/service_.
- Secret: set `UNITAID_NOTIFICATIONS_TOKEN` in the environment and the same value on the sender.
- Persistence: the delivery uses memory (`src/app/api/unitaid/_lib/store.ts`); the internal team chooses the durable implementation (S3 or database) by replacing the class returned by `getNotificationStore()`.

## 7. Assets in `public/unitaid/`

| File | Usage | Size |
| --- | --- | --- |
| `sample.csv` | Fallback for the `sample` dataset | < 5 KB |

## 8. Optional

- Localised URL (`/pt/...`, `/fr/...`): _not requested_. If requested, add to `pathnames` in the host's `src/config.ts`: `'/unitaid': { en: '/unitaid', fr: '...', pt: '...' }`.
- Standalone mode (no sidebar/header): _no_.
- Typed `Link`: the host only needs `'/unitaid': '/unitaid'` in `pathnames` if it uses `Link`/`useRouter` from `@/navigation` with that destination.

## 9. Limitations and pending items

- _to fill in_

## 10. Delivery checklist

- [ ] `npm run lint` green
- [ ] `npm run check:contract` green
- [ ] `npm run build` green (without `UNITAID_SOURCE_URL`)
- [ ] Page opens at `/en/unitaid`, `/fr/unitaid`, `/pt/unitaid`
- [ ] This file, `README.md` and `.env.example` updated
