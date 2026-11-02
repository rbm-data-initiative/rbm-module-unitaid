import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type AppLocale } from "./config";

// Shell messages (messages/<locale>.json) are merged with the module's own
// messages (src/app/[locale]/unitaid/i18n/<locale>.json). The module files
// are exactly what the host maintainers merge into their messages/*.json.
const MODULE_MESSAGES: Record<AppLocale, () => Promise<{ default: Messages }>> = {
	en: () => import("./app/[locale]/unitaid/i18n/en.json"),
	fr: () => import("./app/[locale]/unitaid/i18n/fr.json"),
	pt: () => import("./app/[locale]/unitaid/i18n/pt.json"),
};

type Messages = AbstractIntlMessages;

const isPlainObject = (value: unknown): value is Messages =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function deepMerge(base: Messages, extra: Messages): Messages {
	const out: Messages = { ...base };
	for (const [key, value] of Object.entries(extra)) {
		const current = out[key];
		out[key] = isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
	}
	return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale: AppLocale = (locales as readonly string[]).includes(requested ?? "")
		? (requested as AppLocale)
		: defaultLocale;

	const base = (await import(`../messages/${locale}.json`)).default as Messages;
	const mod = (await MODULE_MESSAGES[locale]()).default;

	return {
		locale,
		messages: deepMerge(base, mod),
	};
});
