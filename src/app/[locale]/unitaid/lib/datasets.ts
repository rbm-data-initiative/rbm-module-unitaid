import "server-only";

import type { DatasetName, DatasetResponse, SampleRow } from "@/app/[locale]/unitaid/types";
import { CACHE_TAGS } from "./cache";
import { getUnitaidEnv } from "./env";
import { fetchCsvText, readBundledText } from "./external-client";
import { parseSampleCsv } from "./transform";

interface DatasetConfig<T> {
	tag: string;
	fallbackFile: string;
	parse: (csvText: string) => T[];
}

const DATASETS: Record<DatasetName, DatasetConfig<SampleRow>> = {
	sample: {
		tag: CACHE_TAGS.sample,
		fallbackFile: "public/unitaid/sample.csv",
		parse: parseSampleCsv,
	},
};

export function isDatasetName(value: string): value is DatasetName {
	return Object.hasOwn(DATASETS, value);
}

/**
 * Loads a dataset from the external source when UNITAID_SOURCE_URL is set,
 * falling back to the bundled sample file otherwise (or on upstream failure).
 * The fallback keeps `next build` and local development fully offline.
 */
export async function loadDataset(name: DatasetName): Promise<DatasetResponse<SampleRow>> {
	const config = DATASETS[name];
	const env = getUnitaidEnv();

	if (env.sourceUrl) {
		try {
			const text = await fetchCsvText(env.sourceUrl, {
				tag: config.tag,
				revalidateSeconds: env.revalidateSeconds,
			});
			return {
				ok: true,
				dataset: name,
				source: "remote",
				fetchedAt: new Date().toISOString(),
				rows: config.parse(text),
			};
		} catch (err) {
			console.error(`[unitaid/data] upstream failed for "${name}", using fallback`, err);
		}
	}

	const text = await readBundledText(config.fallbackFile);
	return {
		ok: true,
		dataset: name,
		source: "fallback",
		fetchedAt: new Date().toISOString(),
		rows: config.parse(text),
	};
}
