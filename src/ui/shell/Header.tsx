"use client";

import { CircleChevronLeft, CircleChevronRight } from "lucide-react";
import Image from "next/image";
import LocaleSwitcher from "./LocaleSwitcher";
import unops from "../../../public/hosted_unops.webp";

interface HeaderProps {
	expanded: boolean;
	onToggle: () => void;
}

/**
 * Simplified version of the host's header (src/ui/dashboard/Header.tsx):
 * transparent, white text, absolutely positioned over the top of the page.
 * Pages therefore start with a hero block that uses `pt-16` and a dark or
 * image background, as the module starter page does.
 */
export default function Header({ expanded, onToggle }: HeaderProps) {
	return (
		<header className="absolute left-0 right-0 top-0 z-30 flex h-14 w-full items-center justify-between border-b border-blue-600 text-white">
			<div className="flex flex-row items-center justify-start">
				<button
					type="button"
					onClick={onToggle}
					aria-label={expanded ? "Collapse menu" : "Expand menu"}
					className="p-1.5"
				>
					{expanded ? <CircleChevronLeft /> : <CircleChevronRight />}
				</button>
			</div>
			<div className="flex flex-row items-center">
				<LocaleSwitcher />
				<Image src={unops} className="mr-4" alt="UNOPS" width={89} height={40} />
			</div>
		</header>
	);
}
