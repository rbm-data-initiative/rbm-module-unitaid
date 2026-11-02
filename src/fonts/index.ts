import localFont from "next/font/local";

/**
 * Self-hosted replacements for the next/font/google Roboto / Inter / Poppins
 * loaders that used to be declared ad-hoc in dozens of files.
 *
 * Why: `next/font/google` downloads the actual font files from
 * fonts.gstatic.com *during `next build`*. On our Elastic Beanstalk deploy
 * instances that host is not reliably reachable, which made `next build`
 * fail in the predeploy hook ("Failed to fetch `Roboto` from Google Fonts").
 * Bundling the woff2 files locally (see ./files) removes that network
 * dependency from the build entirely. The static files were downloaded once
 * from the same Google Fonts CDN (latin subset) the app was already using,
 * so visual output is unchanged.
 *
 * The exported objects expose the same `.className` / `.style` API as
 * next/font/google, so call sites don't need to change beyond the import.
 */

export const roboto = localFont({
	src: [
		{ path: "./files/roboto-100.woff2", weight: "100", style: "normal" },
		{ path: "./files/roboto-400.woff2", weight: "400", style: "normal" },
		{ path: "./files/roboto-500.woff2", weight: "500", style: "normal" },
	],
	variable: "--font-roboto",
	display: "swap",
});

export const inter = localFont({
	src: [
		{ path: "./files/inter-100.woff2", weight: "100", style: "normal" },
		{ path: "./files/inter-400.woff2", weight: "400", style: "normal" },
		{ path: "./files/inter-500.woff2", weight: "500", style: "normal" },
	],
	variable: "--font-inter",
	display: "swap",
});

export const poppins = localFont({
	src: [
		{ path: "./files/poppins-100.woff2", weight: "100", style: "normal" },
		{ path: "./files/poppins-400.woff2", weight: "400", style: "normal" },
		{ path: "./files/poppins-500.woff2", weight: "500", style: "normal" },
		{ path: "./files/poppins-600.woff2", weight: "600", style: "normal" },
		{ path: "./files/poppins-700.woff2", weight: "700", style: "normal" },
	],
	variable: "--font-poppins",
	display: "swap",
});
