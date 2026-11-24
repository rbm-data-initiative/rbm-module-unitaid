"use client";

// What the map's hint says for a country on the map or in the keyboard list
// (old: the map's mousemove handler and countryTip). The hint itself is the
// dashboard's one #tip (components/pathway/Tip.tsx), which the board's stage
// markers and glossary terms use too, as on the page; MapSection shows these
// in it. Until the areas were wired together the map had its own #tip here.
import type { listTip, mapTip, tipPolicyLine } from "@/app/[locale]/unitaid/utils/map";
import { stageLabel } from "./parts";
import { fill, type MapText } from "./text";

function PolicyLine({ line, text }: { line: ReturnType<typeof tipPolicyLine>; text: MapText }) {
	if (!line) return null;
	return (
		<div className="tprod">
			{text.use} · {line.product}:{" "}
			{line.groups.length
				? line.groups.map((g) => text.groups[g].short).join(", ")
				: text.notListed}
		</div>
	);
}

/**
 * A tracked country hovered on the map. No "Click for details ›" line since
 * 24 Nov 2026: the hint follows the pointer and takes no clicks, so the line
 * read as a link that could not be clicked (clicking where it was opened the
 * country under it). A click on the country opens its page in the Detail
 * panel beside the map. Its key, tooltip.mapClickForDetails, left the message
 * files with it, as it left LAUNCH's i18n/ui.en.json, their source.
 */
export function MapTipBody({
	tip,
	text,
}: { tip: NonNullable<ReturnType<typeof mapTip>>; text: MapText }) {
	return (
		<>
			<b>{tip.name}</b>
			<div className="tlvl">
				<span className={`mapsw ${tip.stage}`} />
				{stageLabel(text, tip.stage)}
			</div>
			<PolicyLine line={tip.policy} text={text} />
		</>
	);
}

/** A button of the keyboard country list, hovered or focused: every stage, each ticked where a source supports it. */
export function ListTipBody({ tip, text }: { tip: ReturnType<typeof listTip>; text: MapText }) {
	return (
		<>
			<b>{tip.name}</b>
			{tip.rows ? (
				tip.rows.map((r) => (
					<div key={r.key} className={r.on ? "tlvl" : "tlvl off"}>
						<span className="tmark">{r.on ? "✓" : "·"}</span>
						<span className={`mapsw ${r.key}`} />
						{text.stage[r.key]}
					</div>
				))
			) : (
				<div className="tlvl">
					<span className="tmark">–</span>
					<span className="mapsw none" />
					{text.stage.none}
				</div>
			)}
			<PolicyLine line={tip.policy} text={text} />
			{tip.product && (
				<div className="tprod">
					{tip.product.name}
					{tip.product.status ? fill(text.tipStatus, { status: tip.product.status }) : ""}
				</div>
			)}
		</>
	);
}
