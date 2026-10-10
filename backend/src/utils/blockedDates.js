const { z } = require('zod');

/**
 * Blocked-date entries (stored as a JSON array in Listing.blockedDates — no migration).
 * Two shapes, both accepted everywhere:
 * - "YYYY-MM-DD" (legacy): the whole day is blocked → [day 00:00Z, next day 00:00Z)
 * - { start: ISO, end: ISO }: exact datetime range blocked, half-open [start, end)
 *   (same overlap semantics as booking-vs-booking checks).
 */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const BlockedEntrySchema = z.union([
  z.string().refine((s) => {
    if (DATE_ONLY_RE.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    }
    const t = new Date(s).getTime();
    return !Number.isNaN(t);
  }, { message: 'Blocked entry must be YYYY-MM-DD or an ISO datetime' }),
  z.object({
    start: z.string().refine((s) => !Number.isNaN(new Date(s).getTime()), { message: 'Invalid range start' }),
    end: z.string().refine((s) => !Number.isNaN(new Date(s).getTime()), { message: 'Invalid range end' }),
  }).refine((r) => new Date(r.end) > new Date(r.start), { message: 'Range end must be after start' }),
]);

/** Parse one stored entry into a { start, end } Date range, or null if invalid. */
function parseBlockedEntry(entry) {
  try {
    if (typeof entry === 'string') {
      if (DATE_ONLY_RE.test(entry)) {
        const [y, m, d] = entry.split('-').map(Number);
        const start = new Date(Date.UTC(y, m - 1, d));
        if (start.getUTCFullYear() !== y || start.getUTCMonth() !== m - 1 || start.getUTCDate() !== d) return null;
        return { start, end: new Date(start.getTime() + 86400000) };
      }
      const t = new Date(entry).getTime();
      if (Number.isNaN(t)) return null;
      // Bare datetime string without a range = that whole UTC day
      const day = new Date(entry);
      const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
      return { start, end: new Date(start.getTime() + 86400000) };
    }
    if (entry && typeof entry === 'object') {
      const start = new Date(entry.start);
      const end = new Date(entry.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
      return { start, end };
    }
    return null;
  } catch {
    return null;
  }
}

/** True when [start, end) overlaps any blocked entry (invalid entries ignored). */
function overlapsBlocked(entries, start, end) {
  if (!Array.isArray(entries)) return false;
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  return entries.some((entry) => {
    const range = parseBlockedEntry(entry);
    if (!range) return false;
    return range.start < e && range.end > s;
  });
}

module.exports = { BlockedEntrySchema, parseBlockedEntry, overlapsBlocked };
