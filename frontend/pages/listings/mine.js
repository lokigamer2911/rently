import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiPackage, FiPlus, FiTrash2, FiEdit, FiCalendar, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import ListingCard from '../../components/ListingCard';
import Button from '../../components/Button';
import BlockedDatesEditor from '../../components/BlockedDatesEditor';

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockDraft, setBlockDraft] = useState([]);
  const [savingBlock, setSavingBlock] = useState(false);

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

  const openBlockEditor = (listing) => {
    setBlockTarget(listing);
    setBlockDraft(Array.isArray(listing.blockedDates) ? listing.blockedDates : []);
  };

  const saveBlockDates = async () => {
    if (!blockTarget) return;
    try {
      setSavingBlock(true);
      const { data } = await api.patch(`/listings/${blockTarget.id}`, { blockedDates: blockDraft });
      setListings(listings.map(l => (l.id === blockTarget.id ? { ...l, blockedDates: data.blockedDates || blockDraft } : l)));
      toast.success('Blocked dates updated');
      setBlockTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update blocked dates');
    } finally {
      setSavingBlock(false);
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
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-all">
                <button
                  onClick={() => openBlockEditor(l)}
                  title="Edit blocked dates & times"
                  className="!h-10 !w-10 flex items-center justify-center bg-white/90 text-amber-600 rounded-xl shadow-lg hover:bg-amber-50"
                >
                  <FiCalendar size={18} />
                </button>
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

      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => !savingBlock && setBlockTarget(null)}>
          <div className="surface-card w-full max-w-lg !p-5 sm:!p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Availability</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Block dates & times</h2>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{blockTarget.title}</p>
              </div>
              <button onClick={() => setBlockTarget(null)} aria-label="Close" className="h-9 w-9 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <FiX size={16} />
              </button>
            </div>
            <BlockedDatesEditor value={blockDraft} onChange={setBlockDraft} />
            <div className="flex gap-2 mt-5">
              <button onClick={() => setBlockTarget(null)} disabled={savingBlock} className="btn-secondary flex-1 !py-3">
                Cancel
              </button>
              <button onClick={saveBlockDates} disabled={savingBlock} className="btn-primary flex-1 !py-3">
                {savingBlock ? 'Saving...' : 'Save blocks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
