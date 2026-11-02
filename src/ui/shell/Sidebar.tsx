"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { SIDEBAR_ITEMS } from "./sidebar-items";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from "./Shell";

interface SidebarProps {
	expanded: boolean;
	onToggle: () => void;
}

export default function Sidebar({ expanded, onToggle }: SidebarProps) {
	const t = useTranslations("Sidebar");
	const pathname = usePathname();
	const width = expanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

	return (
		<aside className="h-screen flex-shrink-0 transition-[width] duration-300" style={{ width }}>
			<nav className="flex h-full flex-col bg-[#1e293b]" style={{ width }}>
				<button
					type="button"
					onClick={onToggle}
					aria-label={expanded ? "Collapse menu" : "Expand menu"}
					className="flex h-14 w-full items-center justify-center bg-blue-600 p-2"
				>
					<Image src="/brand.webp" alt="RBM" width={40} height={40} className="h-10 w-10" />
					<Image
						src="/logotipo.webp"
						alt="RBM Partnership to End Malaria"
						width={87}
						height={40}
						className={`h-10 overflow-hidden transition-all ${expanded ? "w-[87px]" : "w-0"}`}
					/>
				</button>

				<ul className="mt-4 flex-1 overflow-y-auto">
					{SIDEBAR_ITEMS.map((item) => {
						const active = pathname === item.href;
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									title={item.tooltipTranslationKey ? t(item.tooltipTranslationKey) : undefined}
									className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
										active
											? "bg-slate-700 text-white"
											: "text-slate-300 hover:bg-slate-800 hover:text-white"
									}`}
								>
									<span className="flex-shrink-0">{item.icon}</span>
									<span className={`truncate ${expanded ? "block" : "hidden"}`}>
										{t(item.translationKey)}
									</span>
									{item.tag && expanded && (
										<span className="ml-auto rounded bg-rbm-green px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
											{item.tag}
										</span>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}
