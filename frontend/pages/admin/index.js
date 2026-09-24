import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiCheck, FiExternalLink, FiX } from 'react-icons/fi';
import { api, fetcher } from '../../lib/api';
import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

const EMPTY_PAYMENTS = [];

export default function Admin() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [busyPaymentId, setBusyPaymentId] = useState(null);
  const { data: stats } = useSWR('/admin/stats', fetcher);
  const { data: users, mutate: mutateUsers } = useSWR('/admin/users', fetcher);
  const { data: disputes, mutate: mutateDisputes } = useSWR('/disputes', fetcher);
  // Only admins hit this endpoint — everyone else would just collect a 403.
  const { data: paymentsData, mutate: mutatePayments } = useSWR(
    user?.role === 'ADMIN' ? '/admin/payments?status=ALL' : null,
    fetcher,
  );
  const payments = paymentsData || EMPTY_PAYMENTS;

  // The "UPI payment awaiting verification" notification links straight here.
  useEffect(() => {
    if (router.isReady && router.query.tab === 'payments') setTab('payments');
  }, [router.isReady, router.query.tab]);

  const setRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    toast.success('Role updated'); mutateUsers();
  };

  const verifyPayment = async (payment) => {
    // Irreversible: this confirms the booking and locks the listing.
    const confirmed = window.confirm(
      `Confirm you have received Rs ${(payment.amount / 100).toFixed(2)} from `
      + `${payment.renterName || 'this renter'}?\n\n`
      + `Reference: ${payment.ref || '—'}\n`
      + `UTR: ${payment.utr || '—'}\n\n`
      + 'Check your bank statement or UPI app for a matching credit before continuing. '
      + 'This will confirm the booking.',
    );
    if (!confirmed) return;

    setBusyPaymentId(payment.id);
    try {
      await api.post(`/admin/payments/${payment.id}/verify`);
      toast.success('Payment verified — booking confirmed');
      mutatePayments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not verify the payment');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const rejectPayment = async (payment) => {
    const reason = window.prompt('Why was this payment not matched? The renter will see this.', 'No matching credit in the bank account');
    if (reason === null) return;

    setBusyPaymentId(payment.id);
    try {
      await api.post(`/admin/payments/${payment.id}/reject`, { reason });
      toast.success('Payment marked as not received');
      mutatePayments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update the payment');
    } finally {
      setBusyPaymentId(null);
    }
  };

  const resolveDispute = async (id, action) => {
    try {
      await api.post(`/disputes/${id}/resolve`, { resolutionAction: action });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
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
        <Button variant={tab === 'payments' ? 'primary' : 'ghost'} onClick={() => setTab('payments')}>
          Payments
          {payments.filter(p => p.status === 'AWAITING_VERIFICATION').length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {payments.filter(p => p.status === 'AWAITING_VERIFICATION').length}
            </span>
          )}
        </Button>
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

      {tab === 'payments' && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">UPI payments</h2>
              <p className="text-xs text-slate-500 mt-1">
                A UPI QR gives no automatic confirmation. Open your bank statement or UPI app, find the credit
                matching the reference / UTR below, then verify it. Verifying confirms the booking.
              </p>
            </div>
            <Button variant="ghost" className="!py-2 !px-4 !text-xs" onClick={() => mutatePayments()}>Refresh</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Renter</th>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Reference / UTR</th>
                  <th className="pb-2">Submitted</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="7" className="py-6 text-center text-slate-500">No UPI payments yet.</td></tr>
                ) : payments.map((payment) => (
                  <tr key={payment.id} className="border-t align-top">
                    <td className="py-3">
                      <p className="font-semibold text-slate-800">{payment.renterName || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{payment.renterPhone || payment.renterEmail || ''}</p>
                    </td>
                    <td className="py-3 max-w-[200px]">
                      <p className="truncate" title={payment.listingTitle || ''}>{payment.listingTitle || '—'}</p>
                      <p className="text-[11px] text-slate-400">{payment.listingCity || ''}</p>
                    </td>
                    <td className="py-3 font-semibold whitespace-nowrap">Rs {(payment.amount / 100).toFixed(2)}</td>
                    <td className="py-3">
                      <p className="font-mono text-xs">{payment.ref || '—'}</p>
                      <p className="text-[11px] text-slate-500">{payment.utr || 'no UTR submitted'}</p>
                      {payment.note && (
                        <p className="text-[11px] text-slate-400 italic max-w-[200px] truncate" title={payment.note}>{payment.note}</p>
                      )}
                      {payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brand-600 inline-flex items-center gap-1 mt-1"
                        >
                          <FiExternalLink size={11} /> Screenshot
                        </a>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">to {payment.payeeVpa || '—'}</p>
                    </td>
                    <td className="py-3 text-xs text-slate-500 whitespace-nowrap">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                        payment.status === 'PAID' ? 'bg-emerald-100 text-emerald-700'
                          : payment.status === 'AWAITING_VERIFICATION' ? 'bg-amber-100 text-amber-700'
                            : payment.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                      }`}>
                        {payment.status}
                      </span>
                      {payment.status === 'PAID' && payment.verifiedAt && (
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(payment.verifiedAt).toLocaleDateString()}</p>
                      )}
                      {payment.rejectionReason && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[140px]">{payment.rejectionReason}</p>
                      )}
                    </td>
                    <td className="py-3">
                      {payment.status === 'PAID' ? (
                        <span className="text-[11px] text-slate-400">Settled</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="primary"
                            className="!py-1.5 !px-3 !text-xs flex items-center gap-1.5 whitespace-nowrap"
                            disabled={busyPaymentId === payment.id}
                            onClick={() => verifyPayment(payment)}
                          >
                            <FiCheck size={13} /> Money received
                          </Button>
                          <Button
                            variant="ghost"
                            className="!py-1.5 !px-3 !text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 whitespace-nowrap"
                            disabled={busyPaymentId === payment.id}
                            onClick={() => rejectPayment(payment)}
                          >
                            <FiX size={13} /> Not received
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex gap-3">
            <FiAlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Only hit &ldquo;Money received&rdquo; once you can see the credit. Bookings stay PENDING until then, and
              the listing is only marked unavailable on verification.
            </p>
          </div>
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
