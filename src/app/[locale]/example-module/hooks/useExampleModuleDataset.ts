"use client";

import useSWR from "swr";
import { fetchDataset } from "@/app/[locale]/example-module/services/example-module-service";
import type { DatasetName } from "@/app/[locale]/example-module/types";

export function useExampleModuleDataset(dataset: DatasetName) {
	const { data, error, isLoading, mutate } = useSWR(
		["example-module", dataset],
		() => fetchDataset(dataset),
		{ revalidateOnFocus: false },
	);

	return { data, error: error as Error | undefined, isLoading, refresh: () => mutate() };
}
