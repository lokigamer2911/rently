import { useEffect, useRef } from 'react';

/**
 * Thin top scroll-progress bar (global, non-intrusive).
 * Also broadcasts scroll direction on <body data-scroll-dir="up|down">
 * so CSS-only flourishes (marquee direction, orb drift) respond to scroll-up.
 *
 * Uses window.__lenis when available so the bar stays in sync with smooth scroll.
 */
export default function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const lenis = window.__lenis;
    let raf = 0;
    let lastY = 0;

    const getY = () => (lenis ? lenis.scroll : window.scrollY);

    const update = () => {
      raf = 0;
      const y = getY();
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, y / h) : 0;
      el.style.transform = `scaleX(${p.toFixed(4)})`;
      if (y !== lastY) {
        document.body.dataset.scrollDir = y > lastY ? 'down' : 'up';
        lastY = y;
      }
    };

    const loop = (time) => {
      if (lenis) lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Initial update
    update();

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (lenis) {
        lenis.off('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
      try { delete document.body.dataset.scrollDir; } catch {}
    };
  }, []);
  return <div ref={ref} className="scroll-progress" aria-hidden="true" />;
}
