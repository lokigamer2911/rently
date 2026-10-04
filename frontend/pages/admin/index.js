import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { FiLock } from 'react-icons/fi';
import { api } from '../../lib/api';
import { adminFetcher, adminKeyHeaders, getStoredAdminKey, clearStoredAdminKey } from '../../lib/adminKey';
import Button from '../../components/Button';
import AdminKeyGate from '../../components/AdminKeyGate';
import { useAuth } from '../../hooks/useAuth';

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('users');
  // Second lock: the admin access key. Session-scoped, validated on mount.
  const [unlocked, setUnlocked] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredAdminKey();
      if (!stored) {
        setCheckingKey(false);
        return;
      }
      try {
        await api.get('/admin/key-check', { headers: { 'X-Admin-Key': stored } });
        if (!cancelled) setUnlocked(true);
      } catch {
        // Stale/invalid key — drop it so the user sees the unlock form again.
        clearStoredAdminKey();
      } finally {
        if (!cancelled) setCheckingKey(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  // Admin data is fetched only after the key gate unlocks — failed pre-unlock
  // calls would count against the 5-per-15-minutes admin-key rate limit.
  const { data: stats } = useSWR(
    unlocked ? '/admin/stats' : null,
    adminFetcher,
  );
  const { data: users, mutate: mutateUsers } = useSWR(
    unlocked ? '/admin/users' : null,
    adminFetcher,
  );
  const { data: disputes, mutate: mutateDisputes } = useSWR(
    unlocked ? '/disputes' : null,
    adminFetcher,
  );

  // Dispute notifications link straight here via ?tab=disputes.
  useEffect(() => {
    if (router.isReady && router.query.tab === 'disputes') {
      setTab('disputes');
    }
  }, [router.isReady, router.query.tab]);

  const setRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role }, adminKeyHeaders());
    toast.success('Role updated'); mutateUsers();
  };

  const resolveDispute = async (id, action) => {
    try {
      await api.post(`/disputes/${id}/resolve`, { resolutionAction: action }, adminKeyHeaders());
      toast.success('Dispute resolved');
      mutateDisputes();
    } catch(err) {
      toast.error('Failed to resolve dispute');
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading...</div>;
  if (!user || user.role !== 'ADMIN') {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  if (checkingKey) return <div className="py-20 text-center animate-pulse">Checking admin access…</div>;
  if (!unlocked) return <AdminKeyGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button
          onClick={() => { clearStoredAdminKey(); setUnlocked(false); }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
          title="Forget the admin key in this tab"
        >
          <FiLock size={12} /> Lock admin area
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && Object.entries(stats).map(([k,v]) => (
          <div key={k} className="card">
            <p className="text-sm text-slate-500 capitalize">{k}</p>
            <p className="text-2xl font-bold">{k==='revenue' ? `₹${(v/100).toFixed(0)}` : v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Button variant={tab === 'users' ? 'primary' : 'ghost'} onClick={() => setTab('users')}>Users</Button>
        <Button variant={tab === 'disputes' ? 'primary' : 'ghost'} onClick={() => setTab('disputes')}>Disputes</Button>
      </div>

      {tab === 'users' && (
        <div className="card">
          <h2 className="font-bold mb-3">Users</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button onClick={()=>setRole(u.id, u.role==='ADMIN'?'USER':'ADMIN')} className="text-brand-600">
                    Make {u.role==='ADMIN'?'user':'admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {tab === 'disputes' && (
        <div className="card">
          <h2 className="font-bold mb-3">Reported Issues</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="pb-2">Booking ID</th>
                <th className="pb-2">Reporter</th>
                <th className="pb-2">Reason</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes?.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-slate-500">No active disputes.</td></tr>
              ) : (
                disputes?.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="py-3 font-mono text-xs">{d.bookingId}</td>
                    <td className="py-3">{d.user?.name || 'Unknown'}</td>
                    <td className="py-3 max-w-xs truncate" title={d.reason}>{d.reason}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${d.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 flex flex-col gap-2">
                      <div className="flex gap-2">
                        {d.status === 'OPEN' && (
                          <>
                            <Button variant="primary" className="!py-1 !px-3 !text-xs bg-red-600 hover:bg-red-700 !border-red-600 text-white" onClick={() => resolveDispute(d.id, 'CANCELLED')}>Cancel Booking</Button>
                            <Button variant="secondary" className="!py-1 !px-3 !text-xs" onClick={() => resolveDispute(d.id, 'COMPLETED')}>Mark Completed</Button>
                          </>
                        )}
                      </div>
                      
                      {/* Condition Photos Evidence for Admin */}
                      {(d.booking?.pickupPhotos !== '[]' || d.booking?.returnPhotos !== '[]') && (
                        <div className="mt-2 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Visual Evidence</p>
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(d.booking?.pickupPhotos || '[]').map((url, i) => (
                              <a key={`p-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded border border-slate-200 overflow-hidden hover:scale-110 transition-transform">
                                <img src={url} alt="Pickup" className="w-full h-full object-cover" />
                              </a>
                            ))}
                            {JSON.parse(d.booking?.returnPhotos || '[]').map((url, i) => (
                              <a key={`r-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded border border-emerald-200 overflow-hidden hover:scale-110 transition-transform ring-1 ring-emerald-100">
                                <img src={url} alt="Return" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
