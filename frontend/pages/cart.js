import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiTrash2, FiShoppingCart, FiShield, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import Button from '../components/Button';
import TermsModal from '../components/TermsModal';
import TiltCard from '../components/TiltCard';
import UpiPaymentModal from '../components/UpiPaymentModal';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [bookingDates, setBookingDates] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Payment mode is decided by the backend so the gateway can be switched on
  // with an env var, with no frontend deploy.
  const [upiIntent, setUpiIntent] = useState(null);
  const [upiOpen, setUpiOpen] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(null);
  const upiResolverRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/payments/config')
      .then(({ data }) => { if (!cancelled) setRazorpayEnabled(Boolean(data.razorpayEnabled)); })
      .catch(() => { if (!cancelled) setRazorpayEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  /**
   * Show the UPI QR modal for one booking and settle once the renter has either
   * been verified or dismissed it. Resolves false when they walked away, so the
   * caller can leave the booking pending instead of marking it paid.
   */
  const payViaUpi = (intent) => new Promise((resolve) => {
    upiResolverRef.current = resolve;
    setUpiIntent(intent);
    setUpiOpen(true);
  });

  const closeUpiModal = (verified) => {
    setUpiOpen(false);
    setUpiIntent(null);
    const resolve = upiResolverRef.current;
    upiResolverRef.current = null;
    resolve?.(verified);
  };

  const getLocalDatetime = (date = new Date()) => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const todayTime = getLocalDatetime();

  const handleDateChange = (id, field, value) => {
    setBookingDates((prev) => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        [field]: value,
        depositType: prev[id]?.depositType || 'CASH'
      },
    }));
  };

  const handleDepositChange = (id, type, note) => {
    setBookingDates((prev) => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        depositType: type !== undefined ? type : prev[id]?.depositType,
        depositNote: note !== undefined ? note : prev[id]?.depositNote
      },
    }));
  };

  const hasValidDateRange = (dates) => dates?.start && dates?.end && new Date(dates.end) > new Date(dates.start);

  const openCheckout = (item, order) => new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Rentrex',
      description: item.title,
      handler: async (resp) => {
        try {
          await api.post('/payments/verify', resp);
          toast.success(`Payment successful for ${item.title}`);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error(`Checkout cancelled for ${item.title}`)),
      },
    });

    rzp.open();
  });

  const proceedToCheckout = async () => {
    if (!user) {
      toast.error('Please sign in before checkout');
      router.push('/auth/login?redirect=/cart');
      return;
    }

    const ownedItem = cart.find((item) => user && (user.id === item.ownerId || user.id === item.owner?.id));
    if (ownedItem) {
      toast.error(`You cannot rent your own item: ${ownedItem.title}`);
      return;
    }

    const missingDatesItem = cart.find((item) => !bookingDates[item.id]?.start || !bookingDates[item.id]?.end);
    if (missingDatesItem) {
      toast.error(`Please select dates for ${missingDatesItem.title}`);
      return;
    }

    const invalidDatesItem = cart.find((item) => !hasValidDateRange(bookingDates[item.id]));
    if (invalidDatesItem) {
      toast.error(`Please choose a valid date range for ${invalidDatesItem.title}`);
      return;
    }

    // Razorpay checkout.js is only needed when the gateway is actually live.
    if (razorpayEnabled && (typeof window === 'undefined' || !window.Razorpay)) {
      toast.error('Payment gateway is still loading. Please try again.');
      return;
    }

    if (!showTerms) {
      setShowTerms(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const paidItems = [];
      for (const item of cart) {
        const dates = bookingDates[item.id];
        const { data: booking } = await api.post('/bookings', {
          listingId: item.id,
          startDate: dates.start,
          endDate: dates.end,
          depositType: dates.depositType || 'CASH',
          depositNote: dates.depositNote || '',
        });

        if (razorpayEnabled) {
          const { data: order } = await api.post('/payments/order', { bookingId: booking.id });
          await openCheckout(item, order);
          paidItems.push(item.id);
          continue;
        }

        const { data: intent } = await api.post('/payments/upi/intent', { bookingId: booking.id });
        if (intent.alreadyPaid) {
          paidItems.push(item.id);
          continue;
        }

        const verified = await payViaUpi(intent);
        if (!verified) {
          // Booking is saved and sits as payment-pending — let them finish later.
          toast(
            `${item.title} is booked, but payment is still pending. You can finish it any time from My Bookings.`,
            { icon: '⏳', duration: 7000 },
          );
          break;
        }
        paidItems.push(item.id);
      }

      paidItems.forEach((id) => removeFromCart(id));
      if (paidItems.length) router.push('/bookings');
    } catch (e) {
      const message = e.response?.data?.error || e.message || 'Checkout failed';
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const { rentalTotal, feeTotal, depositTotal } = cart.reduce((acc, item) => {
    const dates = bookingDates[item.id];
    if (hasValidDateRange(dates)) {
      const days = Math.ceil((new Date(dates.end) - new Date(dates.start)) / 86400000);
      const itemRental = (item.pricePerDay * days);
      const itemFee = Math.round(itemRental * 0.05);
      const itemDeposit = (dates.depositType === 'CASH' || !dates.depositType) ? item.deposit : 0;
      
      acc.rentalTotal += itemRental / 100;
      acc.feeTotal += itemFee / 100;
      acc.depositTotal += itemDeposit / 100;
    }
    return acc;
  }, { rentalTotal: 0, feeTotal: 0, depositTotal: 0 });

  const totalPrice = rentalTotal + feeTotal + depositTotal;

  if (cart.length === 0) {
    return (
      <div className="text-center py-16">
        <TiltCard max={12} glare={false} className="mx-auto w-fit">
          <div className="reveal-3d mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-slate-100 pop-layer">
            <FiShoppingCart size={56} className="text-slate-300" />
          </div>
        </TiltCard>
        <h1 className="text-2xl font-bold mb-2 mt-6">Your cart is empty</h1>
        <p className="text-slate-600 mb-6">Add some items to get started</p>
        <Link href="/listings" className="btn-primary">Browse listings</Link>
      </div>
    );
  }

  return (
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <div className="max-w-4xl mx-auto mobile-nav-spacer">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Your Cart</h1>
        <div className="space-y-3 sm:space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="card flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 shrink-0">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                  {user && (user.id === item.ownerId || user.id === item.owner?.id) ? (
                    <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-wider">Your listing</p>
                  ) : (
                    <p className="text-slate-600 text-xs sm:text-sm">Rs {(item.pricePerDay / 100).toFixed(0)}/day</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:flex-1">
                <input
                  type="datetime-local"
                  className="input text-xs sm:text-sm"
                  min={todayTime}
                  value={bookingDates[item.id]?.start || ''}
                  onChange={(e) => handleDateChange(item.id, 'start', e.target.value)}
                />
                <input
                  type="datetime-local"
                  className="input text-xs sm:text-sm"
                  min={bookingDates[item.id]?.start || todayTime}
                  value={bookingDates[item.id]?.end || ''}
                  onChange={(e) => handleDateChange(item.id, 'end', e.target.value)}
                />
                
                {item.deposit > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <button 
                        onClick={() => handleDepositChange(item.id, 'CASH')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${(!bookingDates[item.id]?.depositType || bookingDates[item.id]?.depositType === 'CASH') ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}
                      >
                        Cash
                      </button>
                      <button 
                        onClick={() => handleDepositChange(item.id, 'ALTERNATIVE')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${bookingDates[item.id]?.depositType === 'ALTERNATIVE' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}
                      >
                        Collateral
                      </button>
                    </div>
                    {bookingDates[item.id]?.depositType === 'ALTERNATIVE' && (
                      <textarea 
                        placeholder="Collateral description..."
                        className="w-full p-2 rounded-lg border border-slate-200 text-[10px] bg-white outline-none focus:ring-1 ring-brand-500"
                        rows={1}
                        value={bookingDates[item.id]?.depositNote || ''}
                        onChange={(e) => handleDepositChange(item.id, undefined, e.target.value)}
                      />
                    )}
                  </div>
                )}

                {bookingDates[item.id]?.start && bookingDates[item.id]?.end && new Date(bookingDates[item.id].end) > new Date(bookingDates[item.id].start) && (
                  <p className="text-xs text-brand-600 font-bold mt-2">
                    {Math.ceil((new Date(bookingDates[item.id].end) - new Date(bookingDates[item.id].start)) / 86400000)} day(s) calculated
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => removeFromCart(item.id)}
                className="!p-2 text-red-500 hover:bg-red-50 !rounded"
                type="button"
              >
                <FiTrash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 card space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-[1.2rem] p-4 flex items-center gap-3">
            <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
              <FiShield size={16} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-amber-900 uppercase tracking-wider">KYC temporarily disabled</p>
              <p className="text-amber-700 mt-0.5">Identity verification is not in use right now, so checkout stays available for all users.</p>
            </div>
          </div>

          {razorpayEnabled === false && (
            <div className="bg-amber-50 border border-amber-100 rounded-[1.2rem] p-4 flex items-center gap-3">
              <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                <FiCreditCard size={16} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900 uppercase tracking-wider">Razorpay integration is in progress</p>
                <p className="text-amber-700 mt-0.5">
                  Card and netbanking checkout is coming soon. Pay to our UPI QR code instead — your booking is
                  confirmed as soon as the payment is verified.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Rental Subtotal</span>
              <span>Rs {rentalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Platform Service Fees</span>
              <span>Rs {feeTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Security Deposits</span>
              <span>Rs {depositTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 pt-2">
            <span className="text-xl font-bold">Total Amount: Rs {totalPrice.toFixed(2)}</span>
            <Button variant="ghost" onClick={clearCart} className="text-red-600" disabled={isCheckingOut} type="button">
              Clear Cart
            </Button>
          </div>
          <Button 
            variant="primary"
            onClick={proceedToCheckout} 
            className="w-full"
            disabled={isCheckingOut} 
            type="button"
          >
            {isCheckingOut
              ? 'Processing...'
              : razorpayEnabled === false
                ? `Pay Rs ${totalPrice.toFixed(2)} via UPI QR`
                : 'Proceed to Checkout'}
          </Button>
        </div>
      </div>

      <TermsModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        type="renter" 
        onAccept={() => {
          setShowTerms(false);
          proceedToCheckout();
        }} 
      />

      <UpiPaymentModal
        isOpen={upiOpen}
        intent={upiIntent}
        onClose={() => closeUpiModal(false)}
        onVerified={() => closeUpiModal(true)}
      />
    </>
  );
}
