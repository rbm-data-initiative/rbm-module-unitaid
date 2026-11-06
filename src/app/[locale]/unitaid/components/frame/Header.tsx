import { CsvButton } from "./CsvButton";
import { Subscribe } from "./Subscribe";
import type { HeaderText, SubscribeText } from "./text";

/**
 * The bar under the photo header: the "Last updated" line, Download CSV and
 * Subscribe for updates. The title, the description and "Powered by" Unitaid
 * moved into the photo header (HostHero) on 6 Nov 2026. Subscribe is left
 * out when the forms are off (`subscribe` null), as the static build
 * hides it with `--api-url none`.
 */
export function Header({
	text,
	subscribeText,
	updated,
	csv,
	subscribe,
}: {
	text: HeaderText;
	subscribeText: SubscribeText;
	/** "Last updated 19 Oct 2026" (frameView) */
	updated: string;
	/** the download; null hides the button, as the page did when it had no data */
	csv: { text: string; fileName: string } | null;
	subscribe: { endpoint: string; open: boolean; onOpenChange: (open: boolean) => void } | null;
}) {
	return (
		<header>
			<div className="hd-bar">
				<div className="hd-text">
					<div className="hd-status">
						<span id="updated">{updated}</span>
					</div>
				</div>
				<div className="hdr-actions">
					{csv && <CsvButton label={text.downloadCsv} csv={csv.text} fileName={csv.fileName} />}
					{subscribe && (
						<Subscribe
							text={subscribeText}
							endpoint={subscribe.endpoint}
							open={subscribe.open}
							onOpenChange={subscribe.onOpenChange}
						/>
					)}
				</div>
			</div>
		</header>
	);
}
