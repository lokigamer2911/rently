import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiCompass, FiMessageCircle, FiPackage, FiShoppingCart, FiZap, FiMenu, FiUser, FiClock, FiLogOut, FiBell, FiActivity, FiTrendingUp, FiHeart, FiSun, FiMoon, FiX } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import Button from './Button';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const { data: notifications } = useSWR(user ? '/notifications' : null, fetcher, { refreshInterval: 5000 });
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  const links = [
    { href: '/listings', label: 'Discover', show: true },
    { href: '/listings/new', label: 'Host an Item', show: !!user },
    { href: '/chat', label: 'Messages', show: !!user },
    { href: '/admin', label: 'Admin', show: user?.role === 'ADMIN' },
  ];

  return (
    <>
      {/* ===== DESKTOP NAV (md+) ===== */}
      <header className={`hidden md:block sticky top-0 z-50 px-4 pt-4 md:px-5 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-[110%]'}`}>
        <div className="page-shell space-y-3">
          <div className="nav-shell flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-[1rem] md:rounded-[1.2rem] bg-white shadow-brand transition-transform duration-500 group-hover:scale-110">
                <img src="/logo.png" alt="Rently Logo" className="h-full w-full object-contain p-1" />
              </div>
              <span>
                <span className="brand-wordmark block text-xl md:text-2xl">Rently</span>
                <span className="brand-caption block hidden sm:block">Modern rental marketplace</span>
              </span>
            </Link>

            <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
              {links.filter((link) => link.show).map((link) => (
                <Link key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button onClick={toggleTheme} variant="ghost" className="!h-12 !w-12 !rounded-2xl !px-0 !py-0" aria-label="Toggle theme">
                {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
              </Button>

              <Button href="/notifications" variant="ghost" className="relative !h-12 !w-12 !rounded-2xl !px-0 !py-0" aria-label="Notifications">
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <Button href="/cart" variant="ghost" className="relative !h-12 !w-12 !rounded-2xl !px-0 !py-0" aria-label="Open cart">
                <FiShoppingCart size={18} />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-semibold text-white">
                    {totalItems}
                  </span>
                )}
              </Button>

              {user ? (
                <div className="relative">
                  <Button 
                    variant="ghost"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="!h-12 !w-12 !rounded-2xl !px-0 !py-0"
                  >
                    <FiMenu size={20} />
                  </Button>
                  
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[rgba(37,52,42,0.12)] bg-white/95 p-3 shadow-soft backdrop-blur-xl z-50">
                        <div className="mb-2 px-3 pb-2 pt-1 border-b border-[rgba(37,52,42,0.06)]">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Account</p>
                          <p className="truncate text-sm font-semibold text-slate-900">{user.name || user.email || 'Member'}</p>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiActivity size={16} />
                            Command Center
                          </Link>
                          <Link href="/earnings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiTrendingUp size={16} />
                            Earnings Analytics
                          </Link>
                          <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiUser size={16} />
                            Profile
                          </Link>
                          <Link href="/favorites" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiHeart size={16} />
                            Favorites
                          </Link>
                          <Link href="/listings/mine" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiPackage size={16} />
                            Your Items
                          </Link>
                          <Link href="/bookings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiClock size={16} />
                            Previous Orders
                          </Link>
                          <Link href="/help" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[rgba(36,60,45,0.06)] hover:text-brand-700" onClick={() => setMenuOpen(false)}>
                            <FiMessageCircle size={16} />
                            Help & Support
                          </Link>
                          <Button variant="ghost" onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 !justify-start">
                            <FiLogOut size={16} />
                            Sign out
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`} variant="primary" className="!px-4 !py-2 md:!px-5 md:!py-3">
                  <FiUser size={16} />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE TOP BAR (always visible, minimal) ===== */}
      <header className="md:hidden sticky top-0 z-50 px-3 pt-3">
        <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 overflow-hidden rounded-xl bg-white shadow-sm">
              <img src="/logo.png" alt="Rently" className="h-full w-full object-contain p-0.5" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Rently</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Button onClick={toggleTheme} variant="ghost" className="!h-10 !w-10 !rounded-xl !px-0 !py-0" aria-label="Toggle theme">
              {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
            </Button>

            <Button href="/notifications" variant="ghost" className="relative !h-10 !w-10 !rounded-xl !px-0 !py-0" aria-label="Notifications">
              <FiBell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            <Button href="/cart" variant="ghost" className="relative !h-10 !w-10 !rounded-xl !px-0 !py-0" aria-label="Cart">
              <FiShoppingCart size={16} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold text-white">
                  {totalItems}
                </span>
              )}
            </Button>

            {user ? (
              <Link href="/profile" className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <FiUser size={16} className="text-slate-400" />
                )}
              </Link>
            ) : (
              <Button href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`} variant="primary" className="!h-10 !rounded-xl !px-3 !py-0 !text-xs">
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[rgba(15,23,42,0.06)] pb-safe shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <Link href="/listings" className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${router.pathname === '/listings' || router.pathname.startsWith('/listings') ? 'text-brand-600' : 'text-slate-400'}`}>
            <FiCompass size={22} />
            <span className="text-[10px] font-semibold">Discover</span>
          </Link>

          <Link href="/listings/new" className="flex flex-col items-center gap-0.5 text-slate-400">
            <div className="bg-brand-600 text-white p-2.5 rounded-full -mt-4 shadow-lg shadow-brand-500/30">
              <FiPackage size={20} />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Host</span>
          </Link>

          {user ? (
            <>
              <Link href="/chat" className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${router.pathname.startsWith('/chat') ? 'text-brand-600' : 'text-slate-400'}`}>
                <FiMessageCircle size={22} />
                <span className="text-[10px] font-semibold">Chat</span>
              </Link>
              <Link href="/bookings" className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${router.pathname.startsWith('/bookings') ? 'text-brand-600' : 'text-slate-400'}`}>
                <FiClock size={22} />
                <span className="text-[10px] font-semibold">Orders</span>
              </Link>
            </>
          ) : (
            <Link href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`} className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-slate-400">
              <FiUser size={22} />
              <span className="text-[10px] font-semibold">Sign in</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
