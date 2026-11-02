"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";

interface HeaderProps {
	expanded: boolean;
	onToggle: () => void;
}

export default function Header({ onToggle }: HeaderProps) {
	const t = useTranslations("header");

	return (
		<header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
			<button
				type="button"
				onClick={onToggle}
				aria-label="Toggle menu"
				className="rounded p-1 text-slate-600 hover:bg-slate-100"
			>
				<Menu size={20} />
			</button>
			<div className="flex items-center gap-4">
				<LocaleSwitcher />
				{/* The host logo is white: it sits on the brand blue, as in the host's logo bar. */}
				<span className="flex h-10 items-center rounded-md bg-blue-600 px-2">
					<Image
						src="/hosted_unops.webp"
						alt={t("hostedBy")}
						width={89}
						height={34}
						className="h-[34px] w-auto"
					/>
				</span>
			</div>
		</header>
	);
}
