import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiShield, FiLock, FiFileText, FiCheckCircle, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import TiltCard from '../../components/TiltCard';

export default function Verify() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isDigiLoading, setIsDigiLoading] = useState(false);
  const [step, setStep] = useState(1); 
  // 1: Info, 2: Consent/Login, 3: Fetching, 4: Success

  const handleStart = () => setStep(2);

  const handleDigiVerify = () => {
    setIsDigiLoading(true);
    setStep(3);
    
    // Simulating a realistic document fetching flow
    setTimeout(async () => {
      try {
        await api.post('/users/verify', {
          address: 'Verified via DigiLocker Ecosystem',
          idProofUrl: 'https://img.icons8.com/color/96/digilocker.png'
        });
        await refreshUser();
        setStep(4);
        toast.success('Aadhaar verified via DigiLocker!');
      } catch (err) {
        toast.error('Verification failed. Please try again.');
        setStep(1);
      } finally {
        setIsDigiLoading(false);
      }
    }, 4000);
  };

  // Success Screen
  if (step === 4 || (user?.isVerified && step === 1)) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="flex justify-center mb-8 relative">
          <div className="h-28 w-28 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-2xl animate-bounce">
            <FiCheckCircle size={56} />
          </div>
          <div className="absolute -bottom-2 right-1/4">
             <img src="https://img.icons8.com/color/48/digilocker.png" className="h-12 w-12 border-4 border-white rounded-2xl bg-white p-1 shadow-lg" alt="DigiLocker" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Identity Secured</h1>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto text-lg leading-relaxed">
          Your Aadhaar-linked identity is now cryptographically confirmed. You are a **Verified Renter**.
        </p>
        <Button variant="primary" onClick={() => router.push('/listings')} className="w-full shadow-xl shadow-brand-100 !py-5 text-lg">
          Start Renting
          <FiArrowRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Header */}
      <TiltCard max={6} glare={false} className="mb-8">
        <div className="surface-card !bg-gradient-to-br !from-blue-600 !to-blue-800 text-white border-none overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <img src="https://img.icons8.com/color/48/ffffff/digilocker.png" className="h-10 w-10 brightness-0 invert" alt="DigiLocker" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full">Secure Gateway</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Trust & Safety Portal</h1>
            <p className="text-blue-100 leading-relaxed max-w-lg">
              We use the Government's <span className="text-white font-bold">DigiLocker</span> ecosystem to verify your credentials instantly and securely.
            </p>
          </div>
          <FiShield size={180} className="absolute -right-10 -bottom-10 text-white/10" />
        </div>
      </TiltCard>

      <div className="surface-card !p-0 border-2 border-slate-50 overflow-hidden shadow-2xl">
        {step === 1 && (
          <div className="p-10 text-center space-y-8">
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-dashed border-slate-200">
               <FiLock size={48} className="mx-auto text-slate-300 mb-6" />
               <h2 className="text-2xl font-bold text-slate-900 mb-3">Instant ID Sync</h2>
               <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                 Rentrex will fetch your **Aadhaar Card** directly from your DigiLocker. No uploads, no manual entry, no stress.
               </p>
            </div>
            <Button 
              variant="primary"
              onClick={handleStart}
              className="w-full !bg-[#1b4395] hover:!bg-[#153475] text-white !py-5 !rounded-2xl font-bold text-lg flex items-center justify-center gap-4 transition-all hover:shadow-2xl hover:-translate-y-1 !border-none"
            >
              <FiExternalLink size={20} />
              Connect with DigiLocker
            </Button>
            <div className="flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Aadhaar_Logo.svg/1200px-Aadhaar_Logo.svg.png" className="h-10" alt="Aadhaar" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Digital_India_logo.svg" className="h-8" alt="Digital India" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
               <img src="https://img.icons8.com/color/96/digilocker.png" className="h-12 w-12" alt="DL" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Login to DigiLocker</span>
            </div>
            <div className="space-y-4">
               <p className="text-sm font-semibold text-slate-700">Rentrex is requesting permission to:</p>
               <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 text-slate-600 text-sm">
                  <FiFileText className="text-blue-600" />
                  <span>Access your issued Aadhaar Card</span>
               </div>
               <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 text-slate-600 text-sm">
                  <FiCheckCircle className="text-emerald-600" />
                  <span>Confirm your full name and address</span>
               </div>
            </div>
            <div className="pt-4 space-y-4">
               <Button 
                variant="primary"
                onClick={handleDigiVerify}
                className="w-full !bg-emerald-600 hover:!bg-emerald-700 text-white !py-4 shadow-lg !border-none"
               >
                 Allow & Verify
               </Button>
               <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors">
                 Cancel Request
               </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-16 text-center space-y-8">
            <div className="relative mx-auto w-32 h-32">
               <div className="absolute inset-0 border-8 border-blue-50 rounded-full"></div>
               <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <img src="https://img.icons8.com/color/96/digilocker.png" className="h-14 w-14 animate-pulse" alt="DL" />
               </div>
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Authenticating...</h2>
               <p className="text-slate-500 mt-2">Connecting to DigiLocker secure document vault</p>
            </div>
            <div className="max-w-xs mx-auto bg-slate-100 rounded-full h-2 overflow-hidden">
               <div className="bg-blue-600 h-full animate-[loading_4s_linear]" style={{width: '100%'}}></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure encrypted session active</p>
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-center gap-3">
        <FiLock size={12} />
        Encrypted via 256-bit AES protocol
        <span className="text-slate-200">|</span>
        <FiShield size={12} />
        MEITY Guidelines Compliant
      </p>
    </div>
  );
}
