import { launchFont } from "@/app/[locale]/unitaid/fonts";
import BottlenecksBanner from "@/ui/dashboard/BottlenecksBanner";
import TARequestBanner from "@/ui/dashboard/TARequestBanner";
import type { HeaderText } from "./frame/text";

// The dashboard's header (Unitaid, 6, 10 and 11 Nov 2026): Unitaid's logo, a
// thin divider and the title with its description, all left-aligned as one
// lockup, and the host's two QR banners on the right, on Unitaid's graphic
// under a Navy layer. It starts at the top of the page, behind the host's
// transparent 56px header (src/ui/shell/Header.tsx, z-30, so it stays above
// the layer), and replaces HostHeaderBand on the dashboard; the unsubscribe
// page keeps the band. Outside .launch-dashboard: Tailwind, the text in
// Unitaid's brand typeface, Source Sans 3 (launchFont, the dashboard's own
// font, Arial as its fallback, as Unitaid's guideline sets), and the banners
// as the host draws them.
//
// Unitaid's guideline (brandpad.io/unitaid, read 11 Nov 2026) sets:
// - Text left-aligned, never mixed with centred text: the title and the
//   description are left-aligned.
// - The logo top left, 350px wide on a widescreen, white on colour.
// - A safety area around the logo as tall as its hummingbird marque. In this
//   logo the marque is 20% of the logo's width: 70px at 350px. So nothing
//   comes nearer the logo than that: the divider is that far to its right,
//   the title that far below it when it goes under the logo, and the logo
//   sits that far below the host's menu button, which ends 46px from the
//   top. Beside the title the logo is always 350px and the space 70px;
//   stacked, the logo is the column's width (about 282px on a 390px phone)
//   and the space min(70px, 20vw - 22px): 56px at 390px.
// - Only palette colours: the layer is Unitaid Navy (#212e92) at 70%. Over
//   the graphic's lightest pixel (#80e2ff, its Sky Blue lightened by the
//   WebP compression) that gives 5.71:1 against white (the earlier #0040c0
//   layer, not a palette colour, gave 4.79:1; Navy at 60%, 4.55:1), so the
//   white text here and the host's white header text pass 4.5:1 wherever
//   the graphic is cropped. The divider is white at 50%.
//
// Logo and title side by side on every laptop and wider screen, with the
// logo at its full 350px (Unitaid, 11 Nov 2026). The header is a size
// container, so these follow the header's own width, with the host's menu
// open or closed:
// - From 1450px: one row, logo | divider | title ... banners (Unitaid's
//   screenshot of 11 Nov 2026). Padding 128 + logo 350 + 70 + divider 1 +
//   32 + title 448 + 32 + banners 389 (French, the widest) = 1450, where the
//   English title is 28.7px on one line. A 1728px laptop with the menu open
//   (header 1458px) and anything wider.
// - From 1000px: logo | divider | title on one line, and the banners,
//   unchanged, on the line below at the right: beside a 350px logo and its
//   clear space, the banners (377 to 389px) leave too little room for the
//   title (about 190px on a 1440px laptop). The title fills the rest of its
//   line: 28.5px in English at 1000px, 36px from about 1130px.
// - Under 1000px (tablets, phones): the title under the logo, the banners
//   beside or under it.
// The title is 6.4% of its column (in Source Sans 3 Bold the English title
// is 15.43 times its font size wide, so it stays on one line), 24 to 36px;
// French and Portuguese, longer, wrap onto balanced lines. The description
// and the banners keep their sizes everywhere.
//
// public/unitaid/header-graphic.webp is the graphic Unitaid sent (1600x900),
// drawn from its bottom left so its striped band shows on the left (Unitaid,
// 10 Nov 2026). The side padding is the dashboard's own, clamp(24px, 4vw,
// 64px), so the logo and the banners line up with the dashboard's edges.
//
// The logo is Unitaid's all-white logo with its tagline, the logo pack's
// RGB/Tagline/UNITAID_Logo_tagline_RGB_White.svg unchanged. It links to
// unitaid.org.
const LOGO = "/unitaid/unitaid-logo-tagline-white.svg";

export function HostHero({ text }: { text: HeaderText }) {
	return (
		<div className="relative w-full bg-[#212e92] bg-[url('/unitaid/header-graphic.webp')] bg-cover bg-left-bottom bg-no-repeat [container-type:inline-size]">
			<div aria-hidden="true" className="absolute inset-0 bg-[#212e92]/70" />
			<div className="relative flex w-full flex-col gap-6 px-[clamp(24px,4vw,64px)] pb-6 pt-[calc(46px_+_min(70px,_20vw_-_22px))] md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-x-8 md:pb-7 [@container(min-width:1000px)]:items-center [@container(min-width:1450px)]:flex-nowrap">
				<div className="flex min-w-0 flex-col gap-[min(70px,_20vw_-_22px)] md:flex-1 md:basis-[440px] [@container(min-width:1000px)]:basis-full [@container(min-width:1000px)]:flex-row [@container(min-width:1000px)]:items-center [@container(min-width:1000px)]:gap-0 [@container(min-width:1450px)]:basis-0">
					<a
						href="https://unitaid.org"
						target="_blank"
						rel="noopener noreferrer"
						className="block w-full max-w-[350px] shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
					>
						<img
							src={LOGO}
							alt={text.logoAlt}
							width={1200}
							height={418}
							className="block h-auto w-full"
						/>
					</a>
					<div
						aria-hidden="true"
						className="hidden w-px shrink-0 self-stretch bg-white/50 [@container(min-width:1000px)]:ml-[70px] [@container(min-width:1000px)]:mr-8 [@container(min-width:1000px)]:block"
					/>
					{/* The title's size follows its column (cqi, see above). */}
					<div className="flex min-w-0 flex-col gap-2 text-left [container-type:inline-size] md:flex-1">
						<h1
							className={`${launchFont.className} font-bold leading-tight text-white [text-wrap:balance] [font-size:clamp(1.5rem,6.4cqi,2.25rem)] lg:[&:lang(en)]:whitespace-nowrap`}
						>
							{text.title}
						</h1>
						<p className={`${launchFont.className} text-base text-white`}>{text.subtitle}</p>
					</div>
				</div>
				{/* The host's QR banners, used unchanged; on this page their text is
				    Unitaid's Source Sans 3 too (brand sheet, 10 Nov 2026): the
				    components set Roboto on their headings, so the font is forced.
				    Their colours are the host's and stay so. */}
				<div
					className={`${launchFont.className} flex flex-col gap-2 md:shrink-0 md:flex-row md:gap-3.5 [@container(min-width:1000px)]:ml-auto [&_*]:![font-family:inherit]`}
				>
					<BottlenecksBanner direction="horizontal" />
					<TARequestBanner direction="horizontal" />
				</div>
			</div>
		</div>
	);
}
