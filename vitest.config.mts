import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

/**
 * Vitest configuration for the module tests (host file, protected).
 *
 * The contract only allows files under the module folders inside src/app, so
 * the include pattern needs no slug: every test found there belongs to the
 * module. Tests run in Node; there is no DOM. `passWithNoTests` keeps CI green
 * in a repository that has no tests yet.
 */
export default defineConfig({
	resolve: {
		alias: [
			// Same "@/..." alias as tsconfig.json.
			{ find: /^@\//, replacement: `${here("./src")}/` },
			// Files under lib/ start with `import "server-only"`, which throws outside
			// the Next.js server runtime. Map it to an empty module for tests.
			{ find: "server-only", replacement: here("./scripts/vitest/server-only.ts") },
		],
	},
	test: {
		environment: "node",
		globals: false,
		include: ["src/app/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["**/node_modules/**", "**/.next/**"],
		passWithNoTests: true,
	},
});
