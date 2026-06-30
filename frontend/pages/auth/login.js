import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { signInWithPopup, signInWithPhoneNumber, signInWithEmailAndPassword } from 'firebase/auth';
import { FiArrowRight, FiPhone, FiShield, FiUser, FiZap } from 'react-icons/fi';
import { auth, googleProvider, RecaptchaVerifier, firebaseInitError } from '../../lib/firebase';
import { api } from '../../lib/api';
import Button from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import TiltCard from '../../components/TiltCard';
import { setStoredAuthToken } from '../../lib/authToken';

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  const { login } = useAuth();
  const initError = firebaseInitError || (auth === null ? 'Firebase Auth is not initialized' : null);
  const loginMessage = typeof router.query.message === 'string' && router.query.message.trim()
    ? router.query.message
    : '';

  const finish = (data) => {
    setStoredAuthToken(data.token);
    login(data);
    const dest = router.query.redirect || '/listings';
    router.push(dest);
  };

  const getGoogleErrorMessage = (error) => {
    const backendError = error.response?.data?.error;
    if (backendError) return `Backend sign-in failed: ${backendError}`;
    if (error.code === 'auth/configuration-not-found') {
      return 'Google Sign-In is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.';
    }
    if (error.code === 'auth/unauthorized-domain') {
      return `This domain (${window.location.hostname}) is not authorized. Add it to Firebase Console -> Authentication -> Authorized domains.`;
    }
    if (error.code === 'auth/invalid-api-key') {
      return 'The Firebase web API key is invalid. Check the values in frontend/.env.local.';
    }
    return error.message ? `${error.code || 'auth/error'}: ${error.message}` : 'Google sign-in failed';
  };

  const emailLogin = async (e) => {
    e.preventDefault();
    if (!auth) return toast.error('Auth service not ready');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken });
      finish(data);
    } catch (error) {
      console.error('Email login error:', error);
      toast.error(error.message || 'Login failed');
    }
  };

  const googleLogin = async () => {
    if (initError) return toast.error(`Firebase not ready: ${initError}`);
    if (!auth) return toast.error('Firebase Auth is not available.');
    if (!googleProvider) return toast.error('Google provider is not initialized. Check Firebase Console configuration.');

    try {
      setIsGoogleRedirecting(true);
      const cred = await signInWithPopup(auth, googleProvider);
      const idToken = await cred.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken });
      finish(data);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(getGoogleErrorMessage(error));
    } finally {
      setIsGoogleRedirecting(false);
    }
  };

  const sendOtp = async () => {
    if (!auth) return toast.error('Firebase is not configured correctly.');
    if (!phone || phone.length < 10) return toast.error('Please enter a valid phone number with country code.');
    
    try {
      // Clear existing verifier if it exists to avoid state issues
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha', { 
        size: 'invisible',
        'callback': () => { console.log('Recaptcha solved'); }
      });

      const formattedPhone = phone.replace(/\s/g, ''); // Remove spaces
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmation(confirmationResult);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('SMS Send Error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('The phone number is invalid. Please check the format (+91...)');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to send OTP. Please check your connection.');
      }
      
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  };

  const verifyOtp = async () => {
    try {
      const credential = await confirmation.confirm(code);
      const idToken = await credential.user.getIdToken();
      const { data } = await api.post('/auth/firebase', { idToken });
      finish(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="hero-panel flex flex-col justify-between">
        <div>
          <p className="eyebrow mb-5">
            <FiZap size={14} />
            Elevated access
          </p>
          <h1 className="section-title text-5xl md:text-6xl">Sign in to a storefront that finally feels designed.</h1>
          <p className="section-copy mt-5 max-w-xl">
            Save favorites, track bookings, chat with hosts, and move through the marketplace with a calmer, more premium rhythm.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <TiltCard max={10} className="h-full">
            <div className="mini-stat h-full">
              <FiUser className="text-brand-600 pop-layer" size={18} />
              <p className="mt-3 text-xl text-slate-900">One account for carts, chats, and bookings</p>
            </div>
          </TiltCard>
          <TiltCard max={10} className="h-full">
            <div className="mini-stat h-full">
              <FiShield className="text-brand-600 pop-layer" size={18} />
              <p className="mt-3 text-xl text-slate-900">Trusted flows with clearer host and inventory signals</p>
            </div>
          </TiltCard>
          <TiltCard max={10} className="h-full">
            <div className="mini-stat h-full">
              <FiPhone className="text-brand-600 pop-layer" size={18} />
              <p className="mt-3 text-xl text-slate-900">Email, Google, and phone-based entry points</p>
            </div>
          </TiltCard>
        </div>
      </div>

      <div className="surface-card">
        <div className="mb-6">
          <div className="h-14 w-14 mb-8 overflow-hidden rounded-2xl bg-white shadow-brand">
            <img src="/logo.png" alt="Rentrex Logo" className="h-full w-full object-contain p-1" />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Welcome back</p>
          <h2 className="mt-3 text-4xl text-slate-900">Access your Rentrex account</h2>
        </div>

        <div className="mb-5 inline-flex rounded-full border border-[rgba(37,52,42,0.08)] bg-white/70 p-1">
          {['email', 'phone'].map((option) => (
            <Button
              key={option}
              type="button"
              variant={tab === option ? 'primary' : 'ghost'}
              onClick={() => setTab(option)}
              className={`!rounded-full !px-4 !py-2 !text-sm !font-medium transition`}
            >
              {option === 'email' ? 'Email login' : 'Phone OTP'}
            </Button>
          ))}
        </div>

        {initError && (
          <div className="mb-5 rounded-[1.4rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Firebase configuration issue:</strong> {initError}
          </div>
        )}

        {loginMessage && (
          <div className="mb-5 rounded-[1.4rem] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            {loginMessage}
          </div>
        )}

        {tab === 'email' ? (
          <form onSubmit={emailLogin} className="space-y-4">
            <input className="input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="primary" className="w-full !py-3.5">
              Continue to account
              <FiArrowRight size={16} />
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number (India)</label>
              <div className="relative">
                <input 
                  className="input pl-12" 
                  placeholder="98765 43210" 
                  value={phone.replace(/^\+91/, '')} 
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, ''); // Only digits
                    if (val.length > 10) val = val.slice(0, 10);
                    setPhone(val ? `+91${val}` : '');
                  }} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                <p className="text-[10px] font-semibold text-brand-700 uppercase tracking-tighter">Country code +91 is added automatically</p>
              </div>
            </div>

            {!confirmation ? (
              <Button 
                type="button" 
                variant="primary"
                onClick={sendOtp} 
                disabled={!phone}
                className="w-full !py-3.5"
              >
                Send Verification Code
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Enter 6-Digit OTP</label>
                  <input 
                    className="input text-center tracking-[0.5em] text-lg font-bold" 
                    placeholder="000000" 
                    maxLength={6}
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                  />
                </div>
                <Button type="button" variant="primary" onClick={verifyOtp} className="w-full !py-3.5">
                  Verify & Sign In
                </Button>
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setConfirmation(null)} 
                  className="w-full !text-xs !font-semibold text-slate-400 hover:text-brand-600 transition"
                >
                  Use a different number
                </Button>
              </div>
            )}
            <div id="recaptcha" className="mt-2" />
          </div>
        )}

        <div className="my-6 text-center text-xs uppercase tracking-[0.24em] text-slate-400">or continue with</div>

        <Button type="button" variant="secondary" onClick={googleLogin} className="w-full !py-3.5" disabled={isGoogleRedirecting}>
          {isGoogleRedirecting ? 'Redirecting to Google...' : 'Google'}
        </Button>

        <p className="mt-6 text-sm text-slate-500">
          New here?{' '}
          <Link href="/auth/signup" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
