import type { LocalePrefix, Pathnames } from "next-intl/routing";

// Same values as the host project (src/config.ts). Do not change.
export const defaultLocale = "en" as const;
export const locales = ["en", "fr", "pt"] as const;
export type AppLocale = (typeof locales)[number];

export const pathnames: Pathnames<typeof locales> = {
	"/": "/",
	"/unitaid": "/unitaid",
};

export const localePrefix: LocalePrefix<typeof locales> = "always";
