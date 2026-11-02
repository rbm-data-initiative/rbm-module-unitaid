#!/usr/bin/env node
/**
 * Turns a repository created from the sandbox template into the sandbox of a
 * specific external team. Internal team only; run once per new repository.
 *
 * It renames every spelling of the current module identity (folders, file
 * names, imports, i18n namespace, env prefix, CSS prefix, docs) to the new
 * one, rewrites module.config.json and .github/CODEOWNERS, sets the package
 * name, formats with Biome and regenerates the protected-files manifest.
 *
 * Usage:
 *   node scripts/init-module.mjs --slug malaria-atlas \
 *     --external-owner @UNOPS/rbm-module-malaria-atlas \
 *     [--internal-owner @UNOPS/rbm-dashboard-maintainers] \
 *     [--namespace MalariaAtlas] [--env-prefix MALARIA_ATLAS_] \
 *     [--template-repo UNOPS/rbm-sandbox] [--dry-run]
 *
 * Re-running with the current slug only regenerates CODEOWNERS and the manifest.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
	CODEOWNERS_FILE,
	CONFIG_FILE,
	PROTECTED_MANIFEST,
	buildConfig,
	copyRenamed,
	formatWithBiome,
	isBinary,
	makeRenamer,
	readConfig,
	readJson,
	removeWithEmptyParents,
	sha256,
	snapshot,
	validateConfig,
	walk,
	writeCodeowners,
	writeConfig,
	writeJson,
} from "./lib/module.mjs";

const ROOT = process.cwd();

function parseArgs(argv) {
	const out = { dryRun: false };
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		const next = () => {
			const value = argv[i + 1];
			if (value === undefined || value.startsWith("--")) {
				throw new Error(`${arg} expects a value`);
			}
			i += 1;
			return value;
		};
		switch (arg) {
			case "--slug":
				out.slug = next();
				break;
			case "--namespace":
				out.namespace = next();
				break;
			case "--env-prefix":
				out.envPrefix = next();
				break;
			case "--external-owner":
				out.externalOwner = next();
				break;
			case "--internal-owner":
				out.internalOwner = next();
				break;
			case "--template-repo":
				out.templateRepo = next();
				break;
			case "--dry-run":
				out.dryRun = true;
				break;
			case "--help":
			case "-h":
				out.help = true;
				break;
			default:
				throw new Error(`unknown argument ${arg}`);
		}
	}
	return out;
}

function usage() {
	console.log(`Usage:
  node scripts/init-module.mjs --slug <kebab-slug> --external-owner @org/team
      [--internal-owner @org/team] [--namespace PascalCase] [--env-prefix UPPER_]
      [--template-repo owner/name] [--dry-run]

Re-running with the current slug only regenerates CODEOWNERS and the manifest.`);
}

function gitDirty() {
	try {
		return execSync("git status --porcelain", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
			.toString()
			.trim();
	} catch {
		return "";
	}
}

let args;
try {
	args = parseArgs(process.argv.slice(2));
} catch (err) {
	console.error(err.message);
	process.exit(2);
}
if (args.help) {
	usage();
	process.exit(0);
}

const from = readConfig(ROOT);
const to = buildConfig({
	slug: args.slug ?? from.slug,
	namespace: args.namespace,
	envPrefix: args.envPrefix,
	templateRepo: args.templateRepo ?? from.templateRepo,
	owners: {
		internal: args.internalOwner ?? from.owners.internal,
		external:
			args.externalOwner ?? (args.slug && args.slug !== from.slug ? "" : from.owners.external),
	},
});
// Namespace / env prefix follow the slug unless explicitly given.
if (!args.namespace && !args.slug) to.namespace = from.namespace;
if (!args.envPrefix && !args.slug) to.envPrefix = from.envPrefix;

const errors = validateConfig(to);
if (errors.length > 0) {
	console.error(`Invalid target configuration:\n  - ${errors.join("\n  - ")}`);
	if (!to.owners.external) console.error("Hint: pass --external-owner @org/team for the new slug.");
	process.exit(2);
}

const identityChanged =
	from.slug !== to.slug || from.namespace !== to.namespace || from.envPrefix !== to.envPrefix;

const dirty = gitDirty();
if (dirty && identityChanged && !args.dryRun) {
	console.error("Working tree is not clean; commit or stash before renaming the module:\n" + dirty);
	process.exit(2);
}

console.log(`From: slug=${from.slug} namespace=${from.namespace} envPrefix=${from.envPrefix}`);
console.log(`To:   slug=${to.slug} namespace=${to.namespace} envPrefix=${to.envPrefix}`);
console.log(`Owners: internal=${to.owners.internal} external=${to.owners.external}`);

const rename = makeRenamer(from, to);
const files = walk(ROOT).filter(
	(file) => file !== PROTECTED_MANIFEST && file !== CONFIG_FILE && file !== CODEOWNERS_FILE,
);

let moved = 0;
let rewritten = 0;
const plan = [];
for (const file of files) {
	const target = rename(file);
	const buffer = readFileSync(path.join(ROOT, file));
	const text = isBinary(buffer) ? null : buffer.toString("utf8");
	const changedContent = text !== null && rename(text) !== text;
	if (target !== file) moved += 1;
	else if (changedContent) rewritten += 1;
	if (target !== file || changedContent) plan.push({ file, target, changedContent });
}

for (const { file, target } of plan) {
	console.log(target !== file ? `  move   ${file} -> ${target}` : `  edit   ${file}`);
}

if (args.dryRun) {
	console.log(`\nDry run: ${moved} file(s) would move, ${rewritten} would be edited in place.`);
	process.exit(0);
}

for (const { file, target } of plan) {
	if (target !== file && existsSync(path.join(ROOT, target))) {
		console.error(`Refusing to overwrite existing file ${target}`);
		process.exit(1);
	}
}
for (const { file, target } of plan) {
	copyRenamed(ROOT, ROOT, file, rename);
	if (target !== file) removeWithEmptyParents(ROOT, path.join(ROOT, file));
}

const pkgPath = path.join(ROOT, "package.json");
const pkg = readJson(pkgPath);
pkg.name = `rbm-module-${to.slug}`;
writeJson(pkgPath, pkg);

writeConfig(ROOT, to);
writeCodeowners(ROOT, to);
formatWithBiome(ROOT);
const count = snapshot(ROOT, to);
const hash = sha256(path.join(ROOT, PROTECTED_MANIFEST));

console.log(
	`\nDone: ${moved} file(s) moved, ${rewritten} edited, ${count} protected files in the manifest.`,
);
console.log(`Manifest sha256: ${hash}`);
console.log(`
Next steps (internal team):
  1. Review the diff, then: npm ci && npm run lint && npm run check:contract && npm run build
  2. Commit and push.
  3. In the repository settings:
     - Variables: PROTECTED_MANIFEST_SHA256 = ${hash}
     - Rules: import docs/github/ruleset-main.json and docs/github/ruleset-tags.json
     - Actions: require approval for workflows from outside collaborators
     - Collaborators: ${to.owners.external} with Write, ${to.owners.internal} with Admin
  4. Fill in the "Delivered version" row of INTEGRATION.md when the team tags a release.`);
