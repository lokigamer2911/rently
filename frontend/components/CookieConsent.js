import { useState, useEffect } from 'react';
import Button from './Button';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
      <div className="text-sm">
        <p>
          We use cookies to improve your experience on our site, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.
        </p>
      </div>
      <div className="flex gap-3 flex-shrink-0">
        <Button variant="secondary" onClick={() => setShow(false)} className="!bg-slate-800 !text-white !border-slate-700 hover:!bg-slate-700">Decline</Button>
        <Button variant="primary" onClick={accept} className="!bg-brand-500 hover:!bg-brand-600">Accept All</Button>
      </div>
    </div>
  );
}
