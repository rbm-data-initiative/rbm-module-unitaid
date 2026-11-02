"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { roboto } from "@/fonts";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";
import SampleLineChart from "./components/SampleLineChart";
import { useUnitaidDataset } from "./hooks/useUnitaidDataset";
import "./styles/unitaid.css";

export default function PageContent() {
	const t = useTranslations("Unitaid");
	const locale = useLocale();
	const format = useFormatter();
	const { data, error, isLoading, refresh } = useUnitaidDataset("sample");

	const total = data ? data.rows.reduce((sum, row) => sum + row.value, 0) : 0;

	return (
		<main className="flex w-full min-h-screen flex-col p-4 pt-16">
			<div className="mx-auto w-full max-w-[1600px]">
				<div className="w-full border-b-4 border-rbm-green py-2">
					<h1 className={`${roboto.className} text-3xl font-bold text-slate-900`}>{t("title")}</h1>
					<p className="mt-1 text-sm text-slate-600">{t("subtitle")}</p>
				</div>

				<section className="mt-6 grid grid-cols-10 gap-4">
					<div className="unitaid-card col-span-10 p-4 md:col-span-7">
						{isLoading && <LoadingState />}
						{error && <ErrorState message={error.message} onRetry={refresh} />}
						{data && !error && <SampleLineChart rows={data.rows} />}
					</div>

					<aside className="unitaid-card col-span-10 flex flex-col gap-3 p-4 md:col-span-3">
						<h2 className="text-sm font-semibold uppercase text-slate-500">{t("summary.title")}</h2>
						<p className="text-3xl font-bold text-rbm-blue">{data ? format.number(total) : "—"}</p>
						<p className="text-xs text-slate-500">{t("summary.totalLabel")}</p>
						{data && (
							<p className="text-xs text-slate-500">
								{t("source.label")}: {t(`source.${data.source}`)} ·{" "}
								{format.dateTime(new Date(data.fetchedAt), {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</p>
						)}
						<p className="text-xs text-slate-400">{t("localeNote", { locale })}</p>
					</aside>
				</section>
			</div>
		</main>
	);
}
