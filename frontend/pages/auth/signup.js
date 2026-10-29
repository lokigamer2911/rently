import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { FiArrowRight, FiShield, FiZap } from 'react-icons/fi';
import { signInWithPopup } from 'firebase/auth';
import { api } from '../../lib/api';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider, firebaseInitError } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import TiltCard from '../../components/TiltCard';
import { setStoredAuthToken } from '../../lib/authToken';

// Only allow relative paths starting with / to prevent open redirect attacks
function sanitizeRedirect(raw) {
  if (typeof raw !== 'string') return '/listings';
  const trimmed = raw.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  return '/listings';
}

export default function Signup() {
  const router = useRouter();
  const { login } = useAuth();
  const initialEmail = typeof router.query.email === 'string' ? router.query.email : '';
  const initialName = typeof router.query.name === 'string' ? router.query.name : '';
  const googleIdToken = typeof router.query.googleIdToken === 'string' ? router.query.googleIdToken : '';
  const signupMessage = typeof router.query.message === 'string' && router.query.message.trim()
    ? router.query.message
    : '';
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [form, setForm] = useState({ name: initialName, email: initialEmail, password: '' });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: initialEmail || prev.email,
      name: initialName || prev.name,
    }));
  }, [initialEmail, initialName]);

  // If redirected from login with a Google ID token, auto-create account
  useEffect(() => {
    if (!googleIdToken) return;
    const autoCreateFromGoogle = async () => {
      try {
        const { data } = await api.post('/auth/firebase', { idToken: googleIdToken, createAccount: true });
        setStoredAuthToken(data.token);
        login(data);
        toast.success('Account created with Google!');
        const dest = sanitizeRedirect(router.query.redirect);
        router.push(dest);
      } catch (error) {
        console.error('Google auto-create error:', error);
        toast.error('Failed to create account. Please fill in the form below.');
      }
    };
    autoCreateFromGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (!auth || firebaseInitError) {
        const { data } = await api.post('/auth/signup', {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setStoredAuthToken(data.token);
        login(data);
        toast.success('Account created! Please verify your email.');
        router.push({ pathname: '/auth/verify-email-pending', query: { email: form.email } });
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      const idToken = await cred.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken, createAccount: true });

      setStoredAuthToken(data.token);
      login(data);
      if (data.user?.emailVerified) {
        toast.success('Account created!');
        const dest = sanitizeRedirect(router.query.redirect);
        router.push(dest);
      } else {
        toast.success('Account created! Please verify your email.');
        router.push({ pathname: '/auth/verify-email-pending', query: { email: form.email } });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to create account');
    }
  };

  const googleSignup = async () => {
    if (!auth || firebaseInitError) return toast.error('Firebase is not configured.');
    if (!googleProvider) return toast.error('Google provider not initialized.');

    try {
      setIsGoogleLoading(true);
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken, createAccount: true });

      setStoredAuthToken(data.token);
      login(data);
      toast.success('Account created with Google!');
      if (data.user?.emailVerified) {
        const dest = sanitizeRedirect(router.query.redirect);
        router.push(dest);
      } else {
        router.push({ pathname: '/auth/verify-email-pending', query: { email: data.user?.email } });
      }
    } catch (error) {
      console.error('Google signup error:', error);
      if (error.response?.status === 409) {
        toast.error('An account with this email already exists. Please sign in instead.');
        router.push('/auth/login');
      } else {
        toast.error(error.response?.data?.error || error.message || 'Google sign-up failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <section className="grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr] mobile-nav-spacer">
      <div className="surface-card hidden lg:flex flex-col justify-between bg-[linear-gradient(145deg,rgba(36,60,45,0.95),rgba(20,31,24,0.96))] text-white">
        <div>
          <p className="eyebrow mb-5 !border-white/10 !bg-white/10 !text-white">
            <FiZap size={14} />
            Host and renter access
          </p>
          <h1 className="section-title text-5xl text-white md:text-6xl">Create an account that matches the upgraded experience.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/74">
            Build a profile, publish standout listings, manage bookings, and move through the marketplace with a more polished shopping feel from day one.
          </p>
        </div>

        <TiltCard max={9} glare={false} className="mt-8">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/8 p-5">
            <div className="flex items-center gap-3 text-white/86">
              <FiShield size={18} className="pop-layer" />
              <p className="text-lg">A cleaner layout, more thoughtful surfaces, and a much stronger visual first impression across the entire storefront.</p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="surface-card">
        <div className="mb-6">
          <div className="h-14 w-14 mb-8 overflow-hidden rounded-2xl bg-white shadow-brand">
            <img src="/logo.png" alt="Rentrex Logo" className="h-full w-full object-contain p-1" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Create your profile</p>
          <h2 className="mt-3 text-4xl text-slate-900">Join Rentrex</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
            Set up your account to browse, book, host, and manage everything from one place.
          </p>
        </div>

        {signupMessage && (
          <div className="mb-5 rounded-[1.4rem] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            {signupMessage}
          </div>
        )}

        <p className="mb-4 text-xs text-slate-400 text-center">
          After signing up, check your email for a verification link. You can still use your account before verifying.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            className="input"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (minimum 6 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <Button type="submit" variant="primary" className="w-full !py-3.5">
            Create account
            <FiArrowRight size={16} />
          </Button>
        </form>

        <div className="my-5 text-center text-xs uppercase tracking-[0.24em] text-slate-400">or continue with</div>

        <Button type="button" variant="secondary" onClick={googleSignup} className="w-full !py-3.5" disabled={isGoogleLoading}>
          {isGoogleLoading ? 'Connecting to Google...' : 'Google'}
        </Button>

        <p className="mt-6 text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-brand-700">
            Sign in instead
          </Link>
        </p>
      </div>
    </section>
  );
}
