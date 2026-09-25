const crypto = require('crypto');

/**
 * E-signature evidence for handover confirmations.
 *
 * Every stored signature is wrapped in an "evidence envelope":
 *   { renter: { signature, signedAt, ip, userAgent, prevHash }, host: {...}, hash, version }
 *
 * - `signedAt`  — server-side UTC timestamp taken when the handover endpoint ran.
 * - `ip`        — best-effort client IP (x-forwarded-for aware; Render/Vercel sit
 *                 behind proxies so the socket address alone is not usable).
 * - `userAgent` — device/browser string, truncated to a safe length.
 * - `hash`      — SHA-256 over the canonical envelope contents (signatures included).
 *                 It is NOT an HMAC and cannot by itself stop a DB-level rewrite,
 *                 but it makes any later tampering with the stored JSON detectable:
 *                 recompute and compare whenever evidence is displayed or exported.
 * - `prevHash`  — hash of the pickup envelope, carried into the return envelope so
 *                 the two handovers form a tiny chain (editing pickup invalidates return).
 */

const MAX_SIGNATURE_CHARS = 200 * 1024; // ~200 KB per PNG data URL is plenty
const MAX_USER_AGENT_CHARS = 200;
const EVIDENCE_VERSION = 1;

/** Extract the client IP, preferring the left-most forwarded hop. */
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  const real = req.headers && req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim().slice(0, 64);
  return (req.socket && req.socket.remoteAddress) || null;
}

/** Pull the device/browser user agent, normalized and truncated. */
function getUserAgent(req) {
  const ua = req && req.headers && req.headers['user-agent'];
  return typeof ua === 'string' && ua.trim() ? ua.trim().slice(0, MAX_USER_AGENT_CHARS) : null;
}

/**
 * Validate one signature data URL.
 * Accepts PNG/JPEG data URLs only (what SignaturePad produces), enforces a size cap,
 * and rejects any non-image payload (e.g. `data:text/html` XSS vectors or bare URLs).
 * Returns { ok: true, value } or { ok: false, reason }.
 */
function validateSignatureDataUrl(raw) {
  if (typeof raw !== 'string' || !raw) return { ok: false, reason: 'empty' };
  if (raw.length > MAX_SIGNATURE_CHARS) return { ok: false, reason: 'too_large' };

  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) return { ok: false, reason: 'not_a_png_or_jpeg_data_url' };

  // Cheap base64 sanity check: decode must succeed and round-trip.
  try {
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length === 0) return { ok: false, reason: 'empty_payload' };
    if (buf.toString('base64').slice(0, 16) !== match[2].slice(0, 16)) {
      return { ok: false, reason: 'corrupt_base64' };
    }
    // PNG starts with 0x89 'PNG'; JPEG starts with 0xFF 0xD8.
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    if (!isPng && !isJpeg) return { ok: false, reason: 'not_an_image' };
  } catch {
    return { ok: false, reason: 'undecodable' };
  }

  return { ok: true, value: raw };
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Build the evidence envelope for one handover.
 * @param {object} args
 * @param {object} args.req           Express request (for IP + UA)
 * @param {object} args.signatures    { renter?: string, host?: string } raw data URLs
 * @param {string[]} [args.photos]    condition photo URLs captured in the same request
 * @param {string}  [args.prevHash]   hash of the previous (pickup) envelope for chaining
 * @returns {{ envelope: object, accepted: string[], rejected: string[] }}
 */
function buildSignatureEvidence({ req, signatures, photos, prevHash }) {
  const accepted = [];
  const rejected = [];
  const parties = {};

  const input = signatures && typeof signatures === 'object' ? signatures : {};
  for (const role of ['renter', 'host']) {
    if (!input[role]) continue;
    const check = validateSignatureDataUrl(input[role]);
    if (!check.ok) {
      rejected.push(`${role}: ${check.reason}`);
      continue;
    }
    parties[role] = {
      signature: check.value,
      signedAt: new Date().toISOString(),
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    };
    accepted.push(role);
  }

  if (accepted.length === 0) {
    return { envelope: null, accepted, rejected };
  }

  const canonical = JSON.stringify({
    version: EVIDENCE_VERSION,
    parties,
    photos: Array.isArray(photos) ? photos.slice(0, 12) : [],
    prevHash: prevHash || null,
  });

  return {
    envelope: {
      version: EVIDENCE_VERSION,
      parties,
      photos: Array.isArray(photos) ? photos.slice(0, 12) : [],
      prevHash: prevHash || null,
      hash: sha256(canonical),
    },
    accepted,
    rejected,
  };
}

/** Parse a stored envelope, or fall back to legacy bare { renter, host } blobs. */
function parseSignatureEvidence(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && parsed.parties && parsed.hash) return parsed;
    if (parsed && (parsed.renter || parsed.host)) {
      // Legacy format captured before the audit trail existed.
      return { version: 0, parties: parsed, hash: null, prevHash: null, photos: [] };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recompute the hash of an envelope and compare it to the stored one.
 * Returns true when the stored JSON still matches what was signed.
 * Legacy envelopes (version 0, no hash) always report true — nothing to check.
 */
function verifySignatureEvidence(envelope) {
  if (!envelope) return true;
  if (!envelope.hash) return true;
  const { hash, ...rest } = envelope;
  return sha256(JSON.stringify(rest)) === hash;
}

module.exports = {
  buildSignatureEvidence,
  parseSignatureEvidence,
  verifySignatureEvidence,
  validateSignatureDataUrl,
  getClientIp,
  getUserAgent,
  MAX_SIGNATURE_CHARS,
};
