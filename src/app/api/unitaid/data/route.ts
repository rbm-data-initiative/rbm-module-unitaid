// GET /api/unitaid/data?dataset=<name>: the data route of RBM's module spec
// (section 2a). The dataset in one language, as JSON, read on the server so a
// visitor's browser never contacts the data host.
//
// A thin wrapper over loadDashboard() (lib/data.ts): the same fetch, the same
// checks, and the same 5-minute server-side cache, which the page shares. The
// page does not call this route; it calls getDashboard() itself (no extra
// network hop, and `next build` has no server running to call).
//
//   200  what getDashboard() returns: the shape the components take. Served
//        from the copy bundled with the module when the data host could not be
//        read and nothing was cached: then with "X-Unitaid-Source: fallback"
//   400  `dataset` missing, or not one of the dashboard's languages
//   502  the source could not be read, or is in a format this code does not
//        read (DatasetError, kind "unavailable" or "schema")
import { loadDashboard } from "@/app/[locale]/unitaid/lib/data";
import { DatasetError } from "@/app/[locale]/unitaid/lib/dataset";
import { isLocale, LOCALES } from "@/app/[locale]/unitaid/utils/locales";

export async function GET(request: Request): Promise<Response> {
	const name = new URL(request.url).searchParams.get("dataset");
	if (name === null || !isLocale(name)) {
		return Response.json(
			{ error: name === null ? "dataset is required" : "unknown dataset", datasets: LOCALES },
			{ status: 400 },
		);
	}
	try {
		const { dataset, source } = await loadDashboard(name);
		return Response.json(
			dataset,
			source === "fallback" ? { headers: { "X-Unitaid-Source": "fallback" } } : undefined,
		);
	} catch (e) {
		if (e instanceof DatasetError) {
			// The reason, with the source's address, goes to the server log only.
			console.error(`[LAUNCH] data route: ${e.kind}: ${e.message}`);
			return Response.json({ error: "source unavailable", kind: e.kind }, { status: 502 });
		}
		throw e;
	}
}
