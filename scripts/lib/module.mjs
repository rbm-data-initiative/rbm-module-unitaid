/**
 * Shared helpers for the sandbox maintenance scripts.
 *
 * - module.config.json: the single source of truth for the module identity
 *   (slug, i18n namespace, env prefix, owners, template repo).
 * - case-aware renaming of the slug across paths and file contents, used by
 *   init-module (new team) and sync-host (pull host updates from the template).
 * - the protected-files snapshot shared with check-contract.
 *
 * Node 20, no dependencies.
 */
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import path from "node:path";

export const CONFIG_FILE = "module.config.json";
export const PROTECTED_MANIFEST = "scripts/protected-files.json";
export const APPROVED_DEPS = "scripts/approved-dependencies.json";
export const CODEOWNERS_FILE = ".github/CODEOWNERS";

/** Folders that are never part of the repository contents. */
export const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	".next",
	"out",
	"coverage",
	".idea",
	".host-template",
]);
/** Generated or local-only files that are neither protected nor module files. */
export const IGNORED_FILES = new Set(["next-env.d.ts", "tsconfig.tsbuildinfo", ".DS_Store"]);
export const isIgnoredFile = (name) =>
	IGNORED_FILES.has(name) || (name.startsWith(".env") && name !== ".env.example");

// ---------------------------------------------------------------- fs helpers
export const toPosix = (p) => p.split(path.sep).join("/");
export const sha256 = (abs) => createHash("sha256").update(readFileSync(abs)).digest("hex");
export const startsWithAny = (p, prefixes) => prefixes.some((prefix) => p.startsWith(prefix));
export const readJson = (abs) => JSON.parse(readFileSync(abs, "utf8"));
export const writeJson = (abs, value) => {
	mkdirSync(path.dirname(abs), { recursive: true });
	writeFileSync(abs, `${JSON.stringify(value, null, "\t")}\n`);
};

/** Sorted list of repository-relative POSIX paths under `root`. */
export function walk(root, dirAbs = root, out = []) {
	for (const entry of readdirSync(dirAbs, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (IGNORED_DIRS.has(entry.name)) continue;
			walk(root, path.join(dirAbs, entry.name), out);
		} else if (entry.isFile()) {
			if (isIgnoredFile(entry.name)) continue;
			out.push(toPosix(path.relative(root, path.join(dirAbs, entry.name))));
		}
	}
	return out.sort();
}

/** Removes a file and any directories left empty above it (up to `root`). */
export function removeWithEmptyParents(root, abs) {
	rmSync(abs, { force: true });
	let dir = path.dirname(abs);
	while (dir.startsWith(root) && dir !== root) {
		if (readdirSync(dir).length > 0) break;
		rmSync(dir, { recursive: true });
		dir = path.dirname(dir);
	}
}

export const isBinary = (buffer) => buffer.subarray(0, 8000).includes(0);

// ---------------------------------------------------------------- naming
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** All spellings derived from a kebab-case slug. */
export function deriveNames(slug) {
	const parts = slug.split("-").filter(Boolean);
	const pascal = parts.map(capitalize).join("");
	return {
		kebab: slug,
		snake: parts.join("_"),
		pascal,
		camel: lowerFirst(pascal),
		upper: parts.join("_").toUpperCase(),
	};
}

export const SLUG_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export const NAMESPACE_RE = /^[A-Z][A-Za-z0-9]*$/;
export const ENV_PREFIX_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_$/;
const OWNER_RE =
	/^@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)?$/;
const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/;

/** Builds a full config from a slug plus optional overrides. */
export function buildConfig({ slug, namespace, envPrefix, templateRepo, owners }) {
	const names = deriveNames(slug ?? "");
	return {
		slug: slug ?? "",
		namespace: namespace ?? names.pascal,
		envPrefix: envPrefix ?? `${names.upper}_`,
		templateRepo: templateRepo ?? "",
		owners: {
			internal: owners?.internal ?? "",
			external: owners?.external ?? "",
		},
	};
}

export function validateConfig(cfg) {
	const errors = [];
	if (!SLUG_RE.test(cfg.slug ?? "")) {
		errors.push(`slug "${cfg.slug}" must be kebab-case (e.g. "example-module", "malaria-atlas")`);
	}
	if (!NAMESPACE_RE.test(cfg.namespace ?? "")) {
		errors.push(`namespace "${cfg.namespace}" must be PascalCase (e.g. "ExampleModule")`);
	}
	if (!ENV_PREFIX_RE.test(cfg.envPrefix ?? "")) {
		errors.push(
			`envPrefix "${cfg.envPrefix}" must be UPPER_SNAKE ending with "_" (e.g. "EXAMPLE_MODULE_")`,
		);
	}
	if (cfg.templateRepo && !REPO_RE.test(cfg.templateRepo)) {
		errors.push(`templateRepo "${cfg.templateRepo}" must be "owner/name"`);
	}
	for (const key of ["internal", "external"]) {
		const owner = cfg.owners?.[key] ?? "";
		if (!OWNER_RE.test(owner)) {
			errors.push(`owners.${key} "${owner}" must be a GitHub handle or team (e.g. "@org/team")`);
		}
	}
	return errors;
}

/** Reads and validates module.config.json under `root`; throws on problems. */
export function readConfig(root) {
	const abs = path.join(root, CONFIG_FILE);
	if (!existsSync(abs)) throw new Error(`${CONFIG_FILE} missing in ${root}`);
	const raw = readJson(abs);
	const cfg = buildConfig(raw);
	const errors = validateConfig(cfg);
	if (errors.length > 0) throw new Error(`${CONFIG_FILE} invalid:\n  - ${errors.join("\n  - ")}`);
	return cfg;
}

export function writeConfig(root, cfg) {
	writeJson(path.join(root, CONFIG_FILE), {
		$comment:
			"Single source of truth for the module identity. Edit only through `npm run module:init` (internal team).",
		slug: cfg.slug,
		namespace: cfg.namespace,
		envPrefix: cfg.envPrefix,
		templateRepo: cfg.templateRepo,
		owners: { internal: cfg.owners.internal, external: cfg.owners.external },
	});
}

/** Repository-relative prefixes owned by the external team. */
export function modulePaths(slug) {
	const page = `src/app/[locale]/${slug}/`;
	const api = `src/app/api/${slug}/`;
	const pub = `public/${slug}/`;
	return { page, api, public: pub, all: [page, api, pub], src: [page, api] };
}

// ---------------------------------------------------------------- renaming
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isAlnum = (ch) => /[A-Za-z0-9]/.test(ch ?? "");

/**
 * Returns a function that rewrites every spelling of the `from` identity into
 * the `to` identity, in paths and in text:
 *   EXAMPLE_MODULE_            -> <to.envPrefix>
 *   ExampleModule             -> <to.namespace>        (also inside useExampleModuleDataset)
 *   example-module / camelSlug -> <to.slug>, camel or snake:
 *                          camel when glued to an identifier (__exampleModuleStore),
 *                          snake when glued to "_" (partners_subitem_example_module),
 *                          kebab otherwise (paths, CSS classes, URLs, tags)
 */
export function makeRenamer(from, to) {
	const f = deriveNames(from.slug);
	const t = deriveNames(to.slug);
	const envRe = new RegExp(`(?<![A-Za-z0-9])${escapeRe(from.envPrefix)}`, "g");
	const nsRe = new RegExp(`(?<![A-Z0-9])${escapeRe(from.namespace)}(?![a-z])`, "g");
	const slugAlternatives = [f.kebab, f.camel, f.snake].filter((v, i, a) => a.indexOf(v) === i);
	const slugRe = new RegExp(
		`(?<![a-z0-9])(?:${slugAlternatives.map(escapeRe).join("|")})(?![a-z0-9])`,
		"g",
	);

	return (text) =>
		text
			.replace(envRe, to.envPrefix)
			.replace(nsRe, to.namespace)
			.replace(slugRe, (match, offset, whole) => {
				if (match === f.camel && f.camel !== f.kebab) return t.camel;
				if (match === f.snake && f.snake !== f.kebab) return t.snake;
				const before = whole[offset - 1];
				const after = whole[offset + match.length];
				if (isAlnum(before) || isAlnum(after)) return t.camel;
				if (before === "_" || after === "_") return t.snake;
				return t.kebab;
			});
}

/**
 * Copies `relPath` from `srcRoot` to `dstRoot`, renaming the path and (for
 * text files) the contents. Returns the destination relative path.
 */
export function copyRenamed(srcRoot, dstRoot, relPath, rename) {
	const target = rename(relPath);
	const buffer = readFileSync(path.join(srcRoot, relPath));
	const abs = path.join(dstRoot, target);
	mkdirSync(path.dirname(abs), { recursive: true });
	writeFileSync(abs, isBinary(buffer) ? buffer : rename(buffer.toString("utf8")));
	return target;
}

// ---------------------------------------------------------------- generated files
export function codeownersContent(cfg) {
	const m = modulePaths(cfg.slug);
	// "*" in the middle of a pattern matches exactly one path segment, which
	// avoids the "[locale]" brackets being read as a character class.
	const glob = (prefix) => `/${prefix.replace("[locale]", "*")}`;
	const pad = (s) => s.padEnd(36);
	return [
		"# Generated by scripts/init-module.mjs from module.config.json. Do not edit by hand.",
		"# Last matching pattern wins. Everything belongs to the internal team unless",
		"# listed below; the external team approves changes inside its module folders.",
		"",
		`${pad("*")}${cfg.owners.internal}`,
		"",
		`${pad(glob(m.page))}${cfg.owners.external}`,
		`${pad(glob(m.api))}${cfg.owners.external}`,
		`${pad(glob(m.public))}${cfg.owners.external}`,
		"",
	].join("\n");
}

export function writeCodeowners(root, cfg) {
	const abs = path.join(root, CODEOWNERS_FILE);
	mkdirSync(path.dirname(abs), { recursive: true });
	writeFileSync(abs, codeownersContent(cfg));
}

/**
 * Regenerates the approved-dependencies and protected-files manifests.
 * Maintainer only: CI never runs this.
 */
export function snapshot(root, cfg) {
	const pkg = readJson(path.join(root, "package.json"));
	writeJson(path.join(root, APPROVED_DEPS), {
		dependencies: pkg.dependencies ?? {},
		devDependencies: pkg.devDependencies ?? {},
	});
	const files = {};
	for (const file of walk(root)) {
		if (startsWithAny(file, modulePaths(cfg.slug).all)) continue;
		if (file === PROTECTED_MANIFEST) continue;
		files[file] = sha256(path.join(root, file));
	}
	// Deterministic on purpose: the same content always yields the same hash.
	writeJson(path.join(root, PROTECTED_MANIFEST), { slug: cfg.slug, files });
	return Object.keys(files).length;
}

export const fileSize = (abs) => statSync(abs).size;

/**
 * Formats the tree with the project's Biome (a longer slug can push lines past
 * the configured width). Silently skipped when node_modules is not installed.
 */
export function formatWithBiome(root) {
	const bin = path.join(
		root,
		"node_modules",
		".bin",
		process.platform === "win32" ? "biome.cmd" : "biome",
	);
	if (!existsSync(bin)) {
		console.log(
			"Biome not installed (run npm ci); skipping format. Run `npm run format` afterwards.",
		);
		return false;
	}
	execSync(`"${bin}" format --write .`, { cwd: root, stdio: "ignore" });
	return true;
}
