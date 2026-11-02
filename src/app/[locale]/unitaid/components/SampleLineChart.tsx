"use client";

import ReactECharts from "echarts-for-react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { SampleRow } from "@/app/[locale]/unitaid/types";
import { buildLineOption } from "@/app/[locale]/unitaid/utils/chart-options";

interface SampleLineChartProps {
	rows: SampleRow[];
	height?: number;
}

/**
 * ECharts line chart with a ResizeObserver, following the host's chart
 * components (ReactECharts + resize on container change).
 */
export default function SampleLineChart({ rows, height = 360 }: SampleLineChartProps) {
	const t = useTranslations("Unitaid.chart");
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<ReactECharts>(null);

	useEffect(() => {
		const element = containerRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() => {
			chartRef.current?.getEchartsInstance().resize();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	const option = buildLineOption(rows, { title: t("title"), yAxis: t("yAxis") });

	return (
		<div ref={containerRef} className="w-full">
			<ReactECharts ref={chartRef} option={option} style={{ height, width: "100%" }} notMerge />
		</div>
	);
}
