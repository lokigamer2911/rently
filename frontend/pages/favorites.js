import { FiHeart, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import useSWR from 'swr';
import Link from 'next/link';
import { api, fetcher } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import ListingCard from '../components/ListingCard';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import TiltCard from '../components/TiltCard';

export default function Favorites() {
  const { user } = useAuth();
  const { data: favorites, mutate } = useSWR(user ? '/favorites' : null, fetcher);

  const removeFavorite = async (listingId) => {
    try {
      await api.post(`/favorites/toggle/${listingId}`);
      mutate();
      toast.success('Removed from favorites');
    } catch (err) {
      toast.error('Failed to remove favorite');
    }
  };

  if (!user) {
    return <div className="py-20 text-center text-slate-500">Please sign in to view your favorites.</div>;
  }

  return (
    <div className="space-y-5 sm:space-y-8 max-w-6xl mx-auto mobile-nav-spacer">
      <div className="flex items-center justify-between">
        <Link href="/listings" className="btn-ghost">
          <FiArrowLeft size={16} />
          Back to marketplace
        </Link>
      </div>

      <header>
        <p className="eyebrow mb-3">Saved Items</p>
        <h1 className="section-title text-5xl">Your Favorites</h1>
        <p className="section-copy mt-4 max-w-xl">
          Items you've saved for later. Quick access to the gear you love.
        </p>
      </header>

      {favorites?.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map(l => (
            <div key={l.id} className="relative group">
              <ListingCard l={l} />
              <button
                onClick={() => removeFavorite(l.id)}
                className="absolute top-4 right-16 z-10 !h-10 !w-10 flex items-center justify-center bg-white/90 text-red-600 rounded-xl shadow-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove from favorites"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card py-20 text-center space-y-4">
          <TiltCard max={12} glare={false} className="mx-auto w-fit">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FiHeart size={32} />
            </div>
          </TiltCard>
          <h2 className="text-2xl font-bold text-slate-900">No favorites yet</h2>
          <p className="text-slate-500">Tap the heart icon on any listing to save it here.</p>
          <Button href="/listings" variant="primary" className="inline-flex mt-4">
            Browse listings
          </Button>
        </div>
      )}
    </div>
  );
}
