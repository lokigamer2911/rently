import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiArrowRight, FiCheckCircle, FiUser, FiShield, FiCompass, FiPackage, FiMessageCircle } from 'react-icons/fi';
import { api } from '../lib/api';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const steps = [
    {
      title: 'Welcome to Rently',
      description: 'The peer-to-peer rental marketplace for your community.',
      icon: <FiCompass size={32} />,
      color: 'text-brand-600',
    },
    {
      title: 'Verify your email',
      description: 'Check your inbox for a verification link. Verified users can book and list items.',
      icon: <FiShield size={32} />,
      color: 'text-emerald-600',
    },
    {
      title: 'Complete your profile',
      description: 'Add your name, photo, and ID proof to build trust with other users.',
      icon: <FiUser size={32} />,
      color: 'text-blue-600',
    },
    {
      title: "You're ready!",
      description: 'Start browsing gear near you or list your first item to earn.',
      icon: <FiCheckCircle size={32} />,
      color: 'text-emerald-600',
    },
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setCompleted(true);
    }
  };

  const skipOnboarding = async () => {
    try {
      await api.post('/onboarding/complete', {});
    } catch {}
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-50">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-600 mb-6 shadow-lg shadow-emerald-200">
          <FiCheckCircle size={32} className="text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">You're all set!</h1>
        <p className="text-lg text-slate-600 mb-8 max-w-sm">
          Start browsing items near you or list something you own to earn extra income.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/listings" className="btn-primary flex-1 !px-8 !py-4 text-sm sm:text-base">
            Browse Marketplace
          </Link>
          <Link href="/listings/new" className="btn-secondary flex-1 !px-8 !py-4 text-sm sm:text-base">
            List Your First Item
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50">
      <header className="mb-12 text-center max-w-md">
        <div className="flex items-center justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((i, idx) => (
            <div key={i} className="h-1.5 w-6 rounded-full transition-colors">
              {idx <= step ? (
                <div className="h-full bg-brand-600" />
              ) : (
                <div className="h-full bg-slate-200" />
              )}
            </div>
          ))}
        </div>
        <div className="flex w-full max-w-md justify-between text-xs text-slate-400 mb-6">
          <span>Step {step + 1} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </header>

      <main className="max-w-lg w-full space-y-8">
        <div className="flex items-center justify-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-4 ${currentStep.color}`}>
            {currentStep.icon}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 sm:p-12 shadow-xl border border-slate-100">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{currentStep.title}</h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">{currentStep.description}</p>

          <div className="flex flex-col sm:flex-row gap-3 pt-8">
            {step < steps.length - 1 ? (
              <>
                <button
                  onClick={nextStep}
                  className="flex-1 btn-primary !px-8 !py-4 text-sm sm:text-base"
                >
                  Next <FiArrowRight size={18} className="ml-2" />
                </button>
                <button
                  onClick={skipOnboarding}
                  className="flex-1 btn-secondary !px-8 !py-4 text-sm sm:text-base border-slate-200 text-slate-600 hover:text-slate-900"
                >
                  Skip
                </button>
              </>
            ) : (
              <button
                onClick={nextStep}
                className="flex-1 btn-primary !px-8 !py-4 text-sm sm:text-base"
              >
                Get Started <FiArrowRight size={18} className="ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center">
        <p className="text-xs text-slate-400">
          Skip anytime — you can complete onboarding from your profile later.
        </p>
      </footer>
    </div>
  );
}
