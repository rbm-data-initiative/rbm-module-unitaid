import "server-only";
import {
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual as nodeTimingSafeEqual,
} from "node:crypto";

export function sha256(text: string) {
	return createHash("sha256").update(text, "utf8").digest("hex");
}

export function hmacSha256(key: string, msg: string) {
	return createHmac("sha256", key).update(msg, "utf8").digest("hex");
}

export function randomHex(bytes = 16) {
	return randomBytes(bytes).toString("hex");
}

/**
 * timingSafeEqual that does not leak timing and handles buffers of different lengths.
 */
export function timingSafeEqual(a?: string | null, b?: string | null): boolean {
	if (!a || !b) return false;

	const aBuf = Buffer.from(a, "utf8");
	const bBuf = Buffer.from(b, "utf8");

	if (aBuf.length !== bBuf.length) {
		// Normalise the comparison cost to avoid an early return visible in timing
		const ah = createHash("sha256").update(aBuf).digest();
		const bh = createHash("sha256").update(bBuf).digest();
		nodeTimingSafeEqual(ah, bh);
		return false;
	}

	return nodeTimingSafeEqual(aBuf, bBuf);
}
