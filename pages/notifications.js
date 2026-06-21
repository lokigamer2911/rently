import { FiBell, FiCheck, FiMessageCircle, FiPackage, FiZap, FiInfo, FiChevronRight } from 'react-icons/fi';
import useSWR from 'swr';
import Link from 'next/link';
import TiltCard from '../components/TiltCard';
import { fetcher, api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { user } = useAuth();
  const { data: notifications, mutate } = useSWR(user ? '/notifications' : null, fetcher);

  const markRead = async (id, link) => {
    try {
      await api.post(`/notifications/${id}/read`);
      mutate();
    } catch (err) {}
  };

  if (!user) return <div className="py-20 text-center">Please log in to view notifications</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow mb-3">Activity Feed</p>
          <h1 className="section-title text-5xl">Alerts</h1>
          <p className="section-copy mt-4">Stay updated on your rental requests and messages.</p>
        </div>
      </header>

      <div className="surface-card !p-0 overflow-hidden border-2 border-slate-50 shadow-2xl">
        {notifications?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <TiltCard key={n.id} max={10} glare={false} className="w-full">
                <Link 
                  href={n.link || '#'} 
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 p-6 hover:bg-slate-50 transition-all group ${!n.read ? 'bg-brand-50/20' : ''}`}
                >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === 'BOOKING_REQUEST' ? 'bg-amber-100 text-amber-600' :
                  n.type === 'BOOKING_UPDATE' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {n.type === 'BOOKING_REQUEST' ? <FiPackage size={20} /> :
                   n.type === 'BOOKING_UPDATE' ? <FiCheck size={20} /> :
                   <FiBell size={20} />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className={`text-lg ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                      {n.title}
                    </h4>
                    {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{n.body}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <FiChevronRight className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all mt-1" size={20} />
              </Link>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="p-24 text-center space-y-4">
            <TiltCard max={12} glare={false} className="mx-auto w-fit">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FiBell size={32} />
              </div>
            </TiltCard>
            <h2 className="text-2xl font-bold text-slate-900">All caught up!</h2>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
              New alerts about your rentals and messages will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
