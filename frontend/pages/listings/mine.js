import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import ListingCard from '../../components/ListingCard';
import Button from '../../components/Button';

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/listings/user/me')
        .then(res => {
          setListings(res.data);
          setLoading(false);
        })
        .catch(err => {
          toast.error('Failed to load your items');
          setLoading(false);
        });
    }
  }, [user]);

  const deleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error('Failed to delete listing');
    }
  };

  if (!user) {
    return <div className="py-20 text-center text-slate-500">Please sign in to view your items.</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/listings" className="btn-ghost">
          <FiArrowLeft size={16} />
          Back to marketplace
        </Link>
        <Button href="/listings/new" variant="primary">
          <FiPlus size={16} />
          Add new item
        </Button>
      </div>

      <header>
        <p className="eyebrow mb-3">Your Inventory</p>
        <h1 className="section-title text-5xl">Items you are hosting.</h1>
        <p className="section-copy mt-4 max-w-xl">
          Manage your listings, track their status, and keep your inventory up to date for your neighbors.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="surface-card animate-pulse h-80" />
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <div key={l.id} className="relative group">
              <ListingCard l={l} />
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <Link 
                  href={`/listings/edit/${l.id}`}
                  className="!h-10 !w-10 flex items-center justify-center bg-white/90 text-brand-600 rounded-xl shadow-lg hover:bg-brand-50"
                >
                  <FiEdit size={18} />
                </Link>
                <button 
                  onClick={() => deleteListing(l.id)}
                  className="!h-10 !w-10 flex items-center justify-center bg-white/90 text-red-600 rounded-xl shadow-lg hover:bg-red-50"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card py-20 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FiPackage size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">You haven't listed anything yet.</h2>
          <p className="text-slate-500">Share your gear with the community and start earning today.</p>
          <Button href="/listings/new" variant="primary" className="inline-flex mt-4">
            List your first item
          </Button>
        </div>
      )}
    </div>
  );
}
