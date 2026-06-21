import Link from 'next/link';
import { FiArrowUpRight, FiMapPin, FiShoppingCart, FiStar, FiShield } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function ListingCard({ l }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      router.push('/auth/login');
      return;
    }
    if (user.id === l.ownerId || user.id === l.owner?.id) {
      toast.error('You cannot rent your own gear!');
      return;
    }
    const added = addToCart(l);
    if (added) {
      toast.success('Added to cart');
      return;
    }
    toast('Already in your cart');
  };

  return (
    <div className="surface-card group flex h-full flex-col overflow-hidden p-0">
      <Link href={`/listings/${l.id}`} className="relative block overflow-hidden">
        {l.images?.[0] ? (
          <img
            src={l.images[0]}
            alt={l.title}
            className="h-72 w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(200,134,67,0.25),transparent_38%),linear-gradient(135deg,#f6efe3,#e8ddd0)] text-sm uppercase tracking-[0.24em] text-slate-500">
            No preview yet
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(17,24,20,0.62)] via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {l.category?.name && <span className="label-pill">{l.category.name}</span>}
          {l.city && (
            <span className="floating-pill">
              <FiMapPin size={13} />
              {l.city}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>{l.owner?.name || 'Verified host'}</span>
          <span className="inline-flex items-center gap-1 text-accent-500">
            <FiStar size={12} />
            Curated
          </span>
        </div>

        <Link href={`/listings/${l.id}`} className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl text-slate-900">{l.title}</h3>
            <FiArrowUpRight className="mt-1 shrink-0 text-slate-400 transition group-hover:text-brand-600" />
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
            {l.description || 'Thoughtfully listed with clear pricing, dependable hosts, and a polished booking flow.'}
          </p>
        </Link>

        <div className="soft-divider mt-6 flex items-center justify-between gap-3 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-slate-400">
              <FiShield size={10} className="text-brand-600" />
              Price Per Day
            </div>
            <p className="mt-1 text-2xl font-semibold text-brand-700">Rs {(l.pricePerDay / 100).toFixed(0)}</p>
          </div>

          {user && (user.id === l.ownerId || user.id === l.owner?.id) ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Listing</span>
          ) : (
            <button onClick={handleAddToCart} className="btn-secondary !px-4 !py-2.5" type="button">
              <FiShoppingCart size={16} />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
