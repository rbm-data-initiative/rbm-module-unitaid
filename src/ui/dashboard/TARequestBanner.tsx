import Image from "next/image";
import { useTranslations } from "next-intl";
import type React from "react";
import { roboto } from "@/fonts";

import taForm from "../../../public/taform/taform-qr-code-new.png";

/**
 * Copied from the host project (src/ui/dashboard/TARequestBanner.tsx).
 * Modules import it as `@/ui/dashboard/TARequestBanner`; the path is the same
 * in the Global Malaria Dashboard, so the module code migrates unchanged.
 */
interface TARequestBannerProps {
	direction?: "vertical" | "horizontal";
	fullWidth?: boolean;
}

const TARequestBanner: React.FC<TARequestBannerProps> = ({
	direction = "vertical",
	fullWidth = false,
}) => {
	const t = useTranslations("components.taRequestBanner");
	return (
		<a
			href="https://dashboards.endmalaria.org/en/taform"
			target="_blank"
			rel="noreferrer"
			className={`w-full flex ${direction === "vertical" ? "flex-col max-w-[120px] min-h-[170px] justify-between" : `flex-row-reverse w-full ${fullWidth ? "" : "md:max-w-[190px]"} min-h-[70px] justify-end`} p-2 gap-1  bg-rbm-blue hover:bg-[#4BC2E7]/90`}
		>
			<div
				className={`flex flex-col pr-1 ${direction === "vertical" ? "justify-between" : "justify-start"}`}
			>
				<span className="text-white text-sm md:text-[10px]">{t("makeYour")}</span>
				<h3
					className={`${roboto.className} text-lg md:text-[10px] font-bold leading-none text-rbm-green`}
				>
					{t("technicalAssistance")}
				</h3>
				<h2 className={`${roboto.className} text-md md:text-[14px]  text-white`}>{t("request")}</h2>
			</div>
			<Image
				src={taForm}
				className={`${direction === "vertical" ? "w-full h-25" : "w-[80px] md:w-[60px]"} `}
				alt="TA Request QR Code"
			/>
		</a>
	);
};

export default TARequestBanner;
