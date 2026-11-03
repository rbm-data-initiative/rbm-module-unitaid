"use client";

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export const SIDEBAR_WIDTH_COLLAPSED = 60;
export const SIDEBAR_WIDTH_EXPANDED = 270;

/**
 * Simplified version of the host's Dashboard shell: a collapsible sidebar on
 * the left and a transparent header laid over the top of the content column.
 * Page content starts at the very top, under the header, which is why module
 * pages open with a hero block using `pt-16`.
 */
export default function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
	const [expanded, setExpanded] = useState(true);

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
