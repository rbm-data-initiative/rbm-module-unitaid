import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

// Same layout as the host project: the request configuration lives in src/i18n.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Pin the tracing root to this folder so a parent lockfile is never picked up.
	outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default withNextIntl(nextConfig);
