import { useEffect } from 'react';
import { isReducedMotion } from '../../lib/cinematic';

let gsapPromise = null;
async function getGsap() {
  if (gsapPromise) return gsapPromise;
  gsapPromise = (async () => {
    const { default: gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  })();
  return gsapPromise;
}

function revealFrom(variant, dir) {
  // dir: 1 = scrolling down (enter from below), -1 = scrolling up (enter from above)
  const y = dir >= 0 ? 34 : -34;
  if (variant === 'fade') return { y: 0, x: 0, opacity: 0, filter: 'blur(6px)', scale: 1 };
  if (variant === 'scale') return { y: dir >= 0 ? 18 : -18, x: 0, opacity: 0, filter: 'blur(4px)', scale: 0.95 };
  if (variant === 'left') return { y: 0, x: dir >= 0 ? 40 : -40, opacity: 0, filter: 'blur(4px)', scale: 1 };
  if (variant === 'right') return { y: 0, x: dir >= 0 ? -40 : 40, opacity: 0, filter: 'blur(4px)', scale: 1 };
  return { y, x: 0, opacity: 0, filter: 'blur(6px)', scale: 0.99 };
}

/**
 * Direction-aware reveal system — visibly animates on scroll DOWN and scroll UP.
 *
 * How it works (verified):
 * - onEnter (scrolling down into view): plays entrance from below (y:+34).
 * - onEnterBack (scrolling up into view): plays entrance from above (y:-34).
 * - onLeave (scrolled past top): parks hidden above (y:-26) so the next
 *   scroll-up entrance slides down into place.
 * - onLeaveBack (scrolled past bottom): parks hidden below (y:+26) so the
 *   next scroll-down entrance slides up into place.
 * - No CSS hiding anywhere (SEO / no-JS safe); JS-only set/play.
 * - Reduced-motion: skipped entirely, content stays visible.
 */
export function initCineReveals(scope = document) {
  if (typeof window === 'undefined' || isReducedMotion()) return () => {};
  let ctx = null;
  let killed = false;
  let lenisHandler = null;

  getGsap()
    .then(({ gsap, ScrollTrigger }) => {
      if (killed) return;

      if (window.__lenis) {
        lenisHandler = () => ScrollTrigger.update();
        try {
          window.__lenis.on('scroll', lenisHandler);
        } catch {}
      }

      ctx = gsap.context(() => {
        // --- 1. Directional reveals ---
        gsap.utils.toArray('.cine-reveal').forEach((el) => {
          const variant = el.dataset.cine || 'up';
          const delay = Math.min(0.5, Math.max(0, parseFloat(el.dataset.delay || '0') || 0));

          const play = (dir) => {
            gsap.fromTo(el, revealFrom(variant, dir), {
              y: 0,
              x: 0,
              opacity: 1,
              filter: 'blur(0px)',
              scale: 1,
              duration: 0.8,
              ease: 'power3.out',
              delay,
              overwrite: 'auto',
            });
          };
          const park = (dir) => {
            // Park off-stage on the side it exited, ready for the return trip
            const hidden = revealFrom(variant, dir);
            gsap.set(el, { ...hidden, opacity: 0 });
          };

          // Start hidden (JS-only; CSS keeps it visible for no-JS/SEO)
          park(1);

          ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            end: 'bottom 10%',
            onEnter: (self) => play(self.direction || 1),
            onEnterBack: (self) => play(self.direction || -1),
            onLeave: () => park(-1),
            onLeaveBack: () => park(1),
          });
        });

        // --- 2. Directional masked lines ---
        gsap.utils.toArray('.cine-mask-line').forEach((el) => {
          const parent = el.parentElement || el;
          const playLine = (dir) => {
            gsap.fromTo(
              el,
              { yPercent: dir >= 0 ? 110 : -110 },
              { yPercent: 0, duration: 0.85, ease: 'power4.out', overwrite: 'auto' }
            );
          };
          gsap.set(el, { yPercent: 110 });
          ScrollTrigger.create({
            trigger: parent,
            start: 'top 90%',
            end: 'bottom 10%',
            onEnter: (self) => playLine(self.direction || 1),
            onEnterBack: (self) => playLine(self.direction || -1),
            onLeave: () => gsap.set(el, { yPercent: -110 }),
            onLeaveBack: () => gsap.set(el, { yPercent: 110 }),
          });
        });

        // --- 3. Parallax (scrub is inherently bidirectional) ---
        gsap.utils.toArray('[data-parallax]').forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.15') || 0.15;
          gsap.to(el, {
            yPercent: speed * 100,
            ease: 'none',
            overwrite: 'auto',
            scrollTrigger: {
              trigger: el.parentElement || el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        });
      }, scope);

      ScrollTrigger.refresh();
    })
    .catch(() => {});

  return () => {
    killed = true;
    try {
      if (window.__lenis && lenisHandler) window.__lenis.off('scroll', lenisHandler);
    } catch {}
    try {
      ctx?.revert();
    } catch {}
  };
}

export default function Reveal({ children, delay = 0, variant = 'up', className = '', as: Tag = 'div' }) {
  return (
    <Tag className={`cine-reveal ${className}`} data-delay={delay} data-cine={variant}>
      {children}
    </Tag>
  );
}

export function useCineReveals(deps = []) {
  useEffect(() => {
    const cleanup = initCineReveals();
    const refresh = () => {
      import('gsap/ScrollTrigger')
        .then(({ ScrollTrigger }) => ScrollTrigger.refresh())
        .catch(() => {});
    };
    // 1) fonts/images 2) fallback after preloader window 3) event when preloader unlocks scroll
    const t1 = setTimeout(refresh, 600);
    const t2 = setTimeout(refresh, 2300);
    window.addEventListener('rently:preloader-done', refresh);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('rently:preloader-done', refresh);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
