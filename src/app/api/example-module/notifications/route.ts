import { NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { extractToken } from "@/utils/common-functions";
import { timingSafeEqual } from "@/utils/server/crypto";
import { CACHE_TAGS } from "@/app/[locale]/example-module/lib/cache";
import { getExampleModuleEnv } from "@/app/[locale]/example-module/lib/env";
import { isNotificationPayload } from "@/app/[locale]/example-module/types";
import { getNotificationStore } from "../_lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000_000;

/**
 * POST /api/example-module/notifications
 * Receives notifications from an external system. Same model as the host's
 * src/app/api/news/cron/route.ts: constant-time token check, fast response.
 */
export async function POST(req: NextRequest) {
	// 1) Authorization
	const expected = getExampleModuleEnv().notificationsToken;
	if (!expected) {
		return NextResponse.json(
			{ ok: false, message: "Notifications endpoint not configured" },
			{ status: 503 },
		);
	}
	const provided = extractToken(req);
	if (!timingSafeEqual(provided, expected)) {
		return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
	}

	// 2) Body: size-limited JSON with a validated shape
	const length = Number(req.headers.get("content-length") ?? 0);
	if (length > MAX_BODY_BYTES) {
		return NextResponse.json({ ok: false, message: "Payload too large" }, { status: 413 });
	}
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
	}
	if (!isNotificationPayload(body)) {
		return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
	}

	// 3) Idempotency
	const store = getNotificationStore();
	if (await store.has(body.eventId)) {
		return NextResponse.json({ ok: true, duplicate: true, eventId: body.eventId }, { status: 200 });
	}
	const stored = await store.save(body);
	console.info("[example-module/notifications] received", {
		eventId: stored.eventId,
		type: stored.type,
	});

	// 4) Side effects: refresh the cached dataset
	revalidateTag(CACHE_TAGS.sample);

	return NextResponse.json({ ok: true, id: stored.id, eventId: stored.eventId }, { status: 202 });
}
