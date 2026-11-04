/** Body accepted by POST /api/unitaid/notifications, as RBM's notification store keeps it */
export interface NotificationPayload {
	/** Unique id provided by the sender; used for idempotency */
	eventId: string;
	type: string;
	/** ISO 8601 */
	occurredAt: string;
	data?: Record<string, unknown>;
}
