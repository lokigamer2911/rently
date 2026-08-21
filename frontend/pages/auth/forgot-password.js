import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiArrowRight, FiMail, FiArrowLeft } from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/Button';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="h-20 w-20 bg-brand-100 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <FiMail size={36} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Check your email</h1>
        <p className="text-slate-500 mb-8">
          We sent a password reset link to <strong>{email}</strong>. 
          The link expires in 1 hour.
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Didn't receive it? Check your spam folder, or{' '}
          <button onClick={() => setSubmitted(false)} className="text-brand-600 font-semibold hover:underline">
            try a different email
          </button>.
        </p>
        <Link href="/auth/login" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-8 transition">
        <FiArrowLeft size={14} /> Back to login
      </Link>
      
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Forgot your password?</h1>
      <p className="text-slate-500 mb-8">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Button type="submit" variant="primary" className="w-full !py-3.5" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
          {!loading && <FiArrowRight size={16} />}
        </Button>
      </form>
    </div>
  );
}
