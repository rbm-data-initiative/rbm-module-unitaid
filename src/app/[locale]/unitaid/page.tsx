import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { DashboardAssets } from "@/app/[locale]/unitaid/components/Dashboard";
import { Banner } from "@/app/[locale]/unitaid/components/frame/Banner";
import { HostHeaderBand } from "@/app/[locale]/unitaid/components/HostHeaderBand";
import { frameText } from "@/app/[locale]/unitaid/components/frame/text";
import { frameView } from "@/app/[locale]/unitaid/components/frame/view";
import { getDashboard } from "@/app/[locale]/unitaid/lib/data";
import { formsEnabled } from "@/app/[locale]/unitaid/lib/env";
import { DatasetError, type Localized } from "@/app/[locale]/unitaid/lib/dataset";
import { isLocale } from "@/app/[locale]/unitaid/utils/locales";
import { mapInput } from "@/app/[locale]/unitaid/utils/map";
import { mapCountries } from "@/app/[locale]/unitaid/lib/map-countries";
import { launchFont } from "./fonts";
import PageContent from "./page-content";

// Re-check the dataset every 5 minutes: lib/data.ts REVALIDATE, written out
// because Next.js reads this value from the source.
export const revalidate = 300;

// The dashboard's files, served from public/unitaid/.
const ASSETS: DashboardAssets = {
	logo: "/unitaid/unitaid-logo.svg",
	whoEmblem: "/unitaid/who-emblem.svg",
	mapShapes: "/unitaid/world-shapes.json",
	mapWorker: "/unitaid/maplibre-gl-worker.mjs",
};

interface ParamsProps {
	params: Promise<{ locale: string }>;
}

// The page's title, description and keywords in its language:
// Unitaid.metadata in i18n/<locale>.json, as the host reads them.
export async function generateMetadata({ params }: ParamsProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Unitaid" });
	return {
		title: t("metadata.title"),
		description: t("metadata.description"),
		keywords: t("metadata.keywords"),
	};
}

// The server loads the dataset and works out what the frame and the map show
// from it; PageContent and the Dashboard (client components) do the rest. No
// data request leaves the visitor's browser.
export default async function Page({ params }: ParamsProps) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();

	let ds: Localized;
	try {
		ds = await getDashboard(locale);
	} catch (e) {
		// A schema the code does not know is not going to pass by itself, so say
		// so, as the static pages do, in the page's language. "unavailable" (the
		// host and the bundled copy both unreadable) is thrown on, so Next.js
		// keeps the last good page, or shows error.tsx when there is none.
		if (e instanceof DatasetError && e.kind === "schema") {
			return (
				// in its own root: there is no data for the frame to draw
				<>
					<HostHeaderBand />
					<div className={`launch-dashboard ${launchFont.variable}`}>
						<div className="wrap" role="status">
							<Banner kind="schema" text={frameText(locale).banner} />
						</div>
					</div>
				</>
			);
		}
		throw e;
	}

	return (
		<PageContent
			locale={locale}
			data={ds.data}
			sources={ds.sources.sources}
			frameView={frameView(ds, locale, frameText(locale))}
			mapInput={mapInput(ds, mapCountries(locale), locale)}
			formsEnabled={formsEnabled()}
			assets={ASSETS}
		/>
	);
}
