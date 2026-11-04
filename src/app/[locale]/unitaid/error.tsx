"use client";

// Shown only when the dataset could not be loaded, there is no earlier good
// copy, and the bundled copy cannot be read either (lib/data.ts
// loadDashboard()): the loader's "could not be loaded" banner, in the
// page's language (the frame's Banner and the message files). In its own
// .launch-dashboard root: there is no data for the frame to draw.
import { useParams } from "next/navigation";
import { launchFont } from "@/app/[locale]/unitaid/fonts";
import { Banner } from "@/app/[locale]/unitaid/components/frame/Banner";
import { HostHeaderBand } from "@/app/[locale]/unitaid/components/HostHeaderBand";
import { frameText } from "@/app/[locale]/unitaid/components/frame/text";
import { isLocale } from "@/app/[locale]/unitaid/utils/locales";
import "./styles/launch-dashboard.css";

export default function DashboardError() {
	const { locale } = useParams<{ locale: string }>();
	return (
		<>
			<HostHeaderBand />
			<div className={`launch-dashboard ${launchFont.variable}`}>
				<div className="wrap" role="alert">
					<Banner kind="fail" text={frameText(isLocale(locale) ? locale : "en").banner} />
				</div>
			</div>
		</>
	);
}
