/** One row of the sample dataset served by GET /api/unitaid/data?dataset=sample */
export interface SampleRow {
	year: number;
	country: string;
	value: number;
}

export type DatasetName = "sample";

/** Envelope returned by every dataset route */
export interface DatasetResponse<T> {
	ok: true;
	dataset: DatasetName;
	/** "remote" when fetched from UNITAID_SOURCE_URL, "fallback" when read from public/unitaid */
	source: "remote" | "fallback";
	fetchedAt: string;
	rows: T[];
}

export interface ApiError {
	ok: false;
	message: string;
}

/** Body accepted by POST /api/unitaid/notifications */
export interface NotificationPayload {
	/** Unique id provided by the sender; used for idempotency */
	eventId: string;
	type: string;
	/** ISO 8601 */
	occurredAt: string;
	data?: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0;

/** Manual type guard (the host has no schema library such as zod). */
export function isNotificationPayload(value: unknown): value is NotificationPayload {
	if (!isRecord(value)) return false;
	if (!isNonEmptyString(value.eventId) || value.eventId.length > 200) return false;
	if (!isNonEmptyString(value.type) || value.type.length > 100) return false;
	if (!isNonEmptyString(value.occurredAt) || Number.isNaN(Date.parse(value.occurredAt))) {
		return false;
	}
	if (value.data !== undefined && !isRecord(value.data)) return false;
	return true;
}
