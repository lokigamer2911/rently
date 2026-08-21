import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

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
 *  - requireAuth: if true, redirects unauthenticated users to login
 *  - authMessage: optional message shown before redirecting
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
  requireAuth = false,
  authMessage = 'Please sign in first to use this feature.',
  ...rest
}) {
  const router = useRouter();
  const { user } = useAuth();
  const baseClass = `btn btn-${variant} btn-${size}`;
  const disabledClass = disabled ? 'btn-disabled' : '';
  const finalClass = `${baseClass} ${disabledClass} ${className}`.trim();
  const loginHref = `/auth/login?redirect=${encodeURIComponent(router.asPath)}&message=${encodeURIComponent(authMessage)}`;

  const handleAuthGate = (event) => {
    if (!requireAuth || user) return false;
    event.preventDefault();
    toast.error(authMessage);
    router.push(loginHref);
    return true;
  };

  if (href) {
    // When href is present we render a Next.js Link with an <a> for styling.
    return (
      <Link href={href} legacyBehavior>
        <a
          className={finalClass}
          aria-disabled={disabled || (requireAuth && !user)}
          onClick={handleAuthGate}
          {...rest}
        >
          {children}
        </a>
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={finalClass}
      onClick={(event) => {
        if (handleAuthGate(event)) return;
        onClick?.(event);
      }}
      disabled={disabled}
      aria-disabled={disabled || (requireAuth && !user)}
      {...rest}
    >
      {children}
    </button>
  );
}
