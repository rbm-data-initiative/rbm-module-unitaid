import type { EChartsOption } from "echarts";
import type { SampleRow } from "@/app/[locale]/unitaid/types";

export interface LineChartLabels {
	title: string;
	yAxis: string;
}

// Colours follow the host design guidelines (docs/design-guidelines).
const SERIES_COLOURS = ["#2563EB", "#7DD865", "#94A3B8", "#F59E0B", "#8B5CF6"];

/** Pure function: groups rows by country and builds one line series per country. */
export function buildLineOption(rows: SampleRow[], labels: LineChartLabels): EChartsOption {
	const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
	const countries = Array.from(new Set(rows.map((r) => r.country))).sort();

	const series = countries.map((country, index) => ({
		name: country,
		type: "line" as const,
		smooth: true,
		symbolSize: 6,
		color: SERIES_COLOURS[index % SERIES_COLOURS.length],
		data: years.map((year) => {
			const row = rows.find((r) => r.country === country && r.year === year);
			return row ? row.value : null;
		}),
	}));

	return {
		title: { text: labels.title, left: 0, textStyle: { fontSize: 14, fontWeight: 500 } },
		tooltip: { trigger: "axis" },
		legend: { bottom: 0, type: "scroll" },
		grid: { left: 48, right: 16, top: 48, bottom: 48, containLabel: true },
		xAxis: { type: "category", data: years.map(String), boundaryGap: false },
		yAxis: { type: "value", name: labels.yAxis, nameTextStyle: { align: "left" } },
		series,
	};
}
