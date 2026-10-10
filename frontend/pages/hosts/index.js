import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { FiArrowLeft, FiSearch, FiShield, FiStar, FiPackage } from 'react-icons/fi';
import { fetcher } from '../../lib/api';

function HostAvatar({ host, size = 'h-14 w-14 text-xl' }) {
  if (host.avatarUrl) {
    return <img src={host.avatarUrl} alt={host.name} className={`${size} rounded-2xl object-cover border border-slate-200`} />;
  }
  return (
    <div className={`${size} rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center font-bold`}>
      {(host.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function HostsPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { data: hosts, isLoading } = useSWR(
    submitted.length >= 2 ? `/users/search?q=${encodeURIComponent(submitted)}` : null,
    fetcher
  );

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto mobile-nav-spacer">
      <Link href="/listings" className="btn-ghost">
        <FiArrowLeft size={16} />
        Back to marketplace
      </Link>

      <header>
        <p className="eyebrow mb-3">Find your vendor</p>
        <h1 className="section-title text-5xl">Rent from someone you trust.</h1>
        <p className="section-copy mt-4 max-w-xl">
          Search local hosts and vendors, open their storefront, and rent directly from the person you want.
        </p>
      </header>

      <form onSubmit={submit} className="surface-card !p-3 sm:!p-4 flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input !pl-12 !py-3.5"
            placeholder="Search hosts by name — e.g. CameraGuy Mumbai"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            minLength={2}
          />
        </div>
        <button type="submit" className="btn-primary shrink-0 !px-6">
          Search
        </button>
      </form>

      {submitted.length >= 2 ? (
        isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface-card animate-pulse h-40" />
            ))}
          </div>
        ) : hosts?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hosts.map((host) => (
              <Link key={host.id} href={`/hosts/${host.id}`} className="surface-card group flex gap-4 !p-4 sm:!p-5">
                <HostAvatar host={host} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{host.name}</h3>
                    {host.isVerified && <FiShield size={14} className="text-emerald-600 shrink-0" />}
                    {host.isSuperhost && <FiStar size={14} className="text-amber-500 shrink-0" />}
                  </div>
                  {host.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{host.bio}</p>}
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <FiPackage size={12} />
                    {host.listingsCount} item{host.listingsCount === 1 ? '' : 's'} for rent
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <p className="text-xl text-slate-900">No hosts found for “{submitted}”.</p>
            <p className="text-sm mt-1">Try a different name or spelling.</p>
          </div>
        )
      ) : (
        <div className="catalog-empty">
          <FiSearch size={28} className="text-slate-300 mb-2" />
          <p className="text-xl text-slate-900">Type at least 2 characters to search hosts.</p>
          <p className="text-sm mt-1">Have a favourite vendor? Find their storefront here.</p>
        </div>
      )}
    </div>
  );
}
