import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/Button';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Invalid or expired verification link');
      }
    };

    verify();
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Invalid link</h1>
        <p className="text-slate-500 mb-6">This verification link is invalid or missing.</p>
        <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center">
      {status === 'loading' && (
        <>
          <div className="h-20 w-20 bg-slate-100 text-slate-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <FiLoader size={36} className="animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Verifying your email...</h1>
          <p className="text-slate-500">Please wait while we verify your email address.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle size={36} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Email verified!</h1>
          <p className="text-slate-500 mb-8">{message}</p>
          <Button variant="primary" onClick={() => router.push('/listings')} className="w-full !py-3.5">
            Start browsing listings
            <FiArrowRight size={16} />
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="h-20 w-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <FiXCircle size={36} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Verification failed</h1>
          <p className="text-slate-500 mb-8">{message}</p>
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:underline">
            Go to homepage
          </Link>
        </>
      )}
    </div>
  );
}
