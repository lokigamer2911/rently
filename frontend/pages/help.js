import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageCircle, FiShield, FiPackage, FiCreditCard, FiZap, FiDownload, FiActivity, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import Button from '../components/Button';
import TiltCard from '../components/TiltCard';

const KNOWLEDGE_BASE = [
  {
    keywords: ['hello', 'hi', 'hey', 'help', 'who are you'],
    response: "Hey there! I'm Rentie, your personal Rentrex concierge. 👋 I'm here to help you navigate the marketplace, explain our security systems, or help you start your hosting business. What's on your mind?"
  },
  {
    keywords: ['rent', 'how', 'booking', 'start', 'process'],
    response: "Renting on Rently is designed to be as simple as premium shopping. 🛍️ Just browse the 'Discover' page, select your dates, and proceed to checkout.",
    actions: [{ label: 'Explore Marketplace', href: '/listings' }]
  },
  {
    keywords: ['return', 'back', 'finish', 'end rental', 'done'],
    response: "Ready to return? 🔄 Just meet the host. They will ask you for a **Return OTP** (found in your dashboard). Once verified, your deposit is released!",
    actions: [{ label: 'View Return OTP', href: '/bookings' }]
  },
  {
    keywords: ['host', 'list', 'earn', 'item', 'upload', 'make money'],
    response: "List your gear and start earning today! 💰 Our hosting flow lets you set your own prices and track everything in your dashboard.",
    actions: [{ label: 'Start Hosting', href: '/listings/new' }]
  },
  {
    keywords: ['otp', 'code', 'pin', 'verification code', 'handover'],
    response: "Your secure codes are your protection! 🔑 You can find your **Pickup OTP** and **Return OTP** in your Bookings Dashboard.",
    actions: [{ label: 'My OTPs', href: '/bookings' }]
  },
  {
    keywords: ['late', 'overdue', 'delay', 'extended'],
    response: "Running late? ⏰ It happens! Best first step is to message the host directly via chat. They might charge a small daily fee. If you need a formal extension, you'll need to book the item again for those extra days if available.",
    actions: [{ label: 'Open Chats', href: '/chat' }]
  },
  {
    keywords: ['digilocker', 'verify', 'verification', 'id', 'safety', 'secure', 'trust'],
    response: "We take safety seriously. 🛡️ Our DigiLocker integration verifies your identity via official records in seconds. This creates a high-trust environment where owners feel safe sharing gear. You only need to verify once!"
  },
  {
    keywords: ['pay', 'payment', 'razorpay', 'money', 'deposit', 'security', 'cash', 'collateral', 'id proof'],
    response: "We've reinvented rental security! 💳 Choose between a standard Cash Deposit or 'Alternative Security' (Collateral). Collateral allows you to keep a physical ID as security instead of blocking cash."
  },
  {
    keywords: ['agreement', 'legal', 'pdf', 'contract', 'safety', 'insurance', 'damage'],
    response: "Every rental is protected by a legally-binding Digital Agreement. 📄 Once confirmed, we generate a PDF contract with verified info. Download these from your 'Bookings' page!"
  },
  {
    keywords: ['chat', 'message', 'ask host', 'contact', 'talk', 'real-time'],
    response: "Our real-time P2P chat keeps you connected. 💬 Tap 'Ask the Host' on any listing to clarify gear specs. It's built for speed, so you'll get notified instantly!"
  },
  {
    keywords: ['otp', 'code', 'pin', 'verification code', 'handover'],
    response: "Your secure codes are your protection! 🔑 You can find your **Pickup OTP** and **Return OTP** in your Bookings Dashboard under the specific order. Never share these over chat.",
    actions: [{ label: 'My OTPs', href: '/bookings' }]
  },
  {
    keywords: ['cancel', 'refund', 'money back', 'abort'],
    response: "Need to cancel? 🚫 Do this from the 'Bookings' page. If the host hasn't confirmed, it's instant. If confirmed, a refund (minus service fees) is processed automatically.",
    actions: [{ label: 'Manage Bookings', href: '/bookings' }]
  }
];

const DEFAULT_SUGGESTIONS = [
  "How do I return items?",
  "Where is my OTP?",
  "Explain Security Collateral",
  "How to earn as a Host?",
  "What if I'm late?"
];

export default function Help() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'bot', content: `Greetings ${user?.name || 'there'}! I'm Rentrexie. 🤖 I've been upgraded with full knowledge of our new Real-time Chat, Digital Agreements, and Security Collateral systems. How can I assist your journey today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getResponse = (query) => {
    const q = query.toLowerCase();
    let bestMatch = null;
    let maxHits = 0;

    for (const item of KNOWLEDGE_BASE) {
      const hits = item.keywords.filter(k => q.includes(k)).length;
      if (hits > maxHits) {
        maxHits = hits;
        bestMatch = item;
      }
    }

    return bestMatch || {
      response: "That's a great question! I'm still learning some of the finer details, but I can definitely tell you all about our 'Security Collateral', 'DigiLocker verification', or how to 'List your gear'. Which one interests you?",
      actions: [{ label: 'View All Help', href: '/help' }]
    };
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const result = getResponse(text);
      setMessages(prev => [...prev, { role: 'bot', content: result.response, actions: result.actions }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleTalkToHuman = async () => {
    if (!user) {
      toast.error('Please sign in to contact support');
      return router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
    }

    try {
      toast.loading('Connecting you to a support specialist...', { id: 'support' });
      const { data: admin } = await api.get('/chat/support-admin');
      const { data: thread } = await api.post('/chat/threads', { targetUserId: admin.id });

      toast.success('Connected! Redirecting...', { id: 'support' });
      router.push(`/chat/${thread.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'All support staff are currently busy. Please try again in a moment.', { id: 'support' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
          <FiShield size={14} />
          Smart Support Assistant
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">Rently Support. <span className="text-brand-600 italic">Simplified.</span></h1>
        <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
          Ask Rentie about legal agreements, security collateral, or your hosting earnings.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm uppercase tracking-widest font-bold text-slate-400">Quick Guides</h2>
            <div className="grid gap-3">
              {[
                { icon: <FiDownload className="text-brand-600" />, title: "Agreement PDF Guide", bg: "bg-brand-50" },
                { icon: <FiShield className="text-blue-600" />, title: "DigiLocker Safety", bg: "bg-blue-50" },
                { icon: <FiActivity className="text-emerald-600" />, title: "Earnings Dashboard", bg: "bg-emerald-50" }
              ].map((item, i) => (
                <TiltCard key={i} max={10} glare={false} className="h-full">
                  <div className="surface-card !p-5 flex items-center gap-4 hover:translate-x-2 transition-transform cursor-pointer border border-slate-100 shadow-sm">
                    <div className={`h-12 w-12 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="font-bold text-slate-800">{item.title}</span>
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>

          <TiltCard max={10} glare={false} className="h-full">
            <div className="surface-card !bg-brand-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">Complex Issue?</h3>
                <p className="text-brand-200 text-sm mb-6 leading-relaxed">Our legal and support experts can help with specific rental disputes or security questions.</p>
                <Button
                  variant="secondary"
                  onClick={handleTalkToHuman}
                  className="bg-white text-brand-900 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
                >
                Talk to a Human
                <FiArrowRight size={16} />
              </Button>
            </div>
          </div>
          </TiltCard>
        </div>

        <div className="flex flex-col h-[650px] surface-card !p-0 overflow-hidden shadow-2xl border-none">
          <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 bg-white overflow-hidden rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  <img src="/logo.png" alt="Rentrexie" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900">Rentrexie</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Smart AI</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Always Online</span>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                  {m.content}
                  {m.actions?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {m.actions.map((act, idx) => (
                        <Button
                          key={idx}
                          variant="secondary"
                          onClick={() => router.push(act.href)}
                          className="!py-1.5 !px-3 !text-[11px] !bg-brand-50 !text-brand-700 border-brand-100 font-bold"
                        >
                          {act.label}
                          <FiArrowRight size={12} />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 flex gap-1.5 items-center">
                  <div className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-1.5 w-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50/30">
            {DEFAULT_SUGGESTIONS.map((s, i) => (
              <Button
                key={i}
                variant="secondary"
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-4 py-2 !rounded-full !text-xs !bg-white hover:!bg-brand-50"
              >
                {s}
              </Button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); setInput(''); }} className="p-6 bg-white border-t border-slate-100 flex gap-4">
            <input
              className="input !bg-slate-50 !border-none !py-5"
              placeholder="Ask Rentie anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" variant="primary" className="!h-14 !w-14 !rounded-2xl shrink-0 shadow-lg !p-0">
              <FiSend size={20} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
