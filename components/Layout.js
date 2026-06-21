import Link from 'next/link';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell pb-24 pt-8 md:pb-20 md:pt-10">{children}</main>

      <footer className="page-shell pb-24 md:pb-12">
        <div className="surface-card space-y-12">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Branding Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                  <img src="/logo.png" alt="Rently Logo" className="h-full w-full object-contain p-0.5" />
                </div>
                <p className="eyebrow !mb-0">Rently Studio Market</p>
              </div>
              <h2 className="section-title text-2xl md:text-3xl font-bold leading-tight">
                A sharper rental experience for creators, hosts, and modern teams.
              </h2>
              <p className="section-copy text-sm max-w-md">
                Discover premium gear, book with confidence, and keep every part of the journey feeling polished.
              </p>
            </div>

            {/* Sitemap Columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Platform</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <Link href="/listings" className="text-slate-500 hover:text-slate-900 transition">
                      Browse Items
                    </Link>
                  </li>
                  <li>
                    <Link href="/listings/new" className="text-slate-500 hover:text-slate-900 transition">
                      Become Host
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="text-slate-500 hover:text-slate-900 transition">
                      Help Center
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Community</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Trust & Safety
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Careers
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Legal</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Follow Us</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-slate-500 hover:text-slate-900 transition">
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Tier */}
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} Rently. All rights reserved. Transforming how communities share and rent gear.</p>
            <div className="flex gap-4">
              <Link href="/listings" className="text-slate-400 hover:text-slate-600 transition">Shop rentals</Link>
              <Link href="/listings/new" className="text-slate-400 hover:text-slate-600 transition">Become host</Link>
            </div>
          </div>
        </div>
      </footer>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: {
            background: '#1d2d23',
            color: '#f8f2e8',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 40px -24px rgba(18, 31, 24, 0.9)',
          },
        }}
      />
    </div>
  );
}
