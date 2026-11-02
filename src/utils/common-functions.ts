import type { NextRequest } from "next/server";

/**
 * Copied verbatim from the host project (src/utils/common-functions.ts).
 * Reads a bearer token from the Authorization header, or the x-cron-token
 * header as a fallback.
 */
export function extractToken(req: NextRequest): string | null {
	const auth = req.headers.get("authorization") || req.headers.get("Authorization");
	if (auth) {
		const parts = auth.split(" ");
		if (parts.length === 2) return parts[1].trim();
		return auth.trim();
	}

	const x = req.headers.get("x-cron-token");
	return x ? x.trim() : null;
}
