import { useState } from 'react';

/**
 * AnimatedIcon — CSS-3D "liquid glass" icon tile.
 *
 * The landing page already runs several WebGL canvases; these tiles give the
 * remaining sections the same dimensional feel at a fraction of the cost:
 *   - an idle float/tilt loop (staggered per tile via `delay`)
 *   - a hover pop: lift + scale, glyph pushes forward in 3D, shadow deepens
 *   - a light sweep across the disc on hover
 * All motion is pure CSS, so it degrades gracefully and respects
 * prefers-reduced-motion (see globals.css).
 */

const TONES = {
  blue: {
    tintTop: 'rgba(59, 130, 246, 0.18)',
    tintBottom: 'rgba(147, 197, 253, 0.08)',
    color: '#2563eb',
    shadow: 'rgba(37, 99, 235, 0.32)',
  },
  emerald: {
    tintTop: 'rgba(16, 185, 129, 0.18)',
    tintBottom: 'rgba(110, 231, 183, 0.08)',
    color: '#059669',
    shadow: 'rgba(5, 150, 105, 0.32)',
  },
  purple: {
    tintTop: 'rgba(147, 51, 234, 0.16)',
    tintBottom: 'rgba(216, 180, 254, 0.08)',
    color: '#9333ea',
    shadow: 'rgba(147, 51, 234, 0.30)',
  },
  amber: {
    tintTop: 'rgba(245, 158, 11, 0.18)',
    tintBottom: 'rgba(253, 230, 138, 0.08)',
    color: '#d97706',
    shadow: 'rgba(217, 119, 6, 0.30)',
  },
};

const SIZES = {
  sm: { box: 'h-9 w-9', glyph: 16, lift: 'translateZ(10px)', pop: 'translateZ(20px)' },
  md: { box: 'h-11 w-11', glyph: 20, lift: 'translateZ(12px)', pop: 'translateZ(24px)' },
  lg: { box: 'h-14 w-14', glyph: 26, lift: 'translateZ(14px)', pop: 'translateZ(28px)' },
};

export default function AnimatedIcon({ icon: Icon, tone = 'blue', size = 'md', delay = '0s' }) {
  const [hovered, setHovered] = useState(false);
  const t = TONES[tone] || TONES.blue;
  const s = SIZES[size] || SIZES.md;

  return (
    <span
      className={`lumi-icon ${s.box}`}
      data-hovered={hovered ? 'true' : 'false'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        '--lumi-tint-top': t.tintTop,
        '--lumi-tint-bottom': t.tintBottom,
        '--lumi-color': t.color,
        '--lumi-shadow': t.shadow,
      }}
      aria-hidden="true"
    >
      <span className="lumi-icon__disc" style={{ animationDelay: delay }}>
        <span className="lumi-icon__shine" />
        <span className="lumi-icon__glyph" style={{ transform: hovered ? s.pop : s.lift }}>
          <Icon size={s.glyph} strokeWidth={2.2} />
        </span>
      </span>
    </span>
  );
}
