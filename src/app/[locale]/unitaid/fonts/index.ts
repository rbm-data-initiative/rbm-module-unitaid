// The dashboard's typeface, Source Sans 3 (Adobe, release 3.052, SIL Open
// Font License 1.1: SourceSans3-OFL.md beside this file). The variable font,
// upright and italic: the styles use weights between 400 and 800, including
// 650 and 750, which only a variable font draws.
//
// The dashboard's roots carry `launchFont.variable`, and
// styles/launch-dashboard.css reads it as var(--font-launch).
import localFont from "next/font/local";

export const launchFont = localFont({
	src: [
		{ path: "./files/source-sans-3-upright.woff2", weight: "200 900", style: "normal" },
		{ path: "./files/source-sans-3-italic.woff2", weight: "200 900", style: "italic" },
	],
	variable: "--font-launch",
	display: "swap",
	fallback: ["Arial", "sans-serif"],
});
