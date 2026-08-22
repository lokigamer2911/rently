import { useState } from 'react';
import useSWR from 'swr';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiCalendar, 
  FiArrowUpRight, 
  FiPackage, 
  FiClock,
  FiArrowLeft,
  FiShield
} from 'react-icons/fi';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { fetcher } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import TiltCard from '../components/TiltCard';
import Button from '../components/Button';

export default function EarningsDashboard() {
  const { user } = useAuth();
  const { data: earnings, error } = useSWR('/listings/earnings/me', fetcher);

  if (!user) return <div className="py-20 text-center">Please log in to view your earnings</div>;
  if (error) return <div className="py-20 text-center text-red-500">Failed to load earnings data</div>;
  if (!earnings) return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="h-32 bg-slate-100 rounded-[2rem]" />
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="h-40 bg-slate-100 rounded-[2rem]" />
        <div className="h-40 bg-slate-100 rounded-[2rem]" />
        <div className="h-40 bg-slate-100 rounded-[2rem]" />
      </div>
      <div className="h-96 bg-slate-100 rounded-[2rem]" />
    </div>
  );

  const { summary, chartData, topItems } = earnings;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link href="/dashboard" className="btn-ghost !p-0 mb-4 inline-flex items-center gap-2 text-slate-400 hover:text-slate-600">
            <FiArrowLeft size={16} />
            Back to Command Center
          </Link>
          <p className="eyebrow mb-3">Revenue Analytics</p>
          <h1 className="section-title text-5xl">Earnings Dashboard</h1>
          <p className="section-copy mt-4">Deep insights into your rental business and revenue performance.</p>
        </div>
        <div className="flex gap-3">
          <div className="surface-card !py-3 !px-5 flex items-center gap-3 border border-emerald-100 bg-emerald-50/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <TiltCard max={7} className="h-full">
          <div className="surface-card !bg-brand-700 text-white shadow-brand-lg relative overflow-hidden h-full">
            <div className="absolute -right-4 -top-4 opacity-10">
              <FiTrendingUp size={120} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Total Revenue</p>
            <div className="mt-6 pop-layer">
               <span className="text-5xl font-bold">Rs {(summary.totalRevenue / 100).toLocaleString()}</span>
            </div>
            <p className="mt-4 text-xs opacity-60 flex items-center gap-2">
              <FiPackage />
              From {summary.bookingCount} successful rentals
            </p>
          </div>
        </TiltCard>

        <TiltCard max={7} className="h-full">
          <div className="surface-card border-slate-100 h-full">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Available for Payout</p>
            <div className="mt-6 pop-layer">
               <span className="text-4xl font-bold text-slate-900">Rs {(summary.completedRevenue / 100).toLocaleString()}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
              <FiClock />
              Ready for withdrawal
            </div>
          </div>
        </TiltCard>

        <TiltCard max={7} className="h-full">
          <div className="surface-card border-slate-100 h-full">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Escrow / Pending</p>
            <div className="mt-6 pop-layer">
               <span className="text-4xl font-bold text-slate-900">Rs {(summary.pendingRevenue / 100).toLocaleString()}</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">Locked until rentals are completed</p>
          </div>
        </TiltCard>
      </div>

      {/* Chart Section */}
      <section className="surface-card">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Growth Trends</h2>
            <p className="text-sm text-slate-500 mt-1">Earnings over the last 6 months</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="w-3 h-3 bg-brand-500 rounded-sm" />
            Revenue (Rs)
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25342a" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#25342a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Earnings']}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#25342a" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Item Performance */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="surface-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Top Performing Gear</h2>
            <FiArrowUpRight className="text-slate-400" size={20} />
          </div>
          
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 hover:border-brand-100 transition-colors bg-white/50">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.bookings} rentals booked</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-700">Rs {(item.revenue / 100).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Total</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-6">Payout Information</p>
            <h2 className="text-3xl font-bold mb-4">Withdrawal Policy</h2>
            <div className="space-y-6 mt-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <FiClock className="text-brand-300" />
                </div>
                <div>
                  <p className="font-bold">Next Payout Schedule</p>
                  <p className="text-sm text-white/60 mt-1">Earnings are automatically disbursed every Monday for all completed rentals from the previous week.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <FiShield className="text-brand-300" />
                </div>
                <div>
                  <p className="font-bold">Security & Protection</p>
                  <p className="text-sm text-white/60 mt-1">Rentrex holds payments in escrow until the renter returns the item, ensuring both parties are protected.</p>
                </div>
              </div>
              <Button variant="primary" className="w-full !bg-white !text-slate-900 hover:!bg-brand-50 !py-4 mt-4 shadow-none">
                Update Payout Method
              </Button>
            </div>
          </div>
          <div className="absolute right-[-20%] bottom-[-10%] w-[300px] h-[300px] bg-brand-500/20 rounded-full blur-[100px]" />
        </div>
      </section>
    </div>
  );
}


