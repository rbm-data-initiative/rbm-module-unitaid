#!/usr/bin/env node
/**
 * Imports a module delivered by an external team into the Global Malaria
 * Dashboard repository. Lives in the main repository (copy this file to
 * scripts/import-module.mjs there); kept in the sandbox template so both sides
 * evolve together.
 *
 * What it does, from a checkout of the team repository at the delivered tag:
 *   1. replaces src/app/[locale]/<slug>/, src/app/api/<slug>/ and public/<slug>/,
 *      leaving the module's Vitest files out (*.test.*, *.spec.*, __tests__/):
 *      the sandbox CI runs them, the main repository does not
 *   2. merges the module i18n files into messages/<locale>.json, refusing any
 *      key that already exists with a different value
 *   3. adds "/<slug>" to `pathnames` in src/config.ts when missing
 *   4. prints a checklist of what still needs a human: sidebar entry,
 *      environment variables, dependencies not present in the main project,
 *      persistence for notifications
 *
 * Usage:
 *   node scripts/import-module.mjs --from .module-import [--dry-run]
 *
 * Node 20, no dependencies.
 */
import {
	cpSync,
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const fromIndex = argv.indexOf("--from");
const fromArg = fromIndex >= 0 ? argv[fromIndex + 1] : undefined;
if (!fromArg) {
	console.error("Usage: node scripts/import-module.mjs --from <team-repo-checkout> [--dry-run]");
	process.exit(2);
}
const FROM = path.resolve(ROOT, fromArg);

const readJson = (abs) => JSON.parse(readFileSync(abs, "utf8"));
const configPath = path.join(FROM, "module.config.json");
if (!existsSync(configPath)) {
	console.error(`${configPath} missing: is --from a checkout of a sandbox repository?`);
	process.exit(2);
}
const { slug, namespace, envPrefix } = readJson(configPath);
if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug ?? "")) {
	console.error(`Invalid slug "${slug}" in module.config.json`);
	process.exit(2);
}

const FOLDERS = [`src/app/[locale]/${slug}`, `src/app/api/${slug}`, `public/${slug}`];
// Test files stay in the sandbox: the main repository has no test runner.
const isTestPath = (rel) =>
	/(?:^|[\\/])__tests__(?:[\\/]|$)/.test(rel) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(rel);
const LOCALES = ["en", "fr", "pt"];
const checklist = [];
const errors = [];

console.log(`# Import of module "${slug}" (namespace ${namespace}, env prefix ${envPrefix})\n`);

// 1) module folders ------------------------------------------------------
console.log("## Folders");
for (const folder of FOLDERS) {
	const src = path.join(FROM, folder);
	const dst = path.join(ROOT, folder);
	if (!existsSync(src)) {
		console.log(`- ${folder}: not present in the delivery, skipped`);
		continue;
	}
	const action = existsSync(dst) ? "replaced" : "added";
	let skippedTests = 0;
	const filter = (source) => {
		if (!isTestPath(path.relative(src, source))) return true;
		if (statSync(source).isFile()) skippedTests += 1;
		return false;
	};
	if (dryRun) {
		// Walk only to count what would be left out.
		const walk = (dir) => {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				const abs = path.join(dir, entry.name);
				if (!filter(abs)) continue;
				if (entry.isDirectory()) walk(abs);
			}
		};
		walk(src);
	} else {
		rmSync(dst, { recursive: true, force: true });
		cpSync(src, dst, { recursive: true, filter });
	}
	const note = skippedTests > 0 ? ` (${skippedTests} test file(s) left out)` : "";
	console.log(`- ${folder}: ${action}${note}`);
}

// 2) i18n merge ----------------------------------------------------------
console.log("\n## i18n");
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
function mergeInto(base, extra, trail, collisions) {
	for (const [key, value] of Object.entries(extra)) {
		const here = trail ? `${trail}.${key}` : key;
		if (isObject(value) && isObject(base[key])) {
			mergeInto(base[key], value, here, collisions);
		} else if (key in base && JSON.stringify(base[key]) !== JSON.stringify(value)) {
			collisions.push(here);
		} else {
			base[key] = value;
		}
	}
}
const detectIndent = (text) => (/\n {2}"/.test(text) ? "  " : "\t");
for (const locale of LOCALES) {
	const moduleFile = path.join(FROM, `src/app/[locale]/${slug}/i18n/${locale}.json`);
	const hostFile = path.join(ROOT, `messages/${locale}.json`);
	if (!existsSync(moduleFile)) {
		console.log(`- ${locale}: module has no i18n/${locale}.json`);
		continue;
	}
	if (!existsSync(hostFile)) {
		errors.push(`messages/${locale}.json missing in the main repository`);
		continue;
	}
	const hostText = readFileSync(hostFile, "utf8");
	const host = JSON.parse(hostText);
	const collisions = [];
	mergeInto(host, readJson(moduleFile), "", collisions);
	if (collisions.length > 0) {
		errors.push(
			`messages/${locale}.json: keys already exist with another value: ${collisions.join(", ")}`,
		);
		continue;
	}
	if (!dryRun) writeFileSync(hostFile, `${JSON.stringify(host, null, detectIndent(hostText))}\n`);
	console.log(`- ${locale}: merged into messages/${locale}.json`);
}

// 3) pathnames -----------------------------------------------------------
console.log("\n## Routing");
const configTs = path.join(ROOT, "src/config.ts");
if (existsSync(configTs)) {
	const text = readFileSync(configTs, "utf8");
	const entry = `"/${slug}"`;
	if (text.includes(entry) || text.includes(`'/${slug}'`)) {
		console.log(`- src/config.ts already has ${entry}`);
	} else {
		const match = text.match(/(export const pathnames[^=]*=\s*\{\n)/);
		if (match) {
			const indent = (text.match(/\n([ \t]+)"\/"/) ?? [, "\t"])[1];
			const updated = text.replace(match[1], `${match[1]}${indent}${entry}: "/${slug}",\n`);
			if (!dryRun) writeFileSync(configTs, updated);
			console.log(
				`- src/config.ts: added ${entry} to pathnames (check the position inside the object)`,
			);
		} else {
			checklist.push(
				`Add ${entry}: "/${slug}" to \`pathnames\` in src/config.ts (automatic insertion failed)`,
			);
		}
	}
} else {
	checklist.push(`Register the route "/${slug}" in the host routing configuration`);
}

// 4) checklist -----------------------------------------------------------
const integration = path.join(FROM, `src/app/[locale]/${slug}/INTEGRATION.md`);
checklist.push(
	`Add the sidebar entry for "/${slug}" in the dashboard menu (icon, translationKey and group are in INTEGRATION.md section 2)`,
);

const envExample = path.join(FROM, `src/app/[locale]/${slug}/.env.example`);
if (existsSync(envExample)) {
	const vars = readFileSync(envExample, "utf8")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith("#"))
		.map((l) => l.split("=")[0].trim());
	if (vars.length > 0)
		checklist.push(`Configure environment variables in every environment: ${vars.join(", ")}`);
}

const modulePkg = path.join(FROM, "package.json");
if (existsSync(modulePkg)) {
	const hostPkg = readJson(path.join(ROOT, "package.json"));
	const theirs = readJson(modulePkg);
	const missing = [];
	for (const section of ["dependencies", "devDependencies"]) {
		for (const [name, version] of Object.entries(theirs[section] ?? {})) {
			const hostVersion = hostPkg.dependencies?.[name] ?? hostPkg.devDependencies?.[name];
			if (!hostVersion) missing.push(`${name}@${version}`);
			else if (hostVersion !== version)
				missing.push(`${name} (module ${version}, main ${hostVersion})`);
		}
	}
	if (missing.length > 0) {
		checklist.push(`Dependencies to add or align in the main package.json: ${missing.join(", ")}`);
	}
}

if (existsSync(path.join(FROM, `src/app/api/${slug}/notifications`))) {
	checklist.push(
		`Replace the in-memory notification store (src/app/api/${slug}/_lib/store.ts) with the durable implementation`,
	);
}
if (existsSync(integration))
	checklist.push(
		"Go through INTEGRATION.md sections 5, 8 and 9 (external sources, optional items, limitations)",
	);

console.log("\n## Manual steps");
for (const item of checklist) console.log(`- [ ] ${item}`);

if (errors.length > 0) {
	console.error("\n## Errors");
	for (const error of errors) console.error(`- ${error}`);
	process.exit(1);
}
if (dryRun) console.log("\n(dry run: nothing written)");
