import "server-only";

import Papa from "papaparse";
import type { SampleRow } from "@/app/[locale]/unitaid/types";

const normalizeKey = (key: string) =>
	key
		.replace(/ /g, " ")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");

const parseNumber = (value: string | undefined) => {
	const normalized = (value ?? "").replace(/,/g, "").trim();
	if (!normalized) return Number.NaN;
	return Number(normalized);
};

/**
 * Parses the sample CSV (columns: year, country, value) into typed rows.
 * Header names are normalised the same way the host does for Google Sheets
 * exports (NBSP removed, lowercased, non-alphanumerics stripped).
 */
export function parseSampleCsv(csvText: string): SampleRow[] {
	const parsed = Papa.parse<Record<string, string>>(csvText, {
		header: true,
		skipEmptyLines: true,
		transformHeader: normalizeKey,
	});

	const rows: SampleRow[] = [];
	for (const raw of parsed.data) {
		const year = parseNumber(raw.year);
		const value = parseNumber(raw.value);
		const country = (raw.country ?? "").trim();
		if (!Number.isFinite(year) || !Number.isFinite(value) || !country) continue;
		rows.push({ year, country, value });
	}

	return rows.sort((a, b) => a.year - b.year || a.country.localeCompare(b.country));
}
