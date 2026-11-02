"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { locales, type AppLocale } from "@/config";
import { usePathname, useRouter } from "@/navigation";

export default function LocaleSwitcher() {
	const t = useTranslations("header");
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const [isPending, startTransition] = useTransition();

	const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const next = event.target.value as AppLocale;
		startTransition(() => {
			router.replace(pathname, { locale: next });
		});
	};

	return (
		<select
			aria-label="Language"
			value={locale}
			onChange={onChange}
			disabled={isPending}
			className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
		>
			{locales.map((code) => (
				<option key={code} value={code}>
					{t(code)}
				</option>
			))}
		</select>
	);
}
