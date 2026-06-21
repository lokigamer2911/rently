import React from 'react';
import Link from 'next/link';

/**
 * Button component supporting link behavior, variants, sizes and disabled state.
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'ghost' (default: 'primary')
 *  - size: 'sm' | 'md' | 'lg' (default: 'md')
 *  - href: if provided, renders a Next.js <Link> wrapping a <a> element.
 *  - onClick: click handler for button elements.
 *  - disabled: disables the button (adds aria-disabled & visual style).
 *  - className: additional utility classes.
 *  - children: button label/content.
 *  - type: 'button' | 'submit' | 'reset' (default: 'button')
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const baseClass = `btn btn-${variant} btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';
  const finalClass = `${baseClass} ${disabledClass} ${className}`.trim();

  if (href) {
    // When href is present we render a Next.js Link with an <a> for styling.
    return (
      <Link href={href} legacyBehavior>
        <a className={finalClass} aria-disabled={disabled} {...rest}>
          {children}
        </a>
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={finalClass}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
