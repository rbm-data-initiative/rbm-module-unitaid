"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { locales, type AppLocale } from "@/config";
import { usePathname, useRouter } from "@/navigation";

/** Same select as the host header: transparent, white border, white text. */
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
			className="custom-select mr-6 rounded-lg border border-white bg-transparent py-1 text-[11px]"
		>
			{locales.map((code) => (
				<option key={code} value={code}>
					{t(code)}
				</option>
			))}
		</select>
	);
}
