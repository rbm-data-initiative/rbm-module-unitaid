"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export const SIDEBAR_WIDTH_COLLAPSED = 60;
export const SIDEBAR_WIDTH_EXPANDED = 270;

/**
 * Simplified version of the host's Dashboard shell: a collapsible sidebar on
 * the left and a fixed header on top. Page content starts below the header,
 * which is why module pages use `pt-16`.
 */
export default function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="flex min-h-screen w-full flex-row">
			<Sidebar expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
			<div className="relative flex min-h-screen w-full flex-col">
				<Header expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
				<div className="w-full">{children}</div>
			</div>
		</div>
	);
}
