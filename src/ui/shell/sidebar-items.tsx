import { Activity, HomeIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { pathnames } from "@/config";

/**
 * Mirrors the shape of SIDEBAR_ITEMS in the host project
 * (src/ui/dashboard/Dashboard.tsx). When the module is integrated, the host
 * maintainers add an equivalent entry there, inside the proper menu group.
 */
export interface SidebarNavigationItem {
	href: keyof typeof pathnames;
	icon: ReactNode;
	translationKey: string;
	tooltipTranslationKey?: string;
	tag?: string;
}

export const SIDEBAR_ITEMS: SidebarNavigationItem[] = [
	{
		href: "/",
		icon: <HomeIcon size={18} />,
		translationKey: "home",
		tooltipTranslationKey: "home_tooltip",
	},
	{
		href: "/unitaid",
		icon: <Activity size={18} />,
		translationKey: "partners_subitem_unitaid",
		tooltipTranslationKey: "partners_subitem_unitaid_tooltip",
		tag: "New",
	},
];
