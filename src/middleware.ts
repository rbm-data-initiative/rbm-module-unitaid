import createMiddleware from "next-intl/middleware";
import { localePrefix, defaultLocale, locales, pathnames } from "./config";

export default createMiddleware({
	defaultLocale,
	locales,
	localePrefix,
	pathnames,
});

export const config = {
	matcher: [
		// Redirect the root to the matching locale
		"/",
		// Localised pages
		"/(en|fr|pt)/:path*",
		// Add missing locale prefixes, except for API routes and static files
		"/((?!api|_next|_vercel|.*\\..*).*)",
	],
};
