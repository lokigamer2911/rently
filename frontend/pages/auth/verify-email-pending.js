import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiMail, FiRefreshCw, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyEmailPending() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const email = typeof router.query.email === 'string' ? router.query.email : user?.email || '';

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resendEmail = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent! Check your inbox.');
      setCooldown(60); // 60-second cooldown
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      <div className="h-20 w-20 bg-brand-100 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
        <FiMail size={36} />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-3">Verify your email</h1>

      {email && (
        <p className="text-slate-500 mb-2">
          We sent a verification link to
        </p>
      )}
      {email && (
        <p className="text-lg font-semibold text-slate-700 mb-6">{email}</p>
      )}

      <p className="text-slate-500 mb-8 leading-relaxed">
        Click the link in the email to verify your account. 
        You can still browse listings, but some features require a verified email.
      </p>

      <div className="space-y-3">
        <Button
          variant="primary"
          className="w-full !py-3.5"
          onClick={() => router.push('/listings')}
        >
          Continue to listings
          <FiArrowRight size={16} />
        </Button>

        <Button
          variant="secondary"
          className="w-full !py-3.5"
          onClick={resendEmail}
          disabled={resending || cooldown > 0}
        >
          <FiRefreshCw size={16} className={resending ? 'animate-spin' : ''} />
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : resending
            ? 'Sending...'
            : 'Resend verification email'}
        </Button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Wrong email?{' '}
          <button
            onClick={logout}
            className="font-semibold text-brand-600 hover:underline"
          >
            Sign out and use a different email
          </button>
        </p>
      </div>
    </div>
  );
}
