import { poppins } from "@/fonts";
import BottlenecksBanner from "@/ui/dashboard/BottlenecksBanner";
import TARequestBanner from "@/ui/dashboard/TARequestBanner";
import type { HeaderText } from "./frame/text";

// The dashboard's photo header (Unitaid, 6 Nov 2026): the title, the
// description, "Powered by" Unitaid and the host's two QR banners on a photo
// in the blue of the host's own header image. It starts at the top of the
// page, behind the host's transparent 56px header (src/ui/shell/Header.tsx),
// and replaces HostHeaderBand on the dashboard; the unsubscribe page keeps
// the band. Outside .launch-dashboard: it follows the host's look (Tailwind,
// Poppins, the banners as the host draws them), not the dashboard's.
//
// public/unitaid/header-photo.webp is the children's photo Unitaid chose,
// recoloured with the colours of the host's /bg-programmatic-min.webp
// (brightness matched to it too), the slide's white panel and stripes painted
// over in its navy. Its brightest pixel is 4.73:1 against white, so the
// white text passes 4.5:1 wherever the photo is cropped.
//
// Where the photo sits: under 1024px it covers the header, centred on the
// boy and his hand; from 1024px it is drawn at 125% of the header's width,
// aligned right, which puts his eyes between "Powered by" and the banners
// instead of under the green banner.
const LOGO = "/unitaid/unitaid-logo-white.svg";

export function HostHero({ text }: { text: HeaderText }) {
	return (
		<div className="w-full bg-[#022f7b] bg-[url('/unitaid/header-photo.webp')] bg-cover bg-[position:60%_50%] bg-no-repeat lg:bg-[length:125%_auto] lg:bg-[position:right_37%]">
			<div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-6 pt-[76px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-4 md:px-[60px] md:pb-7 md:pt-[81px]">
				{/* basis 520px, not its full width: the row then breaks on 520px,
				    so a long title (French) wraps inside its block and the banners
				    keep their place; they move under it only below ~1000px. */}
				<div className="flex min-w-0 flex-col gap-4 md:flex-1 md:basis-[520px] md:flex-row md:items-center md:gap-[18px]">
					<div className="flex min-w-0 flex-col gap-1.5 md:max-w-[560px]">
						<h1
							className={`${poppins.className} m-0 text-2xl font-semibold leading-tight text-white md:text-[26px]`}
						>
							{text.title}
						</h1>
						<p
							className={`${poppins.className} m-0 max-w-[445px] text-[15px] leading-snug text-white md:text-base`}
						>
							{text.subtitle}
						</p>
					</div>
					<div aria-hidden="true" className="hidden w-px self-stretch bg-white/45 md:block" />
					<a
						href="https://unitaid.org"
						target="_blank"
						rel="noopener noreferrer"
						className="flex w-fit shrink-0 flex-col gap-1 border-t border-white/45 pt-3.5 text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:border-t-0 md:pt-0"
					>
						<span className={`${poppins.className} text-[13px] leading-tight`}>
							{text.poweredBy}
						</span>
						<img
							src={LOGO}
							alt={text.logoAlt}
							width={1200}
							height={418}
							className="block h-auto w-[112px]"
						/>
					</a>
				</div>
				<div className="flex flex-col gap-2 md:shrink-0 md:flex-row md:gap-3.5">
					<BottlenecksBanner direction="horizontal" />
					<TARequestBanner direction="horizontal" />
				</div>
			</div>
		</div>
	);
}
