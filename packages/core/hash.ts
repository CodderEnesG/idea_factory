import { createHash } from "node:crypto";

export const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

/** Kısa deterministik id (signal.id, content_hash için). */
export const shortHash = (s: string): string => sha256(s).slice(0, 16);
