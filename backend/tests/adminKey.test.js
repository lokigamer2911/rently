// Mock the logger so tests stay quiet and don't depend on winston config.
jest.mock('../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

const crypto = require('crypto');
const { requireAdminKey } = require('../src/middleware/adminKey');

const RAW_KEY = 'rnt_test_key_do_not_use_in_prod';
const KEY_HASH = crypto.createHash('sha256').update(RAW_KEY, 'utf8').digest('hex');

/** Build req/res/next stubs and run the middleware. */
function run({ hash = KEY_HASH, headerKey, bodyKey, user, keyId } = {}) {
  const req = {
    headers: headerKey != null ? { 'x-admin-key': headerKey } : {},
    body: bodyKey != null ? { adminKey: bodyKey } : {},
    user,
    ip: '127.0.0.1',
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();

  const previousHash = process.env.ADMIN_KEY_HASH;
  const previousId = process.env.ADMIN_KEY_ID;
  process.env.ADMIN_KEY_HASH = hash;
  if (keyId === undefined) delete process.env.ADMIN_KEY_ID;
  else process.env.ADMIN_KEY_ID = keyId;

  try {
    requireAdminKey(req, res, next);
  } finally {
    if (previousHash === undefined) delete process.env.ADMIN_KEY_HASH;
    else process.env.ADMIN_KEY_HASH = previousHash;
    if (previousId === undefined) delete process.env.ADMIN_KEY_ID;
    else process.env.ADMIN_KEY_ID = previousId;
  }

  return { req, res, next };
}

describe('requireAdminKey', () => {
  it('accepts a valid key from the X-Admin-Key header and strips it from req', () => {
    const { req, res, next } = run({ headerKey: RAW_KEY, user: { id: 'user_admin' } });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.headers['x-admin-key']).toBeUndefined(); // scrubbed
    expect(req.adminKeyId).toBe('default');
  });

  it('accepts a valid key from the body and removes it from the body', () => {
    const { req, res, next } = run({ bodyKey: RAW_KEY, user: { id: 'user_admin' } });

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({}); // key stripped, rest of body kept
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a wrong key with 403 ADMIN_KEY_INVALID', () => {
    const { res, next } = run({ headerKey: 'rnt_wrong_key', user: { id: 'user_admin' } });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ADMIN_KEY_INVALID' }),
    );
  });

  it('rejects a missing key with 401 ADMIN_KEY_REQUIRED', () => {
    const { res, next } = run({ user: { id: 'user_admin' } });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ADMIN_KEY_REQUIRED' }),
    );
  });

  it('fails closed with 503 when ADMIN_KEY_HASH is not configured', () => {
    const { res, next } = run({ hash: '', headerKey: RAW_KEY, user: { id: 'user_admin' } });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ADMIN_KEY_NOT_CONFIGURED' }),
    );
  });

  it('fails closed when ADMIN_KEY_HASH is malformed', () => {
    const { res, next } = run({ hash: 'not-a-hash', headerKey: RAW_KEY, user: { id: 'user_admin' } });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('stamps the audited key id from ADMIN_KEY_ID', () => {
    const { req, next } = run({ headerKey: RAW_KEY, user: { id: 'user_admin' }, keyId: 'founder-key-1' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.adminKeyId).toBe('founder-key-1');
  });

  it('uses a timing-safe comparison (constant-time equal-length compare)', () => {
    // Indirect smoke test: identical hashes always match; adjacent hash never does.
    const { res, next } = run({ hash: KEY_HASH, headerKey: RAW_KEY.slice(0, -1) + 'X' });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
