"use client";

import { useTranslations } from "next-intl";

export default function LoadingState() {
	const t = useTranslations("Unitaid.states");
	return (
		<div className="flex h-64 w-full animate-pulse items-center justify-center rounded-lg bg-slate-200 text-sm text-slate-500">
			{t("loading")}
		</div>
	);
}
