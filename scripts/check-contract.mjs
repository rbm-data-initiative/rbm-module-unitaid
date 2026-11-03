#!/usr/bin/env node
/**
 * Contract check for the external-team sandbox.
 *
 * Verifies that the module respects the integration rules of the Global
 * Malaria Dashboard: files only inside the allowed folders, protected starter
 * files untouched, i18n parity, allowed imports, env-var discipline and an
 * approved dependency list. The module identity (slug, namespace, env prefix)
 * comes from module.config.json.
 *
 * Usage:
 *   node scripts/check-contract.mjs             # validate (exit 1 on failure)
 *   node scripts/check-contract.mjs --snapshot  # maintainer only: regenerate manifests
 *   node scripts/check-contract.mjs --manifest-hash
 *                                               # print the sha256 of protected-files.json
 *
 * When the environment variable PROTECTED_MANIFEST_SHA256 is set (CI reads it
 * from a repository variable only admins can edit), the manifest must match it.
 * This stops a re-snapshot committed by the external team from passing CI.
 *
 * Node 20, no dependencies.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
	APPROVED_DEPS,
	PROTECTED_MANIFEST,
	fileSize,
	modulePaths,
	readConfig,
	readJson,
	sha256,
	snapshot,
	startsWithAny,
	toPosix,
	walk,
} from "./lib/module.mjs";

const ROOT = process.cwd();

let config;
try {
	config = readConfig(ROOT);
} catch (err) {
	console.error(err.message);
	process.exit(1);
}
const { slug: SLUG, namespace: NAMESPACE, envPrefix: ENV_PREFIX } = config;

const { page: MODULE_PAGE, api: MODULE_API, public: MODULE_PUBLIC } = modulePaths(SLUG);
const ALLOWED_PREFIXES = [MODULE_PAGE, MODULE_API, MODULE_PUBLIC];
const MODULE_SRC_PREFIXES = [MODULE_PAGE, MODULE_API];

const ALLOWED_HOST_IMPORTS = [
	"@/navigation",
	"@/fonts",
	"@/utils/server/crypto",
	"@/utils/common-functions",
	"@/ui/dashboard/TARequestBanner",
	"@/ui/dashboard/BottlenecksBanner",
	"@/ui/dashboard/Modal",
];
const ALLOWED_MODULE_IMPORT_PREFIXES = [`@/app/[locale]/${SLUG}/`, `@/app/api/${SLUG}/`];
const FORBIDDEN_IMPORT_PATTERNS = [/^next\/font\/google/];
// Module fonts: self-hosted woff2 files declared once with next/font/local.
const MODULE_FONTS_DIR = `${MODULE_PAGE}fonts/`;
const MODULE_FONTS_FILES = `${MODULE_FONTS_DIR}files/`;
const MODULE_FONTS_INDEX = `${MODULE_FONTS_DIR}index.ts`;
const FONT_EXT = new Set([".woff2", ".woff", ".ttf", ".otf", ".eot"]);
const MAX_FONT_BYTES = 1024 * 1024;
const ENV_ALLOWED_FILES = new Set([`${MODULE_PAGE}lib/env.ts`]);
const ENV_ALLOWED_NAMES = new Set(["NODE_ENV"]);

const REQUIRED_MODULE_FILES = [
	`${MODULE_PAGE}page.tsx`,
	`${MODULE_PAGE}page-content.tsx`,
	`${MODULE_PAGE}i18n/en.json`,
	`${MODULE_PAGE}i18n/fr.json`,
	`${MODULE_PAGE}i18n/pt.json`,
	`${MODULE_PAGE}.env.example`,
	`${MODULE_PAGE}INTEGRATION.md`,
	`${MODULE_PAGE}README.md`,
	`${MODULE_API}data/route.ts`,
];
const REQUIRED_I18N_KEYS = [
	`${NAMESPACE}.metadata.title`,
	`${NAMESPACE}.metadata.description`,
	`${NAMESPACE}.metadata.keywords`,
	`${NAMESPACE}.title`,
];
const SIDEBAR_KEY_PATTERN = new RegExp(
	`^[A-Za-z0-9]+_subitem_${SLUG.replace(/-/g, "_")}(_tooltip)?$`,
);
const MAX_PUBLIC_ASSET_BYTES = 5 * 1024 * 1024;
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// ---------------------------------------------------------------- helpers
const abs = (relPath) => path.join(ROOT, relPath);
const readRootJson = (relPath) => readJson(abs(relPath));

function flatten(obj, prefix = "", out = {}) {
	for (const [key, value] of Object.entries(obj)) {
		const full = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, full, out);
		else out[full] = value;
	}
	return out;
}

const issues = {};
const fail = (group, message) => {
	(issues[group] ??= []).push(message);
};

// ---------------------------------------------------------------- checks
function checkPaths(allFiles, manifest) {
	for (const file of allFiles) {
		if (startsWithAny(file, ALLOWED_PREFIXES)) continue;
		if (file === PROTECTED_MANIFEST) continue;
		if (!(file in manifest.files)) {
			fail("paths", `unexpected file outside the module folders: ${file}`);
		}
	}
}

function checkProtected(manifest) {
	if (manifest.slug && manifest.slug !== SLUG) {
		fail(
			"protected",
			`${PROTECTED_MANIFEST} was generated for slug "${manifest.slug}" but module.config.json says "${SLUG}"`,
		);
	}
	for (const [file, expected] of Object.entries(manifest.files)) {
		if (!existsSync(abs(file))) {
			fail("protected", `missing protected file: ${file}`);
			continue;
		}
		if (sha256(abs(file)) !== expected) fail("protected", `modified protected file: ${file}`);
	}
	const expectedHash = process.env.PROTECTED_MANIFEST_SHA256?.trim();
	if (expectedHash) {
		const actual = sha256(abs(PROTECTED_MANIFEST));
		if (actual !== expectedHash.toLowerCase()) {
			fail(
				"protected",
				`${PROTECTED_MANIFEST} (sha256 ${actual}) does not match PROTECTED_MANIFEST_SHA256; only the internal team may re-snapshot`,
			);
		}
	}
}

function checkRequiredFiles() {
	for (const file of REQUIRED_MODULE_FILES) {
		if (!existsSync(abs(file))) fail("paths", `required module file missing: ${file}`);
	}
}

function checkI18n() {
	const locales = ["en", "fr", "pt"];
	const flat = {};
	for (const locale of locales) {
		const file = `${MODULE_PAGE}i18n/${locale}.json`;
		if (!existsSync(abs(file))) return;
		let json;
		try {
			json = readRootJson(file);
		} catch (err) {
			fail("i18n", `${file}: invalid JSON (${err.message})`);
			return;
		}
		for (const top of Object.keys(json)) {
			if (top !== NAMESPACE && top !== "Sidebar") {
				fail(
					"i18n",
					`${file}: unexpected top-level namespace "${top}" (only "${NAMESPACE}" and "Sidebar")`,
				);
			}
		}
		flat[locale] = flatten(json);
		for (const [key, value] of Object.entries(flat[locale])) {
			if (typeof value !== "string") fail("i18n", `${file}: "${key}" must be a string`);
			else if (!value.trim()) fail("i18n", `${file}: "${key}" is empty`);
			if (key.startsWith("Sidebar.") && !SIDEBAR_KEY_PATTERN.test(key.slice("Sidebar.".length))) {
				fail(
					"i18n",
					`${file}: Sidebar key "${key}" must match <group>_subitem_${SLUG.replace(/-/g, "_")}[_tooltip]`,
				);
			}
		}
	}

	const reference = new Set(Object.keys(flat.en ?? {}));
	for (const key of REQUIRED_I18N_KEYS) {
		if (!reference.has(key)) fail("i18n", `i18n/en.json: required key "${key}" missing`);
	}
	for (const locale of ["fr", "pt"]) {
		const keys = new Set(Object.keys(flat[locale] ?? {}));
		for (const key of reference)
			if (!keys.has(key)) fail("i18n", `i18n/${locale}.json: missing "${key}"`);
		for (const key of keys)
			if (!reference.has(key)) fail("i18n", `i18n/${locale}.json: extra "${key}" (not in en)`);
	}

	// Module keys must not override shell keys of the host messages.
	const baseFile = "messages/en.json";
	if (existsSync(abs(baseFile))) {
		const base = flatten(readRootJson(baseFile));
		for (const key of reference) {
			if (key in base)
				fail("i18n", `i18n/en.json: "${key}" collides with a host key in ${baseFile}`);
		}
	}
}

const IMPORT_RE =
	/(?:^|[^\w$])(?:import|export)\s*(?:[\s\S]*?\sfrom\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|require\s*\(\s*["']([^"']+)["']\s*\)/g;

function listImports(source) {
	const specs = [];
	for (const match of source.matchAll(IMPORT_RE)) {
		const spec = match[1] ?? match[2] ?? match[3];
		if (spec) specs.push(spec);
	}
	return specs;
}

function checkImports(moduleSources) {
	for (const file of moduleSources) {
		const source = readFileSync(abs(file), "utf8");
		for (const spec of listImports(source)) {
			if (FORBIDDEN_IMPORT_PATTERNS.some((re) => re.test(spec))) {
				fail("imports", `${file}: forbidden import "${spec}"`);
				continue;
			}
			if (spec.startsWith("@/")) {
				const ok =
					ALLOWED_HOST_IMPORTS.includes(spec) ||
					startsWithAny(spec, ALLOWED_MODULE_IMPORT_PREFIXES);
				if (!ok) fail("imports", `${file}: host import "${spec}" is not in the allowed list`);
				continue;
			}
			if (spec.startsWith(".")) {
				const target = toPosix(path.relative(ROOT, path.resolve(path.dirname(abs(file)), spec)));
				if (
					!startsWithAny(`${target}/`, MODULE_SRC_PREFIXES) &&
					!startsWithAny(target, MODULE_SRC_PREFIXES)
				) {
					fail("imports", `${file}: relative import "${spec}" escapes the module folders`);
				}
			}
		}
		if (file.startsWith(`${MODULE_PAGE}lib/`) && !/import\s+["']server-only["']/.test(source)) {
			fail("imports", `${file}: files under lib/ must start with import "server-only"`);
		}
	}
}

function checkEnv(moduleSources) {
	const envRe = /process\.env(?:\.([A-Za-z0-9_]+)|\[\s*["']([A-Za-z0-9_]+)["']\s*\])/g;
	for (const file of moduleSources) {
		const source = readFileSync(abs(file), "utf8");
		const matches = [...source.matchAll(envRe)];
		if (matches.length === 0) continue;
		const allowedHere = ENV_ALLOWED_FILES.has(file) || file.startsWith(MODULE_API);
		if (!allowedHere) {
			fail(
				"env",
				`${file}: process.env may only be read in ${MODULE_PAGE}lib/env.ts or ${MODULE_API}**`,
			);
		}
		for (const match of matches) {
			const name = match[1] ?? match[2];
			if (name && !name.startsWith(ENV_PREFIX) && !ENV_ALLOWED_NAMES.has(name)) {
				fail("env", `${file}: variable "${name}" must be prefixed with ${ENV_PREFIX}`);
			}
		}
	}

	const example = `${MODULE_PAGE}.env.example`;
	if (existsSync(abs(example))) {
		const lines = readFileSync(abs(example), "utf8").split(/\r?\n/);
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;
			const key = trimmed.split("=")[0].trim();
			if (!key.startsWith(ENV_PREFIX))
				fail("env", `${example}: "${key}" must be prefixed with ${ENV_PREFIX}`);
		}
	}
}

function checkDependencies() {
	if (!existsSync(abs(APPROVED_DEPS))) {
		fail("deps", `${APPROVED_DEPS} missing (run --snapshot as maintainer)`);
		return;
	}
	const approved = readRootJson(APPROVED_DEPS);
	const pkg = readRootJson("package.json");
	for (const section of ["dependencies", "devDependencies"]) {
		const current = pkg[section] ?? {};
		const expected = approved[section] ?? {};
		for (const [name, version] of Object.entries(current)) {
			if (!(name in expected)) fail("deps", `${section}: "${name}" is not an approved dependency`);
			else if (expected[name] !== version)
				fail(
					"deps",
					`${section}: "${name}" version "${version}" differs from approved "${expected[name]}"`,
				);
		}
		for (const name of Object.keys(expected)) {
			if (!(name in current)) fail("deps", `${section}: approved dependency "${name}" was removed`);
		}
	}
	for (const script of ["lint", "build", "check:contract"]) {
		if (!pkg.scripts?.[script]) fail("deps", `package.json: script "${script}" is required`);
	}
}

function checkFonts(allFiles, moduleSources) {
	// 1) font files only under <module>/fonts/files/, woff2 only, size-limited
	for (const file of allFiles) {
		if (!startsWithAny(file, ALLOWED_PREFIXES)) continue;
		const ext = path.extname(file).toLowerCase();
		if (!FONT_EXT.has(ext)) continue;
		if (!file.startsWith(MODULE_FONTS_FILES)) {
			fail(
				"fonts",
				`${file}: font files belong in ${MODULE_FONTS_FILES} (loaded with next/font/local)`,
			);
			continue;
		}
		if (ext !== ".woff2")
			fail("fonts", `${file}: only .woff2 is accepted (convert ${ext} to woff2)`);
		const size = fileSize(abs(file));
		if (size > MAX_FONT_BYTES) {
			fail("fonts", `${file}: ${(size / 1024).toFixed(0)} KB exceeds the 1 MB limit per font file`);
		}
	}
	// 2) next/font/local only in <module>/fonts/index.ts, pointing at ./files/*.woff2
	for (const file of moduleSources) {
		const source = readFileSync(abs(file), "utf8");
		const usesLocalFont = listImports(source).some((spec) => spec === "next/font/local");
		if (!usesLocalFont) continue;
		if (file !== MODULE_FONTS_INDEX) {
			fail("fonts", `${file}: next/font/local may only be used in ${MODULE_FONTS_INDEX}`);
			continue;
		}
		for (const match of source.matchAll(/["'`]([^"'`]+\.(?:woff2|woff|ttf|otf|eot))["'`]/gi)) {
			if (!/^\.\/files\/[^/]+\.woff2$/.test(match[1])) {
				fail("fonts", `${file}: font source "${match[1]}" must be "./files/<name>.woff2"`);
			}
		}
	}
}

function checkPublicAssets(allFiles) {
	for (const file of allFiles) {
		if (!file.startsWith(MODULE_PUBLIC)) continue;
		const size = fileSize(abs(file));
		if (size > MAX_PUBLIC_ASSET_BYTES) {
			fail(
				"paths",
				`${file}: ${(size / 1024 / 1024).toFixed(1)} MB exceeds the 5 MB limit for module assets`,
			);
		}
	}
}

// ---------------------------------------------------------------- main
if (process.argv.includes("--snapshot")) {
	const count = snapshot(ROOT, config);
	console.log(`Snapshot written: ${count} protected files, dependencies approved.`);
	console.log(`Manifest sha256: ${sha256(abs(PROTECTED_MANIFEST))}`);
	console.log("Update the PROTECTED_MANIFEST_SHA256 repository variable with the value above.");
	process.exit(0);
}

if (process.argv.includes("--manifest-hash")) {
	if (!existsSync(abs(PROTECTED_MANIFEST))) {
		console.error(`${PROTECTED_MANIFEST} missing.`);
		process.exit(1);
	}
	console.log(sha256(abs(PROTECTED_MANIFEST)));
	process.exit(0);
}

if (!existsSync(abs(PROTECTED_MANIFEST))) {
	console.error(
		`${PROTECTED_MANIFEST} missing. A maintainer must run: node scripts/check-contract.mjs --snapshot`,
	);
	process.exit(1);
}
const allFiles = walk(ROOT);
const manifest = readRootJson(PROTECTED_MANIFEST);
const moduleSources = allFiles.filter(
	(file) => startsWithAny(file, MODULE_SRC_PREFIXES) && SOURCE_EXT.has(path.extname(file)),
);

checkPaths(allFiles, manifest);
checkProtected(manifest);
checkRequiredFiles();
checkI18n();
checkImports(moduleSources);
checkEnv(moduleSources);
checkDependencies();
checkFonts(allFiles, moduleSources);
checkPublicAssets(allFiles);

const groups = Object.keys(issues);
if (groups.length === 0) {
	console.log(
		`Contract OK (module "${SLUG}"): ${moduleSources.length} module source files, ${Object.keys(manifest.files).length} protected files verified.`,
	);
	if (!process.env.PROTECTED_MANIFEST_SHA256?.trim() && process.env.CI) {
		console.log(
			"::warning::PROTECTED_MANIFEST_SHA256 is not set; the manifest provenance was not verified.",
		);
	}
	process.exit(0);
}

let count = 0;
for (const group of ["paths", "protected", "i18n", "imports", "env", "deps", "fonts"]) {
	for (const message of issues[group] ?? []) {
		count += 1;
		console.error(`[${group}] ${message}`);
	}
}
console.error(`\nContract check failed with ${count} issue(s).`);
process.exit(1);
