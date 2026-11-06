import Link from 'next/link';
import { useState } from 'react';
import { FiBell, FiSearch, FiX, FiMapPin, FiCalendar, FiTag } from 'react-icons/fi';
import { api } from '../lib/api';
import Button from '../components/Button';

export default function SavedSearches() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(new Set());

  const loadSearches = async () => {
    try {
      const { data } = await api.get('/saved-searches');
      setSearches(data || []);
    } catch {
      setSearches([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id) => {
    setDeleting(prev => new Set([...prev, id]));
    try {
      await api.delete(`/saved-searches/${id}`);
      setSearches(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error('Failed to delete search');
    } finally {
      setDeleting(prev => new Set([...prev].filter(x => x !== id)));
    }
  };

  const runSearch = (search) => {
    const params = new URLSearchParams();
    if (search.query) params.set('q', search.query);
    if (search.city) params.set('city', search.city);
    if (search.categoryId) params.set('categoryId', search.categoryId);
    if (search.minPrice) params.set('minPrice', search.minPrice * 100);
    if (search.maxPrice) params.set('maxPrice', search.maxPrice * 100);
    window.location.href = `/listings?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
        <div className="surface-card animate-pulse h-96 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 mobile-nav-spacer">
      <Link href="/listings" className="mb-8 btn-ghost inline-flex items-center gap-2">
        <FiSearch size={16} /> Back to marketplace
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Saved Searches</h1>
        <p className="text-slate-600">
          Get notified when new items match your saved searches.
        </p>
      </header>

      {searches.length === 0 ? (
        <div className="surface-card rounded-[2rem] p-12 sm:p-16 text-center border border-dashed border-slate-200">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto mb-6">
            <FiBell size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">No saved searches yet</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">
            Save your favorite searches on the marketplace page and we'll alert you when new matching items are listed.
          </p>
          <Link href="/listings" className="btn-primary inline-flex items-center justify-center !px-8 !py-4">
            Browse Marketplace <FiSearch size={18} className="ml-2" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map(search => (
            <div
              key={search.id}
              className="surface-card rounded-[1.6rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {search.query && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
                        <FiSearch size={12} className="text-slate-500" />
                        <span>{search.query}</span>
                      </span>
                    )}
                    {search.city && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
                        <FiMapPin size={12} className="text-slate-500" />
                        <span>{search.city}</span>
                      </span>
                    )}
                    {search.categoryId && (
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
                        <FiTag size={12} className="text-slate-500" />
                        <span>{search.categoryName || 'Category'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <FiCalendar size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Saved {new Date(search.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => runSearch(search)}
                    className="w-full btn-secondary !px-6 !py-3 text-left text-sm font-medium hover:bg-slate-100 transition-all"
                  >
                    Run this search
                  </button>
                </div>
                <button
                  onClick={() => deleteSearch(search.id)}
                  disabled={deleting.has(search.id)}
                  className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors disabled:opacity-50"
                  aria-label="Delete saved search"
                >
                  {deleting.has(search.id) ? (
                    <FiX size={14} className="animate-pulse" />
                  ) : (
                    <FiX size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
