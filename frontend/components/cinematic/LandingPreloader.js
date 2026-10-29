import { useEffect, useState } from 'react';
import { isReducedMotion } from '../../lib/cinematic';

/**
 * LANDING-ONLY cinematic preloader.
 * Full-screen brand intro (~1.6s), then slides away.
 * Session-scoped so marketplace pages are never blocked.
 */
export default function LandingPreloader() {
  const [done, setDone] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('rently-preloader-seen')) {
      setDone(true);
      return;
    }
    if (isReducedMotion()) {
      sessionStorage.setItem('rently-preloader-seen', '1');
      setDone(true);
      return;
    }
    document.body.style.overflow = 'hidden';
    try { window.__lenis?.stop?.(); } catch {}
    const t1 = setTimeout(() => setHide(true), 1400);
    const t2 = setTimeout(() => {
      setDone(true);
      document.body.style.overflow = '';
      sessionStorage.setItem('rently-preloader-seen', '1');
      try { window.__lenis?.start?.(); } catch {}
      // Let scroll systems re-measure now that scroll is unlocked
      window.dispatchEvent(new Event('rently:preloader-done'));
    }, 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, []);

  if (done) return null;

  return (
    <div className={`landing-preloader ${hide ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="landing-preloader-inner">
        <div className="landing-preloader-mark">R</div>
        <div className="landing-preloader-word">
          <span className="cine-mask"><span className="cine-mask-line">Rently</span></span>
        </div>
        <div className="landing-preloader-bar"><i /></div>
        <p>Loading your marketplace</p>
      </div>
      <div className="landing-preloader-wipe" />
    </div>
  );
}
