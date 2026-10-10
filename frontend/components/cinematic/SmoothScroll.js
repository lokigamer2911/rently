import { useEffect } from 'react';
import Lenis from 'lenis';
import { isReducedMotion } from '../../lib/cinematic';

/**
 * Global smooth-scroll provider. Same UI, buttery motion.
 * - Disabled when prefers-reduced-motion
 * - Exposes window.__lenis for ScrollTrigger sync
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (isReducedMotion()) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    window.__lenis = lenis;

    let raf = 0;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Keep anchor jumps smooth
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el, { offset: -90 });
        }
      }
    };
    document.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return <>{children}</>;
}
