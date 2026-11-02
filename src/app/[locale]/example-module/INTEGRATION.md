# INTEGRATION.md — `example-module` module

Filled in by the external team. Lists everything the internal team needs to do **outside** the module folders when migrating to the Global Malaria Dashboard.

## 1. Identification

| Item | Value |
| --- | --- |
| Slug | `example-module` |
| i18n namespace | `ExampleModule` |
| Final URL | `/{locale}/example-module` |
| API routes | `GET /api/example-module/data?dataset=sample`, `POST /api/example-module/notifications` |
| Delivered version | _to fill in (sandbox tag or commit)_ |

## 2. Menu item (sidebar)

| Field | Value |
| --- | --- |
| Sidebar group | _to be defined by the internal team_ |
| `href` | `/example-module` |
| `translationKey` | `partners_subitem_example_module` (rename together with the keys in `i18n/*.json` if the group changes) |
| `tooltipTranslationKey` | `partners_subitem_example_module_tooltip` |
| Icon (lucide-react) | `Activity` |
| `New` tag | yes |

## 3. Environment variables

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `EXAMPLE_MODULE_SOURCE_URL` | no | `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv` | Published CSV of the external source; empty uses the bundled sample |
| `EXAMPLE_MODULE_NOTIFICATIONS_TOKEN` | yes (production) | `<long secret>` | Bearer token required by the notifications endpoint |
| `EXAMPLE_MODULE_REVALIDATE_SECONDS` | no | `300` | Cache of the external fetch, in seconds |

## 4. New dependencies

None. (If any, list name, version, justification and approval.)

## 5. External sources

| Source | Base URL | Authentication | Format | Update frequency | Cache tag | Contact |
| --- | --- | --- | --- | --- | --- | --- |
| _to fill in_ | | | CSV | | `example-module-sample` | |

## 6. Notifications endpoint

- Contract: see `README.md` (fields `eventId`, `type`, `occurredAt`, `data`).
- Sender: _who sends, how often, from which IP/service_.
- Secret: set `EXAMPLE_MODULE_NOTIFICATIONS_TOKEN` in the environment and the same value on the sender.
- Persistence: the delivery uses memory (`src/app/api/example-module/_lib/store.ts`); the internal team chooses the durable implementation (S3 or database) by replacing the class returned by `getNotificationStore()`.

## 7. Assets in `public/example-module/`

| File | Usage | Size |
| --- | --- | --- |
| `sample.csv` | Fallback for the `sample` dataset | < 5 KB |

## 8. Optional

- Localised URL (`/pt/...`, `/fr/...`): _not requested_. If requested, add to `pathnames` in the host's `src/config.ts`: `'/example-module': { en: '/example-module', fr: '...', pt: '...' }`.
- Standalone mode (no sidebar/header): _no_.
- Typed `Link`: the host only needs `'/example-module': '/example-module'` in `pathnames` if it uses `Link`/`useRouter` from `@/navigation` with that destination.

## 9. Limitations and pending items

- _to fill in_

## 10. Delivery checklist

- [ ] `npm run lint` green
- [ ] `npm run check:contract` green
- [ ] `npm run build` green (without `EXAMPLE_MODULE_SOURCE_URL`)
- [ ] Page opens at `/en/example-module`, `/fr/example-module`, `/pt/example-module`
- [ ] This file, `README.md` and `.env.example` updated
