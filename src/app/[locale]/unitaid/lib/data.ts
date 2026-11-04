// Reads the published LAUNCH dataset on the server. Visitors' browsers never
// contact the data host: the page arrives with the data already in it.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import { DatasetError, datasetFrom, type Localized } from "./dataset";
import { dataUrlSetting } from "./env";
import type { Locale } from "../utils/locales";

/**
 * The published dataset, one file per language (since 28 Oct 2026):
 * {locale} becomes en, fr or pt. UNITAID_DATA_URL may name another address in
 * the same form, or a combined dashboard.json without {locale} (a local test
 * server): lib/dataset.ts datasetFrom() reads either. The data repository has
 * moved (found 29 Oct 2026): it was codebyjackson/launch-data-test, whose
 * GitHub Pages address now answers 404, with no redirect.
 */
export const DATA_URL =
	dataUrlSetting() ||
	"https://quantum-sage-technologies.github.io/unitaid-launch-data/v1/dashboard.{locale}.json";

/** The address of one language's file. */
export const dataUrl = (locale: Locale): string => DATA_URL.replace("{locale}", locale);

/**
 * Seconds a fetched file is kept fresh in Next.js's server-side cache: 5
 * minutes, the default in RBM's module spec (2a). After that, the next request
 * still gets the cached copy while Next.js fetches a new one behind it. The page (page.tsx) and the data route
 * (src/app/api/unitaid/data/route.ts) share the cached copy. The page's own
 * `revalidate` must be the same number written out: Next.js reads it from the
 * source, so it cannot refer to this one.
 */
export const REVALIDATE = 300;

/**
 * The cache tag on one language's fetch. The notifications route
 * (app/api/unitaid/notifications/route.ts) expires it after a publish; every
 * cached copy and page built from that language's file carries it, wherever
 * the page lives.
 */
export const dataTag = (locale: Locale): string => `launch-data-${locale}`;

/** The fetch options of the cached read: 5 minutes, under the language's tag. */
const cached = (locale: Locale): RequestInit => ({
	next: { revalidate: REVALIDATE, tags: [dataTag(locale)] },
});

/**
 * The copy of the dataset bundled with the module, one file per language,
 * read from disk as RBM's module template reads its sample (relative to the
 * project root). Refreshed by hand with each release.
 */
export const BUNDLED_DIR = "public/unitaid/data";

/** Where a dataset came from: the data host, or the copy bundled with the module. */
export type DataSource = "remote" | "fallback";

/**
 * The dataset in one language, and where it came from.
 *
 * Next.js keeps a cached copy: when a background refresh fails, it goes on
 * serving that copy, so a data host that is briefly down costs nothing. Only
 * a read with no cached copy at all fails: a build without network access
 * (RBM's builds have none), or a new server while the host is down. That read
 * gets the bundled copy instead (BUNDLED_DIR), and says so loudly in the
 * server log. The page built from it is rebuilt from the host 5 minutes later.
 *
 * @throws DatasetError("unavailable") when neither the host nor the bundled
 * copy can be read
 * @throws DatasetError("schema") when the file's schema_version is not
 * supported, or it is in another language: the bundled copy is not used then
 */
export async function loadDashboard(
	locale: Locale,
): Promise<{ dataset: Localized; source: DataSource }> {
	try {
		return { dataset: await load(locale, cached(locale)), source: "remote" };
	} catch (e) {
		if (!(e instanceof DatasetError) || e.kind !== "unavailable") throw e;
		console.error(
			`[LAUNCH] data: ${e.message}; serving the bundled copy, ${BUNDLED_DIR}/dashboard.${locale}.json`,
		);
		return { dataset: await bundled(locale), source: "fallback" };
	}
}

/** The dataset in one language: loadDashboard() without the source. */
export async function getDashboard(locale: Locale): Promise<Localized> {
	return (await loadDashboard(locale)).dataset;
}

async function bundled(locale: Locale): Promise<Localized> {
	const file = `${BUNDLED_DIR}/dashboard.${locale}.json`;
	let raw: unknown;
	try {
		raw = JSON.parse(await readFile(path.join(process.cwd(), file), "utf8"));
	} catch {
		throw new DatasetError("unavailable", `the bundled copy ${file} cannot be read`);
	}
	return datasetFrom(raw, locale, file);
}

/**
 * After a publish: reads the language's file from the host, past the cache,
 * and only when it can be used expires the cached copy and the pages built
 * from it, so the next request for either reads the file again. On Next.js 15
 * revalidateTag() expires at once (Next.js 16 needs { expire: 0 } for this):
 * with a stale window the next visitor would still get the old copy. A file that cannot be used leaves the cache as
 * it is, so the dashboard keeps its last good copy.
 *
 * Then, once the route has answered, the file is read into the cache again.
 * Next.js applies the expiry only when the route returns, so this cannot
 * happen sooner; without it, an expired copy has no stale copy behind it, and
 * a host failing before the next visitor would show that visitor an error
 * (measured on Next.js 16: the page HTTP 500, the data route 502) instead of
 * the old data. That visitor now gets the bundled copy (loadDashboard()).
 *
 * @throws DatasetError as getDashboard() does; the cache is then untouched
 */
export async function refreshDashboard(locale: Locale): Promise<void> {
	await load(locale, { cache: "no-store" });
	revalidateTag(dataTag(locale));
	after(() =>
		load(locale, cached(locale)).catch((e: Error) => {
			// the next request reads the file itself
			console.error(`[LAUNCH] notifications: re-reading ${locale} failed: ${e.message}`);
		}),
	);
}

async function load(locale: Locale, init: RequestInit): Promise<Localized> {
	const url = dataUrl(locale);
	let res: Response;
	try {
		res = await fetch(url, init);
	} catch {
		throw new DatasetError("unavailable", `could not reach ${url}`);
	}
	if (!res.ok) throw new DatasetError("unavailable", `HTTP ${res.status} from ${url}`);
	let raw: unknown;
	try {
		raw = await res.json();
	} catch {
		throw new DatasetError("unavailable", `${url} is not JSON`);
	}
	return datasetFrom(raw, locale, url);
}
