import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiCalendar,
  FiMapPin,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiUser,
  FiBell,
  FiShare2,
  FiCopy,
  FiHeart,
} from 'react-icons/fi';
import { api, fetcher } from '../../lib/api';
import MapView from '../../components/MapView';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/Button';
import TermsModal from '../../components/TermsModal';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function sanitizeId(raw) {
  if (!raw) return '';
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!ID_PATTERN.test(trimmed)) return '';
  return trimmed;
}

export default function ListingDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const rawId = router.query?.id;
  const safeId = sanitizeId(rawId);
  const [accessToken, setAccessToken] = useState('');
  const accessParam = accessToken ? `?access=${encodeURIComponent(accessToken)}` : '';
  const { data: listing } = useSWR(safeId ? `/listings/${safeId}${accessParam}` : null, fetcher);
  const { data: booked } = useSWR(safeId ? `/listings/${safeId}/availability${accessParam}` : null, fetcher);
  const { addToCart } = useCart();
  const isOwner = user && listing && (
    user.id === listing.ownerId || 
    user.id === listing.owner?.id ||
    (user.email && listing.owner?.email && user.email === listing.owner.email)
  );
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [depositType, setDepositType] = useState('CASH');
  const [depositNote, setDepositNote] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (user && safeId) {
      api.get(`/favorites/check/${safeId}`).then(res => {
        setIsFavorited(res.data.isFavorited);
      }).catch(() => {});
    }
  }, [user, safeId]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    try {
      const { data } = await api.post(`/favorites/toggle/${safeId}`);
      setIsFavorited(data.isFavorited);
      toast.success(data.isFavorited ? 'Saved to favorites' : 'Removed from favorites');
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  const shareListing = async (platform) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out this rental: ${listing?.title || 'Amazing item on Rently'}`;
    
    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      setShowShareMenu(false);
      return;
    }
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    }
    setShowShareMenu(false);
  };

  useEffect(() => {
    if (!router.isReady || !rawId || !user || accessToken || router.query.access) return;
    if (!safeId) return;

    const issueAccessToken = async () => {
      try {
        const { data } = await api.post(`/listings/${safeId}/access`);
        const nextAccessToken = data.accessToken;
        if (nextAccessToken) {
          setAccessToken(nextAccessToken);
          router.replace({ pathname: router.pathname, query: { ...router.query, access: nextAccessToken } }, undefined, { shallow: true });
        }
      } catch {
        // fall back to the public listing view if token issuance is unavailable
      }
    };

    issueAccessToken();
  }, [router.isReady, id, user, accessToken, router.pathname, router.query.access]);
  
  const getLocalDatetime = (date = new Date()) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const todayTime = getLocalDatetime();

  if (!listing) {
    return <div className="surface-card animate-pulse py-14 text-center text-slate-500">Loading listing...</div>;
  }

  const calculatedDays = start && end && new Date(end) > new Date(start) 
    ? Math.ceil((new Date(end) - new Date(start)) / 86400000) 
    : 0;
  
  const baseRental = calculatedDays * listing.pricePerDay;
  const platformFee = Math.round(baseRental * 0.05); // 5% Fee
  const depositAmount = depositType === 'CASH' ? listing.deposit : 0;
  const totalCost = calculatedDays > 0 ? (baseRental + platformFee + depositAmount) : 0;

  const avgRating = listing.reviews?.length
    ? (listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length).toFixed(1)
    : null;
  const hasCoordinates = typeof listing.lat === 'number' && typeof listing.lng === 'number';
  const hasUnavailableDates = booked?.bookings?.length > 0 || booked?.blockedDates?.length > 0;

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to your cart');
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    const added = addToCart(listing);
    if (added) {
      toast.success('Added to cart');
      return;
    }
    toast('Already in your cart');
  };

  const book = async () => {
    if (!start || !end) return toast.error('Pick booking dates first');
    if (new Date(end) <= new Date(start)) return toast.error('End date must be after the start date');
    
    if (booked?.blockedDates?.length > 0) {
      const sDate = new Date(start.split('T')[0]);
      const eDate = new Date(end.split('T')[0]);
      const overlap = booked.blockedDates.some(d => {
        const bDate = new Date(d);
        return bDate >= sDate && bDate <= eDate;
      });
      if (overlap) return toast.error('Selected dates overlap with host blocked dates');
    }

    if (typeof window === 'undefined' || !window.Razorpay) {
      return toast.error('Payment gateway is still loading. Please try again.');
    }
    
    if (!showTerms) {
      setShowTerms(true);
      return;
    }

    try {
      const { data: booking } = await api.post('/bookings', { 
        listingId: listing.id, 
        startDate: start, 
        endDate: end,
        depositType,
        depositNote
      });
      const { data: order } = await api.post('/payments/order', { bookingId: booking.id });

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Rentrex',
        description: listing.title,
        image: '/logo.png',
        handler: async (response) => {
          await api.post('/payments/verify', response);
          toast.success('Payment successful');
          router.push('/bookings');
        },
      });

      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />        <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-24 md:pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/listings" className="btn-ghost">
            <FiArrowLeft size={16} />
            Back to catalog
          </Link>

          <div className="flex flex-wrap gap-2 items-center">
            {listing.category?.name && <span className="floating-pill">{listing.category.name}</span>}
            <span className="floating-pill">
              <FiShield size={13} />
              Secure booking flow
            </span>
            {listing.viewCount > 0 && (
              <span className="floating-pill">
                {listing.viewCount} view{listing.viewCount === 1 ? '' : 's'}
              </span>
            )}
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="floating-pill cursor-pointer hover:bg-white/90 transition-all" type="button">
                <FiShare2 size={13} />
                Share
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white border border-slate-100 shadow-xl z-50 p-2">
                  <button onClick={() => shareListing('copy')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors" type="button">
                    <FiCopy size={14} /> Copy Link
                  </button>
                  <button onClick={() => shareListing('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors" type="button">
                    💬 WhatsApp
                  </button>
                  <button onClick={() => shareListing('twitter')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors" type="button">
                    🐦 Twitter
                  </button>
                  <button onClick={() => shareListing('facebook')} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors" type="button">
                    📘 Facebook
                  </button>
                </div>
              )}
            </div>
            <button onClick={toggleFavorite} className="floating-pill cursor-pointer hover:bg-white/90 transition-all" type="button">
              <FiHeart size={13} className={isFavorited ? 'text-red-500 fill-red-500' : ''} />
              {isFavorited ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <section className="hero-panel">
          <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="eyebrow mb-3 sm:mb-5">Featured rental</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>{listing.title}</h1>

              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
                <span className="floating-pill">
                  <FiMapPin size={13} />
                  {listing.city || 'Location available on request'}
                </span>
                <span className="floating-pill">
                  <FiUser size={13} />
                  Hosted by {listing.owner?.name || 'Verified owner'}
                </span>
                {avgRating && (
                  <span className="floating-pill">
                    <FiStar size={13} />
                    {avgRating} rating from {listing.reviews.length} review{listing.reviews.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <p className="section-copy mt-4 sm:mt-6 max-w-2xl">{listing.description}</p>

              <div className="mt-5 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
                <div className="mini-stat">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Price Per Day</p>
                  <p className="mt-3 text-3xl text-brand-700">Rs {(listing.pricePerDay / 100).toFixed(0)}</p>
                </div>
                <div className="mini-stat">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Security</p>
                  {listing.depositType === 'ALTERNATIVE' ? (
                    <div className="mt-2">
                      <p className="text-sm font-bold text-brand-700 flex items-center gap-1">
                        Collateral Required
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{listing.depositNote || 'See details below'}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-3xl text-slate-900">{listing.deposit > 0 ? `Rs ${(listing.deposit / 100).toFixed(0)}` : 'None'}</p>
                  )}
                </div>
                <div className="mini-stat">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Availability</p>
                  <p className="mt-3 text-2xl text-slate-900">{hasUnavailableDates ? 'Check unavailable dates below' : 'Open dates now'}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {listing.images?.length ? (
                listing.images.slice(0, 4).map((image, index) => (
                  <div
                    key={image}
                    className={`overflow-hidden rounded-[1.8rem] border border-[rgba(37,52,42,0.08)] bg-white/70 shadow-soft ${
                      index === 0 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={listing.title}
                      className={`w-full object-cover ${index === 0 ? 'h-[20rem]' : 'h-[11rem]'}`}
                    />
                  </div>
                ))
              ) : (
                <div className="flex min-h-[22rem] items-center justify-center rounded-[1.8rem] bg-[radial-gradient(circle_at_top,rgba(200,134,67,0.24),transparent_34%),linear-gradient(135deg,#f6efe3,#e5d8c8)] text-sm uppercase tracking-[0.25em] text-slate-500 sm:col-span-2">
                  Imagery coming soon
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr_0.72fr]">
          <div className="space-y-8 xl:col-span-2">
            <section className="surface-card">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Listing narrative</p>
                  <h2 className="mt-2 text-4xl text-slate-900">What renters should know</h2>
                </div>
              </div>
              <p className="text-base leading-8 text-slate-600">{listing.description}</p>
              
              {listing.depositType === 'ALTERNATIVE' && (
                <div className="mt-8 p-6 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-3 mb-3 text-amber-800">
                    <FiShield size={20} />
                    <h3 className="font-bold">Security Collateral Requirement</h3>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    Instead of a cash deposit, the host requires the following as security:
                    <span className="block mt-2 font-bold p-3 bg-white/50 rounded-xl border border-amber-200">
                      "{listing.depositNote}"
                    </span>
                  </p>
                  <p className="mt-4 text-[11px] text-amber-700 uppercase tracking-widest font-bold">
                    This will be safely held by the host and returned upon successful item return.
                  </p>
                </div>
              )}
            </section>

            {hasCoordinates && (
              <section className="surface-card">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Pickup area</p>
                  <h2 className="mt-2 text-4xl text-slate-900">Location overview</h2>
                </div>
                <MapView lat={listing.lat} lng={listing.lng} height={360} />
              </section>
            )}

            <section className="surface-card">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Social proof</p>
                  <h2 className="mt-2 text-4xl text-slate-900">Renter reviews</h2>
                </div>
                <p className="text-sm text-slate-500">
                  {listing.reviews?.length ? `${listing.reviews.length} review${listing.reviews.length === 1 ? '' : 's'} collected` : 'No reviews yet'}
                </p>
              </div>

              {listing.reviews?.length ? (
                <div className="grid gap-4">
                  {listing.reviews.map((review) => (
                    <div key={review.id} className="rounded-[1.6rem] border border-[rgba(37,52,42,0.09)] bg-white/70 p-5 shadow-soft">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{review.author.name}</p>
                          <div className="mt-2 flex gap-1 text-accent-500">
                            {Array.from({ length: 5 }, (_, index) => (
                              <FiStar key={index} size={14} className={index < review.rating ? 'fill-current' : 'opacity-30'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">{review.comment || 'Great rental experience.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="catalog-empty !min-h-[180px]">
                  <p className="text-xl text-slate-900">This listing is ready for its first great review.</p>
                </div>
              )}
            </section>
          </div>

          <aside className="surface-card h-fit space-y-5 xl:sticky xl:top-28">
            {listing.owner?.name && (
              <div className="rounded-[1.6rem] border border-[rgba(37,52,42,0.08)] bg-white/70 p-4 text-sm leading-7 text-slate-600">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Host signal</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{listing.owner.name}</p>
                <p className="mt-2">{listing.owner.bio || 'Responsive owner profile.'}</p>
              </div>
            )}

            {!isOwner && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reservation Details</p>
                  <p className="mt-3 text-4xl text-brand-700">Rs {(listing.pricePerDay / 100).toFixed(0)}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    per 24h block, plus {listing.depositType === 'ALTERNATIVE' ? 'security collateral' : (listing.deposit > 0 ? `Rs ${(listing.deposit / 100).toFixed(0)} deposit` : 'no deposit')}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-[rgba(37,52,42,0.08)] bg-white/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FiCalendar size={15} />
                    Pick your dates
                  </div>
                  <div className="space-y-3">
                    <input type="datetime-local" className="input" min={todayTime} value={start} onChange={(e) => setStart(e.target.value)} />
                    <input type="datetime-local" className="input" min={start || todayTime} value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>

                  {listing.deposit > 0 && (
                    <div className="mt-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Security Method</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setDepositType('CASH')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${depositType === 'CASH' ? 'bg-brand-600 text-white shadow-brand' : 'bg-white text-slate-600 border border-slate-200'}`}
                        >
                          Cash Deposit
                        </button>
                        <button 
                          onClick={() => setDepositType('ALTERNATIVE')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${depositType === 'ALTERNATIVE' ? 'bg-brand-600 text-white shadow-brand' : 'bg-white text-slate-600 border border-slate-200'}`}
                        >
                          Collateral
                        </button>
                      </div>
                      
                      {depositType === 'ALTERNATIVE' && (
                        <div className="mt-3 space-y-3">
                          {listing.depositNote && (
                            <div className="p-3 bg-brand-50 border border-brand-100 rounded-xl">
                              <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest mb-1">Host's Requirement</p>
                              <p className="text-xs text-brand-800 italic">"{listing.depositNote}"</p>
                            </div>
                          )}
                          <textarea 
                            placeholder="What item or document will you provide as collateral?"
                            className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 ring-brand-500 outline-none"
                            rows={2}
                            value={depositNote}
                            onChange={(e) => setDepositNote(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {calculatedDays > 0 && (
                    <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-xl space-y-2">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{calculatedDays} day{calculatedDays > 1 ? 's' : ''} rental</span>
                        <span>Rs {(baseRental / 100).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Platform Service Fee</span>
                        <span>Rs {(platformFee / 100).toFixed(0)}</span>
                      </div>
                      {listing.deposit > 0 && depositType === 'CASH' && (
                        <div className="flex justify-between text-sm text-slate-600 border-t border-brand-100 pt-2">
                          <span>Refundable Deposit</span>
                          <span>Rs {(listing.deposit / 100).toFixed(0)}</span>
                        </div>
                      )}
                      {listing.deposit > 0 && depositType === 'ALTERNATIVE' && (
                        <div className="flex justify-between text-sm text-brand-600 border-t border-brand-100 pt-2 italic">
                          <span>Collateral Security</span>
                          <span>In-Person</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-900 mt-2 border-t border-brand-100 pt-2">
                        <span>Total Due Now</span>
                        <span>Rs {(totalCost / 100).toFixed(0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {hasUnavailableDates && (
                  <div className="rounded-[1.6rem] border border-[rgba(37,52,42,0.08)] bg-[rgba(36,60,45,0.96)] p-4 text-sm text-white">
                    {booked?.bookings?.length > 0 && (
                      <>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/60">Booked windows</p>
                        <div className="space-y-2 text-white/84 mb-4">
                          {booked.bookings.map((range, index) => (
                            <p key={`${range.startDate}-${index}`}>
                              {new Date(range.startDate).toLocaleDateString()} to {new Date(range.endDate).toLocaleDateString()}
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                    {booked?.blockedDates?.length > 0 && (
                      <>
                        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/60">Host Blocked Dates</p>
                        <div className="flex flex-wrap gap-2 text-white/84">
                          {booked.blockedDates.map((date, index) => (
                            <span key={`${date}-${index}`} className="bg-white/10 px-2 py-1 rounded-md text-xs">
                              {new Date(date).toLocaleDateString()}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <Button variant="primary" onClick={book} className="w-full !py-3.5">
                    Book now
                  </Button>
                  <Button variant="secondary" onClick={handleAddToCart} className="w-full !py-3.5">
                    <FiShoppingCart size={16} />
                    Add to cart
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={async () => {
                      if (!user) return router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
                      try {
                        const { data } = await api.post('/chat/threads', { targetUserId: listing.ownerId });
                        router.push(`/chat/${data.id}`);
                      } catch (err) {
                        toast.error('Failed to start chat');
                      }
                    }}
                    className="w-full !py-3.5 flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <FiUser size={16} />
                    Ask the Host
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={async () => {
                      if (!user) return router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
                      try {
                        await api.post(`/listings/${listing.id}/alert`);
                        toast.success("We'll alert you when this gear is free!");
                      } catch (err) {
                        toast.error('Failed to set alert');
                      }
                    }}
                    className="w-full !py-3.5 flex items-center justify-center gap-2 border border-slate-200 bg-brand-50/20 text-brand-700"
                  >
                    <FiBell size={16} />
                    Notify me when free
                  </Button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="rounded-[1.6rem] border border-brand-200 bg-brand-50 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <FiUser size={24} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">This is your listing</h3>
                <p className="mt-2 text-sm text-slate-600">You can manage this item from your dashboard or edit its details here.</p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button href="/listings/new" variant="primary" className="w-full !py-3">
                    Add another item
                  </Button>
                  <Button href={`/listings/edit/${listing.id}`} variant="secondary" className="w-full !py-3">
                    Edit details
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Similar Listings */}
      {listing && (
        <SimilarListings currentListing={listing} user={user} />
      )}

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        type="renter" 
        onAccept={() => {
          setShowTerms(false);
          book();
        }} 
      />

      {/* Mobile Sticky Booking Bar */}
      {!isOwner && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 py-3 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-brand-700">Rs {totalCost > 0 ? (totalCost / 100).toFixed(0) : (listing.pricePerDay / 100).toFixed(0)}<span className="text-xs text-slate-400 font-normal">/day</span></p>
            </div>
            <Button variant="primary" onClick={book} className="!px-6 !py-3 !text-sm">
              Book Now
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function SimilarListings({ currentListing, user }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { data: similar } = useSWR(
    currentListing?.categoryId ? `/listings?categoryId=${currentListing.categoryId}` : null,
    fetcher
  );

  const items = (similar || [])
    .filter(l => l.id !== currentListing.id)
    .slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Similar listings</h2>
        <Link href="/listings" className="text-brand-600 text-sm font-bold hover:underline">View all</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(l => (
          <Link key={l.id} href={`/listings/${l.id}`} className="surface-card group flex h-full flex-col overflow-hidden p-0">
            <div className="relative overflow-hidden">
              {l.images?.[0] ? (
                <img src={l.images[0]} alt={l.title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400">No image</div>
              )}
              <div className="absolute left-3 top-3">
                <span className="label-pill">{l.category?.name || 'Category'}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{l.title}</h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{l.description}</p>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <p className="text-xl font-bold text-brand-700">Rs {(l.pricePerDay / 100).toFixed(0)}/day</p>
                {l.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-amber-600 font-bold">
                    <FiStar size={14} /> {l.averageRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
