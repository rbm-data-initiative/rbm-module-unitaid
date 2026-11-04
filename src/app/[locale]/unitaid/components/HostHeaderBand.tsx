// The band behind the host's header. RBM's header sits over the top 56px of
// every page, transparent with white text (the host's src/ui/shell/Header.tsx:
// pages start with a block that clears it, on a dark or image background).
// This is that background, the host's own header image, so the header stays
// legible and the dashboard starts below it. Outside .launch-dashboard: it is
// the host's look, not the dashboard's.
export function HostHeaderBand() {
	return (
		<div aria-hidden="true" className="h-14 w-full bg-[url('/bg-programmatic-min.webp')] bg-top" />
	);
}
