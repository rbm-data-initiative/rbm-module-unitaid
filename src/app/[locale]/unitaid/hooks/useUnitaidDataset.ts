"use client";

import useSWR from "swr";
import { fetchDataset } from "@/app/[locale]/unitaid/services/unitaid-service";
import type { DatasetName } from "@/app/[locale]/unitaid/types";

export function useUnitaidDataset(dataset: DatasetName) {
	const { data, error, isLoading, mutate } = useSWR(
		["unitaid", dataset],
		() => fetchDataset(dataset),
		{ revalidateOnFocus: false },
	);

	return { data, error: error as Error | undefined, isLoading, refresh: () => mutate() };
}
