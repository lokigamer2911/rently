import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiCompass, FiMessageCircle, FiPackage, FiShoppingCart, FiZap, FiMenu, FiUser, FiClock, FiLogOut, FiBell, FiActivity, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import useSWR from 'swr';
import { fetcher } from '../lib/api';
import Button from './Button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const links = [
    { href: '/listings', label: 'Discover', show: true },
    { href: '/listings/new', label: 'Host an Item', show: !!user },
    { href: '/chat', label: 'Messages', show: !!user },
    { href: '/admin', label: 'Admin', show: user?.role === 'ADMIN' },
  ];

  return (
    <header className={`sticky top-0 z-50 px-4 pt-4 md:px-5 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-[110%]'}`}>
      <div className="page-shell space-y-3">
        <div className="nav-topline">
          <span className="inline-flex items-center gap-2">
            <FiZap />
            Concierge-ready rentals with elevated presentation
          </span>
          <span className="inline-flex items-center gap-2">
            <FiCompass />
            Browse local inventory, creator gear, and event essentials
          </span>
        </div>

        <div className="nav-shell flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-[1rem] md:rounded-[1.2rem] bg-white shadow-brand transition-transform duration-500 group-hover:scale-110">
              <img src="/logo.png" alt="Rentrex Logo" className="h-full w-full object-contain p-1" />
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
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[rgba(37,52,42,0.12)] bg-white/95 p-3 shadow-soft backdrop-blur-xl">
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
                )}
              </div>
            ) : (
              <Button href="/auth/login" variant="primary" className="!px-4 !py-2 md:!px-5 md:!py-3">
                <FiUser size={16} />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[rgba(15,23,42,0.06)] pb-safe shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-2 py-3">
          <Link href="/listings" className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors">
            <FiCompass size={20} />
            <span className="text-[10px] font-semibold">Discover</span>
          </Link>
          <Link href="/listings/new" className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors">
            <div className="bg-brand-600 text-white p-2 rounded-full -mt-5 shadow-lg shadow-brand-500/30">
              <FiPackage size={20} />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Host</span>
          </Link>
          {user ? (
            <Link href="/chat" className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors">
              <FiMessageCircle size={20} />
              <span className="text-[10px] font-semibold">Chat</span>
            </Link>
          ) : (
            <Link href="/auth/login" className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors">
              <FiUser size={20} />
              <span className="text-[10px] font-semibold">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
