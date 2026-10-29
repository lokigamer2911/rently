import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const HeroScene = dynamic(() => import('./HeroScene'), {
  ssr: false,
  loading: () => null,
});

export default function Hero3D({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setMounted(true);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    const update = () => {
      // Use static/reduced details if motion is disabled or on mobile
      setReduced(motionQuery.matches || mobileQuery.matches);
    };

    update();
    motionQuery.addEventListener('change', update);
    mobileQuery.addEventListener('change', update);
    return () => {
      motionQuery.removeEventListener('change', update);
      mobileQuery.removeEventListener('change', update);
    };
  }, []);

  if (!mounted) {
    return <div className={`hero-canvas-fallback ${className}`} aria-hidden="true" />;
  }

  return (
    <div className={`hero-canvas ${className}`} aria-hidden="true">
      <HeroScene reduced={reduced} />
    </div>
  );
}
