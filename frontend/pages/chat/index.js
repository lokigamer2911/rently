import { FiMessageSquare, FiArrowRight, FiUser } from 'react-icons/fi';
import useSWR from 'swr';
import Link from 'next/link';
import TiltCard from '../../components/TiltCard';
import { fetcher } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function Inbox() {
  const { user } = useAuth();
  const { data: threads } = useSWR('/chat/threads', fetcher);

  if (!user) return <div className="py-20 text-center">Please log in to view your messages</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8 mobile-nav-spacer">
      <header>
        <p className="eyebrow mb-2 sm:mb-3">Messages</p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>Your Inbox</h1>
        <p className="section-copy mt-3 sm:mt-4">Manage your rental conversations.</p>
      </header>

      <div className="surface-card !p-0 overflow-hidden border-2 border-slate-50 shadow-2xl">
        {threads?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {threads.map(t => {
              const other = t.userAId === user.id ? t.userB : t.userA;
              const lastMsg = t.messages[0];

              return (
                <TiltCard key={t.id} max={10} glare={false} className="w-full">
                  <Link 
                    href={`/chat/${t.id}`}
                    className="flex items-center gap-4 p-6 hover:bg-slate-50 transition-all group"
                  >
                  <div className="relative">
                    {other.avatarUrl ? (
                      <img src={other.avatarUrl} alt={other.name} className="w-14 h-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FiUser size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {other.name || 'Anonymous User'}
                    </h3>
                    <p className="text-sm text-slate-500 truncate mt-1">
                      {lastMsg ? lastMsg.content : 'No messages yet. Start the conversation!'}
                    </p>
                  </div>

                  <div className="text-right">
                    <FiArrowRight className="text-slate-200 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                  </Link>
                </TiltCard>
              );
            })}
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <TiltCard max={12} glare={false} className="mx-auto w-fit">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FiMessageSquare size={32} />
              </div>
            </TiltCard>
            <h2 className="text-2xl font-bold text-slate-900">Quiet in here...</h2>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
              When you message a host or receive a rental inquiry, the conversation will appear here.
            </p>
            <Link href="/listings" className="btn-primary inline-flex !py-3 px-8 mt-4">Explore Marketplace</Link>
          </div>
        )}
      </div>
    </div>
  );
}
