import { randomUUID } from "node:crypto";
import type { NotificationPayload } from "@/app/[locale]/unitaid/types";

export interface StoredNotification extends NotificationPayload {
	id: string;
	receivedAt: string;
}

/**
 * Persistence boundary for notifications. The route only talks to this
 * interface, so the host maintainers can swap the implementation (S3,
 * database) without touching the route.
 */
export interface NotificationStore {
	has(eventId: string): Promise<boolean>;
	save(payload: NotificationPayload): Promise<StoredNotification>;
	list(limit?: number): Promise<StoredNotification[]>;
}

const MAX_ENTRIES = 500;

/** In-memory implementation: NOT durable (lost on restart, not shared between instances). */
class MemoryNotificationStore implements NotificationStore {
	private entries: StoredNotification[] = [];

	async has(eventId: string) {
		return this.entries.some((entry) => entry.eventId === eventId);
	}

	async save(payload: NotificationPayload) {
		const stored: StoredNotification = {
			...payload,
			id: randomUUID(),
			receivedAt: new Date().toISOString(),
		};
		this.entries.unshift(stored);
		if (this.entries.length > MAX_ENTRIES) this.entries.length = MAX_ENTRIES;
		return stored;
	}

	async list(limit = 50) {
		return this.entries.slice(0, limit);
	}
}

// Kept on globalThis so the store survives hot reloads in development.
const globalStore = globalThis as unknown as {
	__unitaidNotificationStore?: NotificationStore;
};

export function getNotificationStore(): NotificationStore {
	if (!globalStore.__unitaidNotificationStore) {
		globalStore.__unitaidNotificationStore = new MemoryNotificationStore();
	}
	return globalStore.__unitaidNotificationStore;
}
