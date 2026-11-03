import Image from "next/image";
import { useTranslations } from "next-intl";
import type React from "react";
import { roboto } from "@/fonts";

import bottlenecksQR from "../../../public/bottleneck-qr-code.png";

/**
 * Copied from the host project (src/ui/dashboard/BottlenecksBanner.tsx).
 * Modules import it as `@/ui/dashboard/BottlenecksBanner`; the path is the
 * same in the Global Malaria Dashboard, so the module code migrates unchanged.
 */
interface BottlenecksBannerProps {
	direction?: "vertical" | "horizontal";
	fullWidth?: boolean;
}

const BottlenecksBanner: React.FC<BottlenecksBannerProps> = ({
	direction = "vertical",
	fullWidth = false,
}) => {
	const t = useTranslations("components.bottlenecksBanner");
	return (
		<a
			href="https://dashboards.endmalaria.org/en/bottlenecks"
			target="_blank"
			rel="noreferrer"
			className={`w-full flex ${direction === "vertical" ? "flex-col max-w-[120px] min-h-[170px]" : `flex-row-reverse w-full ${fullWidth ? "" : "md:max-w-[190px]"} min-h-[70px]`} justify-end p-2 gap-1  bg-rbm-green hover:bg-[#4be7a9]/90`}
		>
			<div
				className={`flex flex-col pr-1 ${direction === "vertical" ? "justify-between" : "justify-start"}`}
			>
				<h2
					className={`${roboto.className} text-lg md:text-[12px] font-bold text-white leading-tight`}
				>
					{t("bottlenecks")}
				</h2>
				<h3
					className={`${roboto.className} text-md md:text-[10px] font-bold leading-none text-[#1e3653] mb-2`}
				>
					{t("text")}
				</h3>
			</div>
			<Image
				src={bottlenecksQR}
				className={`${direction === "vertical" ? "w-full h-25" : "w-[80px] md:w-[60px]"} `}
				alt="NMPs Bottlenecks"
			/>
		</a>
	);
};

export default BottlenecksBanner;
