import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageContent from "./page-content";

interface ParamsProps {
	params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ParamsProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Unitaid" });

	return {
		title: t("metadata.title"),
		description: t("metadata.description"),
		keywords: t("metadata.keywords"),
	};
}

export default function Page() {
	return <PageContent />;
}
