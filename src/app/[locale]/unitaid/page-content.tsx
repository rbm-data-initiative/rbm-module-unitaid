"use client";

// The page's client part: the Dashboard, with the open medicine carried in
// the address as a ?product=<id> query parameter, so a link can open one.
//
// The address is read after the page has hydrated, not by the server page:
// reading searchParams there would make every request render the page anew
// (no pre-built /en, /fr, /pt), and useSearchParams() in a pre-built page
// needs a Suspense boundary that would render the whole dashboard in the
// browser only. So the page arrives with every row closed, then opens and
// scrolls to the medicine, as today's page did for #pyramax after its script
// had run.
import { useCallback, useEffect, useState } from "react";
import { Dashboard, type DashboardProps } from "@/app/[locale]/unitaid/components/Dashboard";
import { frameText } from "@/app/[locale]/unitaid/components/frame/text";
import { HostHero } from "@/app/[locale]/unitaid/components/HostHero";
import "./styles/launch-dashboard.css";

const PARAM = "product";

const fromAddress = () => new URLSearchParams(window.location.search).get(PARAM);

export default function PageContent(
	props: Omit<DashboardProps, "initialProduct" | "onProductChange">,
) {
	const [product, setProduct] = useState<string | null>(null);

	// on load, and on back and forward
	useEffect(() => {
		const read = () => setProduct(fromAddress());
		read();
		window.addEventListener("popstate", read);
		return () => window.removeEventListener("popstate", read);
	}, []);

	// A row the reader opened goes into the address, replacing the entry (the
	// back button still leaves the page, as today's did not add entries
	// either). Passing the id back is the board's echo: no jump.
	const onProductChange = useCallback((id: string) => {
		const url = new URL(window.location.href);
		url.searchParams.set(PARAM, id);
		window.history.replaceState(null, "", url);
		setProduct(id);
	}, []);

	return (
		<>
			<HostHero text={frameText(props.locale).header} />
			<Dashboard {...props} initialProduct={product} onProductChange={onProductChange} />
		</>
	);
}
