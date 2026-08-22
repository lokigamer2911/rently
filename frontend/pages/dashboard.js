import { FiDollarSign, FiPackage, FiActivity, FiArrowRight, FiUser, FiPlus, FiStar } from 'react-icons/fi';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import TiltCard from '../components/TiltCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useSWR('/listings/stats/me', fetcher);
  const { data: myListings } = useSWR('/listings/user/me', fetcher);

  if (!user) return <div className="py-20 text-center">Please log in to view your dashboard</div>;
  if (!stats) return <div className="py-20 text-center animate-pulse">Loading your business metrics...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Host Command Center</p>
          <h1 className="section-title text-5xl">Welcome back, {user.name?.split(' ')[0]}</h1>
          <p className="section-copy mt-4">Monitor your rental performance and manage your growing inventory.</p>
        </div>
        <Button href="/listings/new" variant="primary" className="!py-4 px-8 shadow-brand flex items-center gap-2">
          <FiPlus size={20} />
          List New Item
        </Button>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <TiltCard max={7} className="h-full">
          <div className="surface-card !bg-brand-600 text-white h-full">
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">Total Earnings</p>
            <div className="mt-4 flex items-baseline gap-2 pop-layer">
              <span className="text-4xl font-bold">Rs {(stats.totalEarnings / 100).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-xs opacity-60">Lifetime revenue generated</p>
            <Link href="/earnings" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              View Detailed Report
              <FiArrowRight size={12} />
            </Link>
          </div>
        </TiltCard>

        <TiltCard max={7} className="h-full">
          <div className="surface-card h-full">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Active Rentals</p>
            <div className="mt-4 flex items-center gap-3 pop-layer">
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FiActivity size={20} />
               </div>
               <span className="text-3xl font-bold text-slate-900">{stats.activeRentalsCount}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Items currently with renters</p>
          </div>
        </TiltCard>

        <TiltCard max={7} className="h-full">
          <div className="surface-card h-full">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Listings</p>
            <div className="mt-4 flex items-center gap-3 pop-layer">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                  <FiPackage size={20} />
               </div>
               <span className="text-3xl font-bold text-slate-900">{stats.totalListings}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Inventory live on marketplace</p>
          </div>
        </TiltCard>

        <TiltCard max={7} className="h-full">
          <div className="surface-card h-full">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Trust Score</p>
            <div className="mt-4 flex items-center gap-3 pop-layer">
               <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <FiStar size={20} />
               </div>
               <span className="text-3xl font-bold text-slate-900">{stats.averageRating ? `${stats.averageRating.toFixed(1)}★` : '—'}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{stats.reviewCount ? `From ${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'}` : 'No reviews yet'}</p>
          </div>
        </TiltCard>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
        {/* Main Content: Recent Bookings */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Recent Incoming Bookings</h2>
            <Link href="/bookings" className="text-brand-600 text-sm font-bold hover:underline">View All</Link>
          </div>

          <div className="surface-card !p-0 overflow-hidden border-2 border-slate-50">
            {stats.incomingBookings?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.incomingBookings.map(b => (
                  <div key={b.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <img 
                      src={b.listing.images?.[0] || 'https://via.placeholder.com/150'} 
                      alt={b.listing.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-100" 
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{b.listing.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Rented by <span className="font-semibold text-slate-700">{b.renter.name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">Rs {(b.totalAmount / 100).toLocaleString()}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full mt-2 inline-block ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-slate-400">
                No bookings yet. Try optimizing your listing photos!
              </div>
            )}
          </div>
        </section>

        {/* Sidebar: My Listings */}
        <aside className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Inventory</h2>
          <div className="space-y-3">
            {myListings?.slice(0, 5).map(l => (
              <div key={l.id} className="surface-card !p-3 flex items-center gap-3 border border-slate-100 hover:border-brand-200 transition-colors">
                 <img src={l.images[0]} alt={l.title} className="w-12 h-12 rounded-xl object-cover" />
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{l.title}</p>
                    <p className="text-xs text-brand-600 font-bold">Rs {(l.pricePerDay / 100)} Price Per Day</p>
                 </div>
              </div>
            ))}
            <Button href="/listings/mine" variant="ghost" className="w-full !py-3 flex items-center justify-center gap-2 border border-slate-200">
              Manage All Items
              <FiArrowRight size={16} />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
