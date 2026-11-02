import type {
	ApiError,
	DatasetName,
	DatasetResponse,
	SampleRow,
} from "@/app/[locale]/unitaid/types";

const API_BASE = "/api/unitaid";

/**
 * Client-side service: talks only to the module's own API routes.
 * Same pattern as src/services/MalariaEpiService.ts in the host project.
 */
export async function fetchDataset(dataset: DatasetName): Promise<DatasetResponse<SampleRow>> {
	const res = await fetch(`${API_BASE}/data?dataset=${encodeURIComponent(dataset)}`);

	if (!res.ok) {
		let message = `Failed to load dataset "${dataset}" (${res.status})`;
		try {
			const body = (await res.json()) as ApiError;
			if (body?.message) message = body.message;
		} catch {
			// keep the generic message
		}
		throw new Error(message);
	}

	return res.json();
}
