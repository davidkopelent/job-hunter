import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Single-user password protection. The session cookie holds an HMAC keyed by APP_PASSWORD,
// so it stays valid until the password changes; changing it logs every browser out.
export const SESSION_COOKIE = "session";

export function sessionToken(): string {
  return createHmac("sha256", process.env.APP_PASSWORD!).update("job-hunter session").digest("hex");
}

export function isValidSession(token: string | undefined): boolean {
  return token !== undefined && safeEqual(token, sessionToken());
}

export function safeEqual(a: string, b: string): boolean {
  const [bufferA, bufferB] = [Buffer.from(a), Buffer.from(b)];
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

// Server Actions are public endpoints: each checks the session itself, not only the proxy.
export async function requireSession(): Promise<void> {
  if (!isValidSession((await cookies()).get(SESSION_COOKIE)?.value)) {
    throw new Error("Unauthorized");
  }
}
