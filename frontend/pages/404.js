import Head from 'next/head';
import Link from 'next/link';
import { FiSearch, FiHome, FiArrowLeft } from 'react-icons/fi';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Rently</title>
        <meta name="robots" content="noindex" />
      </Head>
      <section className="min-h-[70vh] flex items-center justify-center px-4 mobile-nav-spacer">
        <div className="text-center max-w-lg">
          <div className="relative mb-8">
            <span className="text-[120px] font-black text-slate-100 leading-none select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-sm">
                <FiSearch className="text-brand-500" size={32} />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">Page not found</h1>
          <p className="text-slate-500 leading-relaxed mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Try searching for what you need or head back to browse listings.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
            >
              <FiSearch size={16} />
              Browse listings
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              <FiHome size={16} />
              Go home
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
