import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiLock } from 'react-icons/fi';
import { api } from '../lib/api';
import Button from './Button';
import { setStoredAdminKey, clearStoredAdminKey } from '../lib/adminKeyStorage';

/**
 * Second lock for the admin area: after the normal login, the user must also
 * enter the platform's admin access key. The key is validated against
 * GET /api/admin/key-check and kept in sessionStorage for this tab only.
 *
 * All /api/admin routes reject requests without the key (ADMIN_KEY_REQUIRED),
 * so this gate is enforced server-side; the component is just the friendly
 * front door. Five wrong attempts per 15 minutes per IP are rate limited.
 */
export default function AdminKeyGate({ onUnlock }) {
  const [key, setKey] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const unlock = async (event) => {
    event.preventDefault();
    if (!key.trim()) {
      toast.error('Enter the admin access key');
      return;
    }

    setUnlocking(true);
    try {
      // Key-check is also where an invalid key gets counted by the rate limiter.
      await api.get('/admin/key-check', { headers: { 'X-Admin-Key': key } });
      setStoredAdminKey(key);
      setKey('');
      toast.success('Admin area unlocked for this tab');
      onUnlock?.();
    } catch (error) {
      clearStoredAdminKey();
      const data = error?.response?.data;
      const message = data?.code === 'ADMIN_KEY_RATE_LIMITED'
        ? 'Too many wrong attempts. Wait 15 minutes and try again.'
        : data?.error || 'Invalid admin key';
      toast.error(message);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <FiLock size={18} />
          </span>
          <div>
            <h1 className="text-lg font-bold">Admin access key</h1>
            <p className="text-xs text-slate-500">
              You are signed in as an admin. This area also needs the platform
              secret key — it is not your password.
            </p>
          </div>
        </div>

        <form onSubmit={unlock} className="space-y-3">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="rnt_…"
            autoComplete="off"
            autoFocus
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button type="submit" variant="primary" className="w-full" disabled={unlocking}>
            {unlocking ? 'Checking…' : 'Unlock admin area'}
          </Button>
        </form>

        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
          The key stays in this browser tab only (sessionStorage) and is never
          sent anywhere except to the Rently backend. Wrong attempts are limited
          to 5 per 15 minutes. Lost the key? It can only be rotated by changing
          ADMIN_KEY_HASH in the server environment.
        </p>
      </div>
    </div>
  );
}
