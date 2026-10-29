import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { FiArrowLeft, FiShield, FiStar, FiPackage, FiCalendar } from 'react-icons/fi';
import { fetcher } from '../../lib/api';
import ListingCard from '../../components/ListingCard';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export default function HostProfile() {
  const router = useRouter();
  const rawId = router.query?.id;
  const safeId = typeof rawId === 'string' && ID_PATTERN.test(rawId.trim()) ? rawId.trim() : '';

  const { data: host } = useSWR(safeId ? `/users/${safeId}/profile` : null, fetcher);
  const { data: listings } = useSWR(safeId ? `/listings?ownerId=${safeId}` : null, fetcher);

  if (router.isReady && !safeId) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-500">Invalid host link.</p>
        <Link href="/hosts" className="btn-secondary inline-flex">Back to host search</Link>
      </div>
    );
  }

  if (!host) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="surface-card animate-pulse h-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card animate-pulse h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto mobile-nav-spacer">
      <Link href="/hosts" className="btn-ghost">
        <FiArrowLeft size={16} />
        Back to host search
      </Link>

      <section className="hero-panel">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
          {host.avatarUrl ? (
            <img src={host.avatarUrl} alt={host.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border border-white/60 shadow-lg" />
          ) : (
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {(host.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{host.name}</h1>
              {host.isVerified && (
                <span className="floating-pill !text-emerald-700"><FiShield size={13} /> Verified</span>
              )}
              {host.isSuperhost && (
                <span className="floating-pill !text-amber-700"><FiStar size={13} /> Superhost</span>
              )}
            </div>
            {host.bio && <p className="section-copy mt-2 max-w-2xl">{host.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="floating-pill"><FiPackage size={13} /> {host.listingsCount} item{host.listingsCount === 1 ? '' : 's'}</span>
              {host.reviewCount > 0 && (
                <span className="floating-pill"><FiStar size={13} /> {Number(host.averageRating).toFixed(1)} from {host.reviewCount} review{host.reviewCount === 1 ? '' : 's'}</span>
              )}
              {host.memberSince && (
                <span className="floating-pill"><FiCalendar size={13} /> Hosting since {new Date(host.memberSince).getFullYear()}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {host.name.split(' ')[0]}’s items for rent
        </h2>
        {listings?.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <p className="text-xl text-slate-900">Nothing available right now.</p>
            <p className="text-sm mt-1">This host has no open listings at the moment.</p>
          </div>
        )}
      </section>
    </div>
  );
}
