import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiRefreshCw,
  FiSmartphone,
  FiX,
} from 'react-icons/fi';
import Button from './Button';
import { api } from '../lib/api';

const POLL_INTERVAL_MS = 8000;

/** Copy with a clipboard fallback for older/insecure contexts. */
async function copyText(text, label) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy — please copy it manually');
  }
}

/**
 * Collects rent on a static UPI QR while the Razorpay integration is pending.
 *
 * A UPI QR gives no callback, so this cannot confirm anything by itself: the
 * renter submits their UTR, we park the booking in AWAITING_VERIFICATION, and
 * an admin matches the credit against the bank account. The status poll below
 * is what flips this screen to "confirmed" once that happens.
 */
export default function UpiPaymentModal({ isOpen, onClose, intent, onVerified }) {
  const [stage, setStage] = useState('pay'); // pay | claim | waiting | paid
  const [status, setStatus] = useState(intent?.status || 'CREATED');
  const [rejection, setRejection] = useState(null);
  const [utr, setUtr] = useState('');
  const [note, setNote] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notifiedRef = useRef(false);

  const paymentId = intent?.paymentId || null;

  // Reset per payment, so a UTR from a previous booking never leaks into this one.
  useEffect(() => {
    if (!isOpen) return;
    setUtr('');
    setNote('');
    setProofUrl('');
    setRefreshing(false);
    notifiedRef.current = false;
    setStage(
      intent?.status === 'PAID' ? 'paid'
        : intent?.status === 'AWAITING_VERIFICATION' ? 'waiting'
          : 'pay',
    );
    setStatus(intent?.status || 'CREATED');
    setRejection(null);
  }, [isOpen, intent?.paymentId, intent?.status]);

  const checkStatus = useCallback(async ({ silent = false } = {}) => {
    if (!paymentId) return null;
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get(`/payments/upi/${paymentId}`);
      setStatus(data.status);
      setRejection(data.rejectionReason || null);
      // Reopening an in-review payment: show the UTR that was already submitted.
      if (data.utr) setUtr(data.utr);
      if (data.status === 'PAID') setStage('paid');
      return data;
    } catch {
      // Transient failures are fine — the next poll will pick it up.
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [paymentId]);

  // Hydrate the submitted UTR when reopening a payment that is under review.
  useEffect(() => {
    if (!isOpen || !paymentId) return;
    if (intent?.status === 'AWAITING_VERIFICATION') checkStatus({ silent: true });
  }, [isOpen, paymentId, intent?.status, checkStatus]);

  // Poll while a verification is pending so the renter sees confirmation live.
  useEffect(() => {
    if (!isOpen || !paymentId) return undefined;
    if (status === 'PAID' || status === 'REJECTED') return undefined;

    const timer = setInterval(() => { checkStatus({ silent: true }); }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isOpen, paymentId, status, checkStatus]);

  // Let the parent clear its cart / navigate once the money is confirmed.
  useEffect(() => {
    if (stage === 'paid' && !notifiedRef.current) {
      notifiedRef.current = true;
      onVerified?.(intent);
    }
  }, [stage, intent, onVerified]);

  const submitClaim = async (event) => {
    event.preventDefault();
    if (utr.trim().length < 6) {
      toast.error('Enter the 12-digit UTR / reference number from your UPI app');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/payments/upi/claim', {
        paymentId,
        utr: utr.trim(),
        note: note.trim(),
        proofUrl: proofUrl.trim(),
      });

      if (data.status === 'PAID') {
        setStage('paid');
      } else {
        setStatus(data.status);
        setStage('waiting');
        toast.success('Thanks! We are checking the payment now.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not submit the payment reference');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !intent) return null;

  const amountLabel = `₹${intent.amountRupees ?? (intent.amount / 100).toFixed(2)}`;
  const isMobile = typeof navigator !== 'undefined'
    && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');

  const stages = ['pay', 'claim', 'waiting', 'paid'];
  const currentStep = stages.indexOf(stage);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="surface-card w-full max-w-lg !p-0 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-start gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <FiSmartphone size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Pay {amountLabel}</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate max-w-[16rem]">
                {intent.listingTitle || 'Rental booking'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors" aria-label="Close">
            <FiX size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Progress rail */}
        <div className="px-5 sm:px-6 pt-4 flex items-center gap-1.5">
          {['Scan & pay', 'Submit UTR', 'Under review', 'Confirmed'].map((label, index) => (
            <div key={label} className="flex-1 space-y-1.5">
              <div className={`h-1 rounded-full transition-colors ${index <= currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <p className={`text-[9px] font-bold uppercase tracking-wider ${index <= currentStep ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">

          {/* Razorpay notice — always visible until the gateway goes live */}
          {stage !== 'paid' && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3">
              <FiAlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 uppercase tracking-wider">Razorpay integration is in progress</p>
                <p className="text-amber-700 mt-1 leading-relaxed">
                  {intent.notice || 'Card and netbanking checkout is coming soon. Pay to our UPI QR to confirm your booking today.'}
                </p>
              </div>
            </div>
          )}

          {stage === 'paid' && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 flex gap-3">
              <FiCheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-emerald-900">Payment confirmed</p>
                <p className="text-emerald-700 mt-1 leading-relaxed">
                  We&apos;ve received {amountLabel} for {intent.listingTitle || 'your booking'}. It&apos;s now confirmed — check your bookings for pickup details.
                </p>
              </div>
            </div>
          )}

          {status === 'REJECTED' && stage !== 'paid' && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 flex gap-3">
              <FiAlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-red-900 uppercase tracking-wider">We couldn&apos;t match this payment</p>
                <p className="text-red-700 mt-1 leading-relaxed">
                  {rejection || 'No matching credit was found.'}
                  {intent.supportContact ? ` Please reach out at ${intent.supportContact}.` : ' Please contact support.'}
                </p>
              </div>
            </div>
          )}

          {/* Stage 1 — scan / open the UPI app */}
          {stage === 'pay' && (
            <div className="space-y-5">
              {intent.qrDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <img src={intent.qrDataUrl} alt="UPI payment QR code" className="w-48 h-48 sm:w-56 sm:h-56" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold mt-2 text-center">
                    Scan with any UPI app — the amount and reference are already filled in
                  </p>
                </div>
              ) : intent.staticQrUrl ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <img src={intent.staticQrUrl} alt="UPI payment QR code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                  </div>
                  <p className="text-[11px] text-amber-600 font-bold mt-2 text-center">
                    Enter {amountLabel} manually and add ref {intent.ref} in the note
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-500">
                  Use the UPI app button below — it opens your app with the amount and reference pre-filled.
                </div>
              )}

              <Button
                variant="primary"
                className="w-full !py-3.5 flex items-center justify-center gap-2"
                onClick={() => {
                  if (!intent.upiLink) {
                    toast.error('UPI link unavailable — copy the UPI ID below instead');
                    return;
                  }
                  window.location.href = intent.upiLink;
                }}
              >
                <FiExternalLink size={17} />
                {isMobile ? 'Pay via UPI app' : 'Pay via UPI app on your phone'}
              </Button>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">UPI ID</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{intent.payee?.vpa}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {intent.payee?.name}{intent.payee?.label ? ` · ${intent.payee.label}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(intent.payee?.vpa || '', 'UPI ID')}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors shrink-0"
                    aria-label="Copy UPI ID"
                  >
                    <FiCopy size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment reference</p>
                    <p className="text-sm font-semibold text-slate-800">{intent.ref}</p>
                    <p className="text-[11px] text-slate-400">Add this in the payment note so we can trace it</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(intent.ref || '', 'Reference')}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors shrink-0"
                    aria-label="Copy reference"
                  >
                    <FiCopy size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Amount</p>
                    <p className="text-sm font-semibold text-slate-800">{amountLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(amountLabel.replace('₹', ''), 'Amount')}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-brand-600 transition-colors"
                    aria-label="Copy amount"
                  >
                    <FiCopy size={15} />
                  </button>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full !py-3"
                onClick={() => setStage('claim')}
              >
                I&apos;ve paid — submit reference
              </Button>
            </div>
          )}

          {/* Stage 2 — renter submits the UTR */}
          {stage === 'claim' && (
            <form onSubmit={submitClaim} className="space-y-4">
              <div>
                <label htmlFor="upi-utr" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  UTR / reference number
                </label>
                <input
                  id="upi-utr"
                  className="input w-full"
                  placeholder="e.g. 402312345678"
                  value={utr}
                  onChange={(event) => setUtr(event.target.value)}
                  maxLength={64}
                  autoComplete="off"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Open your UPI app &rarr; transaction details &rarr; copy the UTR / RRN. It&apos;s also in the
                  confirmation SMS or email from your bank.
                </p>
              </div>

              <div>
                <label htmlFor="upi-note" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Note for us <span className="text-slate-300">(optional)</span>
                </label>
                <textarea
                  id="upi-note"
                  className="input w-full"
                  rows={2}
                  maxLength={500}
                  placeholder="Paid from 98xxx via PhonePe at 6:40pm"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="upi-proof" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Payment screenshot URL <span className="text-slate-300">(optional)</span>
                </label>
                <input
                  id="upi-proof"
                  className="input w-full"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(event) => setProofUrl(event.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Upload the screenshot anywhere it can be linked (Drive, Imgur) and paste the link.
                  Our team can also see it on your booking.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button variant="ghost" className="sm:flex-1" type="button" onClick={() => setStage('pay')}>
                  Back to QR
                </Button>
                <Button
                  variant="primary"
                  className="sm:flex-1 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit for verification'}
                </Button>
              </div>
            </form>
          )}

          {/* Stage 3 — awaiting admin verification */}
          {stage === 'waiting' && (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <FiClock size={30} className="animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Verifying your payment</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  We&apos;re matching UTR <span className="font-semibold text-slate-700">{utr}</span> against our
                  bank credit. This usually takes a few minutes during working hours.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-left text-xs text-slate-500 space-y-1">
                <p><span className="font-bold text-slate-700">Amount:</span> {amountLabel}</p>
                <p><span className="font-bold text-slate-700">Reference:</span> {intent.ref}</p>
                <p><span className="font-bold text-slate-700">UTR:</span> {utr}</p>
              </div>

              <p className="text-[11px] text-slate-400">
                This page updates automatically — you can safely leave it open.
              </p>

              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => checkStatus()}
                disabled={refreshing}
              >
                <FiRefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Checking...' : 'Check status now'}
              </Button>
            </div>
          )}

          {stage === 'paid' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-100 text-xs">
                <div className="flex justify-between p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Amount</span>
                  <span className="font-semibold text-slate-800">{amountLabel}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Reference</span>
                  <span className="font-semibold text-slate-800">{intent.ref}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status</span>
                  <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px]">Paid</span>
                </div>
              </div>
              <Button variant="primary" className="w-full !py-3.5" onClick={onClose}>
                View my bookings
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
