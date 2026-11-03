"use client";

import { InfoIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { roboto } from "@/fonts";
import BottlenecksBanner from "@/ui/dashboard/BottlenecksBanner";
import Modal from "@/ui/dashboard/Modal";
import TARequestBanner from "@/ui/dashboard/TARequestBanner";
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
	const [isKnowMoreOpen, setIsKnowMoreOpen] = useState(false);

	const total = data ? data.rows.reduce((sum, row) => sum + row.value, 0) : 0;

	return (
		<main className="flex w-full min-h-screen flex-col">
			{/* Page header: same layout as the host's Global Fund Cycle 8 page.
			    Background image, banners and Modal come from the host and are protected. */}
			<div className="flex w-full flex-col items-center bg-[url('/bg-programmatic-min.webp')] bg-top">
				<div className="relative grid w-full max-w-[1600px] grid-cols-10 gap-4 p-4 pt-16">
					<div className="col-span-10 flex flex-col md:col-span-6">
						<div className="flex flex-col gap-2 md:flex-row md:items-center">
							<h1 className={`${roboto.className} text-5xl font-bold text-white`}>{t("title")}</h1>
							<button
								type="button"
								title={t("knowMore")}
								onClick={() => setIsKnowMoreOpen(true)}
								className="w-fit rounded-md border border-transparent bg-blue-400 p-1 px-2 text-[12px] text-white hover:border-white hover:bg-blue-700 md:ml-3"
							>
								<span className="flex flex-row items-center">
									<InfoIcon size={16} className="mr-1" />
									{t("knowMore")}
								</span>
							</button>
						</div>
						<p className={`${roboto.className} my-4 text-sm text-white`}>{t("description")}</p>
					</div>
					<div className="col-span-10 flex w-full flex-col md:col-span-4">
						<div className="flex flex-col items-center justify-center gap-2 md:flex-row">
							<TARequestBanner direction="horizontal" />
							<BottlenecksBanner direction="horizontal" />
						</div>
					</div>
				</div>
			</div>

			<div className="mx-auto w-full max-w-[1600px] p-4">
				<section className="grid grid-cols-10 gap-4">
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

			<Modal isOpen={isKnowMoreOpen} onClose={() => setIsKnowMoreOpen(false)} title={t("knowMore")}>
				<div className="space-y-4 text-sm text-slate-700">
					<p>{t("modal.intro")}</p>
					<p>{t("modal.body")}</p>
				</div>
			</Modal>
		</main>
	);
}
