import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiArrowRight, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/Button';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return toast.error('Please fill in both fields');
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password reset successful!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Invalid link</h1>
        <p className="text-slate-500 mb-6">This password reset link is invalid or missing.</p>
        <Link href="/auth/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle size={36} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Password reset!</h1>
        <p className="text-slate-500 mb-8">Your password has been updated. You can now log in.</p>
        <Button variant="primary" onClick={() => router.push('/auth/login')} className="w-full !py-3.5">
          Go to login <FiArrowRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-8 transition">
        <FiArrowLeft size={14} /> Back to login
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-3">Set new password</h1>
      <p className="text-slate-500 mb-8">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input"
          type="password"
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" className="w-full !py-3.5" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset password'}
          {!loading && <FiArrowRight size={16} />}
        </Button>
      </form>
    </div>
  );
}
