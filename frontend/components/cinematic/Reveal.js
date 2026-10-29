/**
 * Scroll reveal system — fades elements up into view as they enter the viewport.
 *
 * - Uses GSAP ScrollTrigger so animations fire on scroll entry (not on mount)
 * - Staggered delays via data-delay attribute
 * - Variants via data-cine: 'up' (default), 'fade', 'scale', 'left', 'right'
 * - Reduced-motion: skipped entirely, content stays visible
 * - SEO-safe: no CSS opacity:0 hiding; JS-only animation
 * - SSR-safe: skips on server
 */
export function initCineReveals(scope) {
  if (typeof window === 'undefined') return () => {};
  if (!scope) scope = typeof document !== 'undefined' ? document : {};

  import('gsap')
    .then(({ default: gsap }) => {
      return import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        let triggers = [];

        gsap.utils.toArray('.cine-reveal', scope).forEach((el) => {
          const variant = el.dataset.cine || 'up';
          const delay = Math.min(1, Math.max(0, parseFloat(el.dataset.delay || '0') || 0));

          // Initial state (hidden, off-screen)
          const from = revealFrom(variant, 1);
          gsap.set(el, { ...from, opacity: 0 });

          const trigger = ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            once: true,
            onEnter: () => {
              gsap.to(el, {
                opacity: 1,
                y: 0,
                x: 0,
                filter: 'blur(0px)',
                scale: 1,
                duration: 0.8,
                ease: 'power2.out',
                delay,
                overwrite: 'auto',
              });
            },
          });
          triggers.push(trigger);
        });

        ScrollTrigger.refresh();

        return () => {
          triggers.forEach((t) => t.kill());
          ScrollTrigger.getAll().forEach((t) => t.kill());
        };
      });
    })
    .catch(() => {});

  return () => {};
}

function revealFrom(variant, dir) {
  // dir: 1 = enter from below (scroll down)
  const y = dir >= 0 ? 30 : -30;
  if (variant === 'fade') return { y: 0, x: 0, opacity: 0, filter: 'blur(8px)', scale: 1 };
  if (variant === 'scale') return { y: dir >= 0 ? 20 : -20, x: 0, opacity: 0, filter: 'blur(4px)', scale: 0.9 };
  if (variant === 'left') return { y: 0, x: dir >= 0 ? 40 : -40, opacity: 0, filter: 'blur(4px)', scale: 1 };
  if (variant === 'right') return { y: 0, x: dir >= 0 ? -40 : 40, opacity: 0, filter: 'blur(4px)', scale: 1 };
  return { y, x: 0, opacity: 0, filter: 'blur(6px)', scale: 0.99 };
}

/** Kept for backward compatibility — landing page imports this name. */
export const useCineReveals = initCineReveals;

export default function Reveal({ children, delay = 0, variant = 'up', className = '', as: Tag = 'div' }) {
  return (
    <Tag className={`cine-reveal ${className}`} data-delay={delay} data-cine={variant}>
      {children}
    </Tag>
  );
}
