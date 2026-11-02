#!/usr/bin/env node
/**
 * Pulls host (non-module) files from a checkout of the template repository
 * into this team repository, re-applying the team's module identity, then
 * regenerates CODEOWNERS and the protected-files manifest.
 *
 * Internal team only. Typically run by .github/workflows/sync-host.yml, which
 * opens a pull request with the result.
 *
 * Usage:
 *   node scripts/sync-host.mjs --from ../rbm-sandbox [--dry-run]
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
	CODEOWNERS_FILE,
	CONFIG_FILE,
	PROTECTED_MANIFEST,
	copyRenamed,
	formatWithBiome,
	isBinary,
	makeRenamer,
	modulePaths,
	readConfig,
	readJson,
	sha256,
	snapshot,
	startsWithAny,
	walk,
	writeCodeowners,
	writeJson,
} from "./lib/module.mjs";

const ROOT = process.cwd();

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const fromIndex = argv.indexOf("--from");
const fromArg = fromIndex >= 0 ? argv[fromIndex + 1] : undefined;
if (!fromArg) {
	console.error("Usage: node scripts/sync-host.mjs --from <path-to-template-checkout> [--dry-run]");
	process.exit(2);
}
const TEMPLATE = path.resolve(ROOT, fromArg);
if (!existsSync(path.join(TEMPLATE, CONFIG_FILE))) {
	console.error(`${TEMPLATE} does not look like a template checkout (${CONFIG_FILE} missing)`);
	process.exit(2);
}

const local = readConfig(ROOT);
const template = readConfig(TEMPLATE);
const rename = makeRenamer(template, local);

// Files the team repository keeps as its own.
const KEEP_LOCAL = new Set([PROTECTED_MANIFEST, CONFIG_FILE, CODEOWNERS_FILE]);

const hostFiles = walk(TEMPLATE).filter(
	(file) => !startsWithAny(file, modulePaths(template.slug).all) && !KEEP_LOCAL.has(file),
);

let added = 0;
let updated = 0;
let unchanged = 0;
for (const file of hostFiles) {
	const target = rename(file);
	const srcBuffer = readFileSync(path.join(TEMPLATE, file));
	const expected = isBinary(srcBuffer)
		? srcBuffer
		: Buffer.from(rename(srcBuffer.toString("utf8")));
	const dstAbs = path.join(ROOT, target);
	if (!existsSync(dstAbs)) {
		added += 1;
		console.log(`  add    ${target}`);
	} else if (!readFileSync(dstAbs).equals(expected)) {
		updated += 1;
		console.log(`  update ${target}`);
	} else {
		unchanged += 1;
		continue;
	}
	if (!dryRun) copyRenamed(TEMPLATE, ROOT, file, rename);
}

// Host files present locally but no longer in the template: report, never delete.
const expectedTargets = new Set(hostFiles.map(rename));
const localManifest = existsSync(path.join(ROOT, PROTECTED_MANIFEST))
	? Object.keys(readJson(path.join(ROOT, PROTECTED_MANIFEST)).files ?? {})
	: [];
const orphans = localManifest.filter((file) => !expectedTargets.has(file) && !KEEP_LOCAL.has(file));
for (const file of orphans)
	console.log(`  orphan ${file} (not in template any more; remove by hand if intended)`);

if (dryRun) {
	console.log(
		`\nDry run: ${added} to add, ${updated} to update, ${unchanged} unchanged, ${orphans.length} orphan(s).`,
	);
	process.exit(0);
}

// The template's package.json carries the template name; keep the team's.
const pkgPath = path.join(ROOT, "package.json");
const pkg = readJson(pkgPath);
pkg.name = `rbm-module-${local.slug}`;
writeJson(pkgPath, pkg);

writeCodeowners(ROOT, local);
formatWithBiome(ROOT);
const count = snapshot(ROOT, local);
const hash = sha256(path.join(ROOT, PROTECTED_MANIFEST));
console.log(
	`\nSynced from ${template.templateRepo || TEMPLATE}: ${added} added, ${updated} updated, ${unchanged} unchanged, ${orphans.length} orphan(s). ${count} protected files.`,
);
console.log(`Manifest sha256: ${hash}`);
console.log(
	"After merging, update the PROTECTED_MANIFEST_SHA256 repository variable with the value above.",
);
