import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { FiSend, FiArrowLeft, FiUser, FiInfo } from 'react-icons/fi';
import useSWR from 'swr';
import { fetcher, api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { getSocket, disconnectSocket } from '../../lib/socket';
import Link from 'next/link';

export default function Conversation() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { data: thread, mutate } = useSWR(id && `/chat/threads/${id}`, fetcher);
  
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [socket, setSocket] = useState(null);
  const scrollRef = useRef();

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync SWR data to local state
  useEffect(() => {
    if (thread?.messages) setMessages(thread.messages);
  }, [thread]);

  // Initialize Socket.io
  useEffect(() => {
    if (!user || !id) return;
    const s = getSocket();

    const onConnect = () => {
      console.debug('[chat] socket connected', s.id);
    };

    const onConnectError = (err) => {
      console.error('[chat] socket connect_error', err.message || err);
    };

    const onError = (err) => {
      console.error('[chat] socket error', err);
    };

    const onMessage = (msg) => {
      if (msg.threadId === id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    s.on('connect', onConnect);
    s.on('connect_error', onConnectError);
    s.on('error', onError);
    s.on('message:recv', onMessage);

    setSocket(s);
    return () => {
      s.off('connect', onConnect);
      s.off('connect_error', onConnectError);
      s.off('error', onError);
      s.off('message:recv', onMessage);
      // Do NOT call disconnectSocket() here — reuse the singleton
      // across page navigations. Only disconnect on full unmount.
    };
  }, [id, user]);

  const send = (e) => {
    e.preventDefault();
    if (!content.trim() || !socket) return;

    socket.emit('message:send', { threadId: id, content }, (res) => {
      if (res.ok) {
        setContent('');
        // Local update handled by message:recv coming back to us
      }
    });
  };

  if (!thread || !user) return <div className="py-20 text-center animate-pulse">Establishing secure connection...</div>;

  const otherUser = thread.userAId === user.id ? thread.userB : thread.userA;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] flex flex-col">
      {/* Chat Header */}
      <div className="surface-card !p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="btn-ghost !p-2">
            <FiArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            {otherUser.avatarUrl ? (
              <img src={otherUser.avatarUrl} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <FiUser size={20} />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 leading-none">{otherUser.name}</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active now
              </p>
            </div>
          </div>
        </div>
        <button className="btn-ghost !p-2 text-slate-400">
          <FiInfo size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 scroll-smooth">
        <div className="text-center py-4">
           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full">Conversation Started</span>
        </div>
        
        {messages.map((m, idx) => {
          const isMe = m.senderId === user.id;
          return (
            <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-5 py-3.5 rounded-[1.6rem] text-sm shadow-soft ${
                isMe 
                ? 'bg-brand-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                {m.content}
                <div className={`text-[10px] mt-1.5 font-medium opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={send} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
        <input 
          className="input !bg-slate-50 !border-none !rounded-2xl !py-3.5"
          placeholder="Type your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button 
          type="submit"
          disabled={!content.trim()}
          className="btn-primary !p-4 !rounded-2xl shadow-brand disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
}
