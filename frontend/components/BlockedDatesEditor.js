import { useState } from 'react';
import { FiCalendar, FiClock, FiPlus, FiX } from 'react-icons/fi';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatEntry(entry) {
  if (typeof entry === 'string') {
    const d = new Date(entry.length === 10 ? `${entry}T00:00:00` : entry);
    const label = Number.isNaN(d.getTime()) ? entry : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    return { label, sub: DATE_ONLY_RE.test(entry) ? 'All day' : 'All day' };
  }
  const s = new Date(entry.start);
  const e = new Date(entry.end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return { label: 'Invalid range', sub: '' };
  const sameDay = s.toDateString() === e.toDateString();
  const day = s.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const opts = { hour: 'numeric', minute: '2-digit' };
  return {
    label: sameDay ? `${day}` : `${day} → ${e.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
    sub: `${s.toLocaleTimeString(undefined, opts)} – ${e.toLocaleTimeString(undefined, opts)}`,
  };
}

function entryKey(entry) {
  return typeof entry === 'string' ? `d:${entry}` : `r:${entry.start}|${entry.end}`;
}

const toLocalInput = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Shared blocked-dates editor — whole days ("YYYY-MM-DD") and exact
 * datetime ranges ({ start, end }). Used on Your Listings (modal) and
 * the edit-listing form. Entries are saved via PATCH /listings/:id.
 */
export default function BlockedDatesEditor({ value = [], onChange }) {
  const [mode, setMode] = useState('day'); // 'day' | 'range'
  const [day, setDay] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const entries = Array.isArray(value) ? value : [];

  const add = () => {
    setError('');
    if (entries.length >= 60) return setError('Maximum 60 blocked entries allowed.');
    if (mode === 'day') {
      if (!day) return setError('Pick a date first.');
      if (day < today) return setError('Cannot block a past date.');
      const key = `d:${day}`;
      if (entries.some((e) => entryKey(e) === key)) return setError('That date is already blocked.');
      onChange([...entries, day].sort((a, b) => entryKey(a).localeCompare(entryKey(b))));
      setDay('');
    } else {
      if (!start || !end) return setError('Pick both start and end time.');
      const s = new Date(start);
      const e = new Date(end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return setError('Invalid date/time.');
      if (e <= s) return setError('End must be after start.');
      if (s < new Date()) return setError('Cannot block time in the past.');
      const entry = { start: s.toISOString(), end: e.toISOString() };
      if (entries.some((e2) => entryKey(e2) === entryKey(entry))) return setError('That time range is already blocked.');
      onChange([...entries, entry].sort((a, b) => entryKey(a).localeCompare(entryKey(b))));
      setStart('');
      setEnd('');
    }
  };

  const remove = (key) => onChange(entries.filter((e) => entryKey(e) !== key));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100/80">
        {[
          { id: 'day', label: 'Whole day', icon: FiCalendar },
          { id: 'range', label: 'Date & time', icon: FiClock },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-white text-slate-900 shadow' : 'text-slate-500'}`}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'day' ? (
        <div className="flex gap-2">
          <input type="date" className="input" value={day} min={today} onChange={(e) => setDay(e.target.value)} />
          <button type="button" onClick={add} className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition">
            <FiPlus size={15} /> Block
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">From</span>
              <input type="datetime-local" className="input mt-1" value={start} min={toLocalInput()} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">To</span>
              <input type="datetime-local" className="input mt-1" value={end} min={start || toLocalInput()} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <button type="button" onClick={add} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition">
            <FiPlus size={15} /> Block selected hours
          </button>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {entries.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entries.map((entry) => {
            const f = formatEntry(entry);
            return (
              <span key={entryKey(entry)} className="inline-flex items-center gap-2 bg-red-50 text-red-700 pl-3 pr-1.5 py-1.5 rounded-lg border border-red-100 text-sm">
                <span>
                  <span className="font-semibold">{f.label}</span>
                  <span className="block text-[11px] opacity-80">{f.sub}</span>
                </span>
                <button type="button" onClick={() => remove(entryKey(entry))} aria-label="Unblock" className="h-6 w-6 rounded-full hover:bg-red-100 flex items-center justify-center font-bold">
                  <FiX size={13} />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Nothing blocked — renters can book any open dates.</p>
      )}
    </div>
  );
}
