import { useState, useEffect } from 'react';
import {
  FiX, FiCamera, FiPackage, FiCheckCircle, FiClock, FiXCircle,
  FiCalendar, FiUser, FiZoomIn, FiChevronLeft, FiChevronRight,
  FiShield, FiTag, FiTruck, FiRefreshCw
} from 'react-icons/fi';
import { api } from '../lib/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_ICONS = {
  LISTED:    { icon: FiTag,        bg: 'from-violet-500 to-purple-600',  light: 'bg-violet-50 text-violet-600',  dot: 'bg-violet-500' },
  BOOKED:    { icon: FiCalendar,   bg: 'from-blue-500 to-indigo-600',    light: 'bg-blue-50 text-blue-600',      dot: 'bg-blue-500' },
  CONFIRMED: { icon: FiCheckCircle,bg: 'from-emerald-500 to-teal-600',   light: 'bg-emerald-50 text-emerald-600',dot: 'bg-emerald-500' },
  PICKUP:    { icon: FiTruck,      bg: 'from-amber-500 to-orange-500',   light: 'bg-amber-50 text-amber-600',    dot: 'bg-amber-500' },
  RETURNED:  { icon: FiRefreshCw,  bg: 'from-rose-500 to-pink-600',      light: 'bg-rose-50 text-rose-600',      dot: 'bg-rose-500' },
};

// ─── Lightbox ───────────────────────────────────────────────────────────────

function Lightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photos, onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Nav arrows */}
        {idx > 0 && (
          <button
            onClick={() => setIdx(i => i - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
          >
            <FiChevronLeft size={24} className="text-white" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button
            onClick={() => setIdx(i => i + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
          >
            <FiChevronRight size={24} className="text-white" />
          </button>
        )}

        <img
          src={photos[idx]}
          alt={`Photo ${idx + 1}`}
          className="max-h-[80vh] max-w-full mx-auto rounded-2xl object-contain shadow-2xl"
        />
        <div className="text-center mt-4 text-white/60 text-sm font-medium">
          {idx + 1} / {photos.length}
        </div>

        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10"
        >
          <FiX size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Photo Grid ─────────────────────────────────────────────────────────────

function PhotoGrid({ photos, label }) {
  const [lightbox, setLightbox] = useState(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
          <FiCamera size={10} />
          {label} · {photos.length} photo{photos.length > 1 ? 's' : ''}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setLightbox(i)}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:scale-[1.03]"
            >
              <img src={url} alt={`Condition ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <FiZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
              </div>
            </button>
          ))}
        </div>
      </div>
      {lightbox !== null && (
        <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

// ─── Signatures ─────────────────────────────────────────────────────────────

function SignaturePanel({ signatures, label }) {
  if (!signatures || (!signatures.renter && !signatures.host)) return null;
  return (
    <div className="mt-4 rounded-2xl bg-slate-950/90 border border-white/5 p-4 space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
        <FiShield size={10} />
        {label} · Verified Signatures
      </p>
      <div className="grid grid-cols-2 gap-3">
        {signatures.renter && (
          <div className="rounded-xl border border-white/8 p-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Renter</p>
            <img src={signatures.renter} alt="Renter sig" className="max-h-14 mx-auto object-contain" />
          </div>
        )}
        {signatures.host && (
          <div className="rounded-xl border border-white/8 p-2 text-center">
            <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Host</p>
            <img src={signatures.host} alt="Host sig" className="max-h-14 mx-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Single Event Card ───────────────────────────────────────────────────────

function EventCard({ event, isLast, index }) {
  const [expanded, setExpanded] = useState(event.status === 'done' && (event.photos?.length > 0 || event.signatures));
  const meta = EVENT_ICONS[event.type] || EVENT_ICONS.LISTED;
  const Icon = meta.icon;
  const isDone = event.status === 'done';
  const isPending = event.status === 'pending';
  const isCancelled = event.status === 'cancelled';

  return (
    <div
      className="relative flex gap-5 group"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Vertical line */}
      {!isLast && (
        <div className="absolute left-[22px] top-[52px] bottom-0 w-[2px] z-0">
          <div
            className={`w-full h-full transition-all duration-700 ${isDone ? 'bg-gradient-to-b from-slate-200 to-slate-100' : 'bg-dashed bg-slate-100'}`}
            style={!isDone ? { backgroundImage: 'repeating-linear-gradient(to bottom, #e2e8f0 0, #e2e8f0 6px, transparent 6px, transparent 12px)' } : {}}
          />
        </div>
      )}

      {/* Icon dot */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${
            isDone
              ? `bg-gradient-to-br ${meta.bg} shadow-lg`
              : isCancelled
              ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-md'
              : 'bg-slate-100 border-2 border-dashed border-slate-200'
          }`}
        >
          {isCancelled
            ? <FiXCircle size={18} className="text-white" />
            : <Icon size={18} className={isDone ? 'text-white' : 'text-slate-400'} />
          }
        </div>
      </div>

      {/* Card content */}
      <div className="flex-1 pb-8">
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            isDone
              ? 'bg-white/90 border-slate-100 shadow-sm hover:shadow-md cursor-pointer'
              : isCancelled
              ? 'bg-red-50/80 border-red-100'
              : 'bg-slate-50/60 border-slate-100 border-dashed'
          }`}
          onClick={() => isDone && setExpanded(e => !e)}
        >
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-sm font-black tracking-tight ${isDone ? 'text-slate-900' : isCancelled ? 'text-red-700' : 'text-slate-400'}`}>
                    {event.label}
                  </h3>
                  {isDone && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.light}`}>
                      Verified
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                      Pending
                    </span>
                  )}
                  {isCancelled && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      Cancelled
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                  {event.description}
                </p>
              </div>

              {/* Timestamp */}
              {event.timestamp && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-slate-700">{fmt(event.timestamp)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fmtTime(event.timestamp)}</p>
                </div>
              )}
            </div>

            {/* Actor chip */}
            {event.actor?.name && (
              <div className="flex items-center gap-2 mt-3">
                <div className={`w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black bg-gradient-to-br ${meta.bg}`}>
                  {event.actor.avatarUrl
                    ? <img src={event.actor.avatarUrl} alt={event.actor.name} className="w-full h-full object-cover" />
                    : event.actor.name?.charAt(0).toUpperCase()
                  }
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  <span className="font-black text-slate-700">{event.actor.name}</span>
                  <span className="mx-1">·</span>
                  {event.actor.role}
                </span>
              </div>
            )}

            {/* Expand hint */}
            {isDone && (event.photos?.length > 0 || event.signatures) && (
              <div className={`text-[10px] font-bold mt-3 flex items-center gap-1 ${meta.light} w-fit px-2 py-1 rounded-full transition-all`}>
                <FiCamera size={10} />
                {event.photos?.length || 0} condition photo{(event.photos?.length || 0) !== 1 ? 's' : ''} · {expanded ? 'collapse' : 'tap to view'}
              </div>
            )}
          </div>

          {/* Expanded section: photos + signatures */}
          {expanded && (
            <div className="px-4 pb-4 space-y-1 border-t border-slate-50 pt-4">
              <PhotoGrid photos={event.photos} label="Condition Photos" />
              <SignaturePanel signatures={event.signatures} label={event.type === 'PICKUP' ? 'Pickup' : 'Return'} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ events }) {
  const doneCount = events.filter(e => e.status === 'done').length;
  const pct = Math.round((doneCount / events.length) * 100);
  const isCancelled = events.some(e => e.status === 'cancelled');

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Rental Progress</span>
        <span className={`text-xs font-black ${isCancelled ? 'text-red-500' : 'text-slate-700'}`}>
          {isCancelled ? 'Cancelled' : `${doneCount}/${events.length} stages complete`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isCancelled
              ? 'bg-gradient-to-r from-red-400 to-red-500'
              : 'bg-gradient-to-r from-violet-500 via-blue-500 via-emerald-500 via-amber-500 to-rose-500'
          }`}
          style={{ width: `${isCancelled ? 40 : pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ConditionTimeline({ bookingId, listingTitle, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) return;

    let isActive = true;
    setLoading(true);

    const loadTimeline = async () => {
      try {
        const { data: accessData } = await api.post(`/bookings/${bookingId}/access`);
        const accessToken = accessData.accessToken;
        const timelineUrl = accessToken
          ? `/bookings/${bookingId}/timeline?access=${encodeURIComponent(accessToken)}`
          : `/bookings/${bookingId}/timeline`;

        const r = await api.get(timelineUrl);
        if (!isActive) return;
        setData(r.data);
        setLoading(false);
      } catch (err) {
        if (!isActive) return;
        setError(err.response?.data?.error || 'Failed to load timeline');
        setLoading(false);
      }
    };

    loadTimeline();
    return () => { isActive = false; };
  }, [bookingId]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-lg p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-[2rem] overflow-hidden shadow-2xl"
        style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.7)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 px-7 pt-7 pb-5"
          style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}
        >
          {/* Decorative gradient bar */}
          <div className="h-1 w-24 rounded-full mb-5 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Item Condition Timeline</p>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">
                {data?.listingTitle || listingTitle || 'Rental'}
              </h2>
              {data && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <FiCalendar size={11} />
                  {fmt(data.startDate)} — {fmt(data.endDate)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              id="timeline-close-btn"
              className="flex-shrink-0 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all"
            >
              <FiX size={20} className="text-slate-400" />
            </button>
          </div>

          {data && (
            <div className="mt-5">
              <ProgressBar events={data.events} />
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-7 pt-7 pb-4 scroll-smooth">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center animate-pulse">
                <FiClock size={22} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Loading timeline…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <FiXCircle size={22} className="text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
          )}

          {data && (
            <div className="relative">
              {data.events.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  isLast={i === data.events.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 px-7 py-5"
          style={{ borderTop: '1px solid rgba(15,23,42,0.06)' }}
        >
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            📸 This timeline is a tamper-evident record of the item's condition at each stage of the rental. It can be used to resolve any disputes.
          </p>
        </div>
      </div>
    </div>
  );
}
