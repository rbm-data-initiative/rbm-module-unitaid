import "server-only";

/**
 * The only place in the module that reads process.env.
 * Every variable is prefixed with EXAMPLE_MODULE_ and documented in .env.example.
 */
export interface ExampleModuleEnv {
	/** Published CSV URL of the external source; null = use the bundled sample */
	sourceUrl: string | null;
	/** Shared secret expected by POST /api/example-module/notifications */
	notificationsToken: string | null;
	/** Cache lifetime for the external fetch, in seconds */
	revalidateSeconds: number;
}

export function getExampleModuleEnv(): ExampleModuleEnv {
	const revalidate = Number(process.env.EXAMPLE_MODULE_REVALIDATE_SECONDS ?? 300);
	return {
		sourceUrl: process.env.EXAMPLE_MODULE_SOURCE_URL?.trim() || null,
		notificationsToken: process.env.EXAMPLE_MODULE_NOTIFICATIONS_TOKEN?.trim() || null,
		revalidateSeconds: Number.isFinite(revalidate) && revalidate > 0 ? revalidate : 300,
	};
}
