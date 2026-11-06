# INTEGRATION.md — `unitaid` module

Filled in by the external team. Lists everything the internal team needs to do **outside** the module folders when migrating to the Global Malaria Dashboard.

The module is the LAUNCH Malaria Product Launch Dashboard: four antimalarial medicines followed along the market and country access pathway, with a country access map, in English, French and Portuguese.

## 1. Identification

| Item | Value |
| --- | --- |
| Slug | `unitaid` |
| i18n namespace | `Unitaid` |
| Final URL | `/{locale}/unitaid`, plus `/{locale}/unitaid/unsubscribe` (the page the subscriber emails link to) |
| API routes | `GET /api/unitaid/data?dataset=en\|fr\|pt`, `POST /api/unitaid/notifications`, `POST /api/unitaid/subscribe`, `POST /api/unitaid/feedback`, `POST /api/unitaid/unsubscribe` |
| Delivered version | `v1.4.0` |

`GET /api/unitaid/data` is a public contract (the internal team's planned AI agent may read it): one language of the dataset as JSON, cached on the server for 5 minutes, the same data the page shows. It answers 400 for a missing or unknown `dataset` and 502 when the source cannot be read. The page does not call it; it reads the data on the server itself. Since v1.2.0 (Unitaid, 5 Nov 2026), ASPY's and DHA–PPQ's procurement figures are withheld until they are confirmed: their `detail.volume` is `null`, and a new field, `detail.procurement.presentations`, lists the presentations bought, with no figures. Since v1.3.0 (6 Nov 2026), `stages[1]` is "Stringent Regulatory Approval (SRA)", and two new optional fields give a step's name on a medicine that has not completed it: `stageInfo[i].pendingName` (stage 2: "Stringent Regulatory Review (SRA)") and, for one medicine, `products[].stages[i].pendingName`, which wins (Ganaplacide–lumefantrine: "Stringent Health Authority Review (SRA)"). The medicine with id `ganlum` is now named "Ganaplacide–lumefantrine" (was "GanLum"), with `inn` "KLU156".

The three form routes relay to the LAUNCH forms service (section 5); the browser only ever calls this site. A `GET` to any of them answers 405 with `Allow: POST`.

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

All four are read on the server only, in `lib/env.ts`. The values are sent privately; `.env.example` lists the names.

| Variable | Required | Example | Description |
| --- | --- | --- | --- |
| `UNITAID_DATA_URL` | no | `https://…/v1/dashboard.{locale}.json` | Address of the published dataset, `{locale}` where the language goes. Empty uses the address in `lib/data.ts` (section 5) |
| `UNITAID_NOTIFICATIONS_TOKEN` | yes (production) | `<64 hex characters>` | Bearer token required by the notifications endpoint. Empty: every notification gets 503 |
| `UNITAID_FORMS_URL` | yes, for the forms | `https://<forms service>/functions/v1` | Base address of the LAUNCH forms service, https, no trailing slash |
| `UNITAID_FORMS_TOKEN` | yes, for the forms | `<at least 32 characters>` | Token this site's server sends to the forms service |

Without both forms variables the page still works, but Send feedback is not connected and the three relays answer 503. (Subscribe for updates is switched off for now whatever these are set to; see section 9.) The page checks them each time it is rendered (at build, then at each 5-minute refresh), so set them before the build. The tokens are read on every request, so changing one needs no new build.

## 4. New dependencies

None beyond the host's own. The country map uses `maplibre-gl` 6.14.0, which the host already lists (approved and added in the host sync of 3 Nov 2026). Versions up to 6.4.0 carry a critical XSS advisory, so keep 6.14.0 or a later 6.x. When upgrading it, replace `public/unitaid/maplibre-gl-worker.mjs` with the worker of the same version (section 7).

## 5. External sources

| Source | Base URL | Authentication | Format | Update frequency | Cache tag | Contact |
| --- | --- | --- | --- | --- | --- | --- |
| LAUNCH published dataset | `https://quantum-sage-technologies.github.io/unitaid-launch-data/v1/dashboard.{locale}.json` | none (public) | JSON, `schema_version` 1, one file per language (`en`, `fr`, `pt`) | when the LAUNCH team publishes approved changes; the publishing pipeline then calls the notifications endpoint (section 6) | `launch-data-{locale}` | LAUNCH team |
| LAUNCH forms service | value of `UNITAID_FORMS_URL` | bearer token (`UNITAID_FORMS_TOKEN`), server to server | JSON over HTTPS `POST` | on each Subscribe, Send feedback or Unsubscribe | not cached | LAUNCH team |

Both are called from the server only. The browser loads nothing from other sites: the map's shapes, its worker, the logos and the font are all served from this site. The page links (no requests) to unitaid.org and to the WHO Malaria Threats Map.

## 6. Notifications endpoint

- Contract: see `README.md` (fields `eventId`, `type`, `occurredAt`, `data`). The only `type` is `dataset.updated`, with `data.dataset` one of `en`, `fr`, `pt`.
- What it does: on 202, it has read that language's new file past the cache and expired the tag `launch-data-{locale}`, so the next visitor gets the new data; after answering, it reads the file into the cache again. A file it cannot use (unreachable, not JSON, another `schema_version`) gets 502 and the cached copy is left alone.
- Sender: the LAUNCH publishing pipeline, after each approved publish. **Not built yet**: it needs this site's production address and the token.
- Secret: set `UNITAID_NOTIFICATIONS_TOKEN` in the environment and the same value on the sender. Separate tokens for test and production.
- Persistence: the route uses `getNotificationStore()` from `src/app/api/unitaid/_lib/store.ts` unchanged (memory); the internal team chooses the durable implementation (S3 or database) by replacing the class it returns. An event is saved only after a successful refresh, so a 502 can be retried with the same `eventId`.

## 7. Assets in `public/unitaid/`

Total 2.5 MB.

| File | Usage | Size |
| --- | --- | --- |
| `data/dashboard.en.json`, `.fr.json`, `.pt.json` | Bundled copy of the dataset (published 6 Nov 2026), used only when the source cannot be read and nothing is cached (section 9) | 146 KB, 162 KB, 156 KB |
| `world-shapes.json` | Country shapes for the map | 1,542 KB |
| `maplibre-gl-worker.mjs` | MapLibre's worker, version 6.14.0; must match `maplibre-gl` | 496 KB |
| `header-photo.webp` | Photo behind the page header (since v1.4.0): the photo Unitaid chose, recoloured in the blue of the host's `/bg-programmatic-min.webp` | 43 KB |
| `unitaid-logo-white.svg` | "Powered by" logo in the page header, Unitaid's official artwork with the wordmark in white (since v1.4.0; replaces `unitaid-logo.svg`) | 10 KB |
| `who-emblem.svg` | WHO emblem on the WHO steps of the pathway | 10 KB |

## 8. Optional

- Localised URL (`/pt/...`, `/fr/...`): _not requested_. If requested, add to `pathnames` in the host's `src/config.ts`: `'/unitaid': { en: '/unitaid', fr: '...', pt: '...' }`.
- Standalone mode (no sidebar/header): _no_. Since v1.4.0 (Unitaid, 6 Nov 2026) the dashboard opens with its own photo header (`components/HostHero.tsx`): it starts at the top of the page, behind the host's transparent header, and carries the title, the description, "Powered by" Unitaid and the host's two QR banners (`@/ui/dashboard/BottlenecksBanner` and `TARequestBanner`, used unchanged). Nothing outside the module changes; the host's `/bg-programmatic-min.webp` is not replaced. The unsubscribe page keeps the host's header background in the top 56 px (`components/HostHeaderBand.tsx`).
- Typed `Link`: the host only needs `'/unitaid': '/unitaid'` in `pathnames` if it uses `Link`/`useRouter` from `@/navigation` with that destination.

## 9. Limitations and pending items

- **Bundled copy.** When the dataset address cannot be read and nothing is cached, the page and the data route use the copy in `public/unitaid/data/`, say so with `console.error`, and the data route adds the header `X-Unitaid-Source: fallback`. A build without network access (as in CI) pre-renders the page from that copy, so after a deploy visitors may see it for up to 5 minutes, until the first refresh. A source in a format this code does not read (another `schema_version`) is never replaced by the copy: the data route answers 502.
- **Notifications:** the sender is not built yet, and the store is in memory (section 6).
- **Tests:** the module's test suite is kept by the LAUNCH team and run there against this module's code; none are in this repository yet.
- **Procurement figures (v1.2.0):** withheld at Unitaid's request until they are confirmed. The procurement card lists the presentations bought and says the figures will be added later; they return in a later release.
- **Status labels (v1.0):** the pathway shows each step's symbol and colour without the words "Delayed" or "In progress", and no barrier text, until RBM and Unitaid agree a status taxonomy.
- **Phones.** The dashboard needs about 330 px of width (about 340 px in French). Inside the host frame, the collapsed sidebar keeps a 60 px strip on the left, so on phones narrower than about 400 px the page is wider than the screen and scrolls sideways (in Chrome: English fits at 390 px, French does not; all three languages overflow at 360 px). On a phone the sidebar also opens by default and takes most of the screen. To discuss with the internal team: whether the strip and the open sidebar are kept on phones in production.
- **Browsers:** checked in Chrome only (desktop at 1440 px, phones at 360 and 390 px); not yet on Safari or an iPhone.
- **Subscribe for updates (v1.4.0):** switched off for now; it is not part of this phase. The page shows Download CSV and Send feedback but no Subscribe button. The `POST /api/unitaid/subscribe` and `/unsubscribe` routes and the page `/{locale}/unitaid/unsubscribe` stay, so anyone already subscribed can still unsubscribe from the link in their emails. It returns in a later release (one switch, `SUBSCRIBE_SHOWN` in `components/frame/DashboardFrame.tsx`).

## 10. Fonts added by the module

Files under `fonts/files/` (woff2, max 1 MB each), declared in `fonts/index.ts`. They migrate with the module; list them so the licence can be checked.

| Family | Weights / styles | Licence | Source |
| --- | --- | --- | --- |
| Source Sans 3 (Unitaid's brand typeface) | Variable font, upright and italic, weights 200–900 (the styles use 400–800); `source-sans-3-upright.woff2` 166 KB, `source-sans-3-italic.woff2` 135 KB | SIL Open Font License 1.1 (`fonts/SourceSans3-OFL.md`) | Adobe, release 3.052: https://github.com/adobe-fonts/source-sans (`WOFF2/VF`) |

## 11. Delivery checklist

- [x] `npm run lint` green
- [x] `npm run format:check` green
- [x] `npm run check:contract` green
- [x] `npm run build` green, also without network access (the bundled copy is used)
- [x] Page opens at `/en/unitaid`, `/fr/unitaid`, `/pt/unitaid`, and `/en/unitaid/unsubscribe`
- [x] This file, `README.md` and `.env.example` updated
