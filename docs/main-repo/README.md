# Importing a module into the Global Malaria Dashboard

Reference files for the **main repository**. Nothing here runs in the sandbox.

| File | Copy to (main repository) |
| --- | --- |
| [`import-module.mjs`](import-module.mjs) | `scripts/import-module.mjs` |
| [`import-module.workflow.yml`](import-module.workflow.yml) | `.github/workflows/import-module.yml` |

## Flow

1. The external team tags a release (`v1.2.0`) in its repository and fills in the "Delivered version" row of `INTEGRATION.md`.
2. Someone from the internal team runs **Import external module** in the main repository with the team repository and the tag.
3. The workflow checks the delivery against its own contract, copies the three module folders (leaving the Vitest files out: `*.test.*`, `*.spec.*`, `__tests__/`; only the sandbox runs them), merges the module i18n into `messages/*.json` (failing on any key that already exists with a different value), adds the route to `pathnames`, builds, and opens a pull request `module/<slug>/<tag>`.
4. The pull request body carries the import report (what was copied, what is left for a human) followed by the team's `INTEGRATION.md`. The reviewer does the remaining host changes in the same branch: sidebar entry, environment variables, durable notification store, dependencies.

## Why the workflow lives here and not in the team repositories

A workflow file pushed to any branch of a team repository runs with that repository's secrets before the contract check can reject it. Keeping the only credential (`MODULE_IMPORT_TOKEN`, read-only on `rbm-module-*`) in the main repository means an external team can never reach this repository, whatever it commits.

## Running locally

```bash
git clone --branch v1.2.0 --depth 1 git@github.com:UNOPS/rbm-module-<slug>.git /tmp/module
node scripts/import-module.mjs --from /tmp/module --dry-run   # report only
node scripts/import-module.mjs --from /tmp/module             # apply
```
