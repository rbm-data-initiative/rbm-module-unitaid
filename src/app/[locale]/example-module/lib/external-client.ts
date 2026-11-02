import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

const FETCH_TIMEOUT_MS = 15_000;

interface FetchCsvOptions {
	tag: string;
	revalidateSeconds: number;
}

/**
 * Fetches a CSV document from an external source with Next.js data cache.
 * Runs only on the server; the browser never sees the source URL.
 */
export async function fetchCsvText(url: string, options: FetchCsvOptions): Promise<string> {
	const res = await fetch(url, {
		next: { revalidate: options.revalidateSeconds, tags: [options.tag] },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});

	if (!res.ok) {
		throw new Error(`Upstream responded ${res.status}`);
	}

	return res.text();
}

/** Reads a file bundled with the app (relative to the project root). */
export async function readBundledText(relativePath: string): Promise<string> {
	return readFile(path.join(process.cwd(), relativePath), "utf8");
}
