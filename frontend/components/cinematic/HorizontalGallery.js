import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { isReducedMotion, isMobileWidth } from '../../lib/cinematic';

/**
 * LANDING-ONLY horizontal CGI gallery.
 * Desktop: pinned horizontal scroll via GSAP ScrollTrigger.
 * Mobile: native horizontal snap scroll (no pin — keeps marketplace UX safe).
 */
export default function HorizontalGallery({ items = [] }) {
  const wrap = useRef(null);
  const track = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !wrap.current || !track.current) return;
    if (isReducedMotion() || isMobileWidth(1024)) return;
    let killed = false;
    let cleanup = null;
    (async () => {
      const { default: gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      if (killed || !wrap.current || !track.current) return;
      const ctx = gsap.context(() => {
        gsap.to(track.current, {
          x: () => -(track.current.scrollWidth - window.innerWidth + 48),
          ease: 'none',
          scrollTrigger: {
            trigger: wrap.current,
            start: 'top top+=80',
            end: () => `+=${track.current.scrollWidth - window.innerWidth + 400}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });
      });
      cleanup = () => ctx.revert();
    })();
    return () => {
      killed = true;
      try { cleanup?.(); } catch {}
    };
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section ref={wrap} className="landing-hwrap">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <span className="eyebrow mb-3">Featured this week</span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Popular near you
        </h2>
        <p className="text-sm text-slate-500 mt-2">Swipe through live listings.</p>
      </div>
      <div ref={track} className="landing-htrack">
        {items.map((it, i) => (
          <Link key={it.id || i} href={it.id ? `/listings/${it.id}` : '/listings'} className="landing-hcard group">
            <div className="landing-himg">
              {it.images?.[0] ? (
                <img src={it.images[0]} alt={it.title} loading="lazy" />
              ) : (
                <div className="landing-hfallback">{it.emoji || '✨'}</div>
              )}
              <span className="label-pill">{it.category?.name || it.tag || 'Featured'}</span>
            </div>
            <div className="landing-hbody">
              <h3>{it.title}</h3>
              <p>Rs {(it.pricePerDay / 100).toFixed(0)}/day · {it.city || 'Nearby'}</p>
            </div>
          </Link>
        ))}
        <Link href="/listings" className="landing-hcard landing-hcta">
          <span>Explore all →</span>
        </Link>
      </div>
    </section>
  );
}
