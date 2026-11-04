import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HostHeaderBand } from "@/app/[locale]/unitaid/components/HostHeaderBand";
import { Unsubscribe } from "@/app/[locale]/unitaid/components/unsubscribe/Unsubscribe";
import { unsubscribeText } from "@/app/[locale]/unitaid/components/unsubscribe/text";
import { isLocale } from "@/app/[locale]/unitaid/utils/locales";
import "../styles/launch-dashboard.css";

// The "Unsubscribe?" page: /en/unitaid/unsubscribe, /fr/unitaid/unsubscribe,
// /pt/unitaid/unsubscribe.
// The link in the welcome email opens the forms service, which sends the
// reader here with the link's token (?t=…); the button posts it to
// /api/unitaid/unsubscribe. The forms service cannot draw this page itself: on
// the forms service's own address a page is served as plain text, so it sends
// the readers of this site here.
//
// Never indexed, and no Referer: the address carries the token, and the link
// back must not hand it to anyone.
export async function generateMetadata({
	params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};
	return {
		title: unsubscribeText(locale).title,
		robots: { index: false, follow: false },
		referrer: "no-referrer",
	};
}

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	return (
		<>
			<HostHeaderBand />
			<Unsubscribe text={unsubscribeText(locale)} backHref={`/${locale}/unitaid`} />
		</>
	);
}
