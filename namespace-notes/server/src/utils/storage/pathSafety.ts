// pathSafety.ts
//
// Helpers for safely building filesystem paths from user-supplied values.
// User input (namespace ids, document ids, file names) must never be able to
// escape the intended base directory via path separators or `..` traversal.
import path from "path";

/**
 * Validate a single user-supplied path segment (namespace id, document id,
 * file name). Rejects empty values, path separators, parent-directory
 * references and null bytes so that a segment can only ever name a direct
 * child of its parent directory.
 *
 * @throws Error if the segment is not a safe, single path component.
 */
export function sanitizeSegment(
  segment: string,
  label = "path segment"
): string {
  if (typeof segment !== "string" || segment.length === 0) {
    throw new Error(`Invalid ${label}: must be a non-empty string`);
  }
  if (
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0") ||
    segment === "." ||
    segment === ".."
  ) {
    throw new Error(`Invalid ${label}: illegal path characters`);
  }
  return segment;
}

/**
 * Safely join user-supplied segments beneath a trusted base directory.
 *
 * Each segment is validated with {@link sanitizeSegment}, and the fully
 * resolved path is confirmed to remain inside the base directory before being
 * returned. This is the authoritative guard against path traversal.
 *
 * @throws Error if any segment is invalid or the result escapes `baseDir`.
 */
export function safeJoin(baseDir: string, ...segments: string[]): string {
  const cleaned = segments.map((s) => sanitizeSegment(s));
  const base = path.resolve(baseDir);
  const target = path.resolve(base, ...cleaned);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error("Resolved path escapes the base directory");
  }
  return target;
}
