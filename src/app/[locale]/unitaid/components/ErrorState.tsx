"use client";

import { useTranslations } from "next-intl";

interface ErrorStateProps {
	message?: string;
	onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
	const t = useTranslations("Unitaid.states");
	return (
		<div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
			<p>{t("error")}</p>
			{message && <p className="text-xs text-red-500">{message}</p>}
			<button
				type="button"
				onClick={onRetry}
				className="rounded bg-rbm-blue px-3 py-1 text-white hover:bg-blue-700"
			>
				{t("retry")}
			</button>
		</div>
	);
}
