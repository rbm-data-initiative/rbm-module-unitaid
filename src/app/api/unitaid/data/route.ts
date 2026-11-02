import { NextResponse, type NextRequest } from "next/server";
import { isDatasetName, loadDataset } from "@/app/[locale]/unitaid/lib/datasets";

export const runtime = "nodejs";

/**
 * GET /api/unitaid/data?dataset=<name>
 * Proxies the external source with server-side cache and returns typed JSON.
 */
export async function GET(req: NextRequest) {
	const dataset = req.nextUrl.searchParams.get("dataset") ?? "";

	if (!isDatasetName(dataset)) {
		return NextResponse.json({ ok: false, message: "Unknown dataset" }, { status: 400 });
	}

	try {
		const payload = await loadDataset(dataset);
		return NextResponse.json(payload, {
			headers: { "Cache-Control": "public, max-age=60" },
		});
	} catch (err) {
		console.error(`[unitaid/data] failed to load "${dataset}"`, err);
		return NextResponse.json({ ok: false, message: "Upstream unavailable" }, { status: 502 });
	}
}
