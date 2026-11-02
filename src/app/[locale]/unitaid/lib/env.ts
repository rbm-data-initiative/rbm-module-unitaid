import "server-only";

/**
 * The only place in the module that reads process.env.
 * Every variable is prefixed with UNITAID_ and documented in .env.example.
 */
export interface UnitaidEnv {
	/** Published CSV URL of the external source; null = use the bundled sample */
	sourceUrl: string | null;
	/** Shared secret expected by POST /api/unitaid/notifications */
	notificationsToken: string | null;
	/** Cache lifetime for the external fetch, in seconds */
	revalidateSeconds: number;
}

export function getUnitaidEnv(): UnitaidEnv {
	const revalidate = Number(process.env.UNITAID_REVALIDATE_SECONDS ?? 300);
	return {
		sourceUrl: process.env.UNITAID_SOURCE_URL?.trim() || null,
		notificationsToken: process.env.UNITAID_NOTIFICATIONS_TOKEN?.trim() || null,
		revalidateSeconds: Number.isFinite(revalidate) && revalidate > 0 ? revalidate : 300,
	};
}
