import { useState, useEffect } from 'react';
import { FiCalendar, FiX, FiCheck } from 'react-icons/fi';

/**
 * AvailabilityCalendar — visual calendar showing available/blocked/booked dates.
 * - Green dots = available
 * - Red dots = blocked by host
 * - Gray dots = already booked
 * - Clicking a date selects it as start or end of booking range
 */
export default function AvailabilityCalendar({
  blockedDates = [],
  bookedDates = [],
  selectedStart,
  selectedEnd,
  onDateSelect,
  today = new Date(),
}) {
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null);

  // Parse blocked dates (YYYY-MM-DD or ISO datetime strings)
  const blockedSet = new Set(
    blockedDates
      .filter(Boolean)
      .map(d => {
        try {
          const date = new Date(d);
          return date.toISOString().split('T')[0];
        } catch { return null; }
      })
      .filter(Boolean)
  );

  // Parse booked date ranges into individual blocked dates
  const bookedSet = new Set();
  bookedDates.forEach(booking => {
    try {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      let current = new Date(start);
      while (current <= end) {
        bookedSet.add(current.toISOString().split('T')[0]);
        current = new Date(current.getTime() + 86400000);
      }
    } catch {}
  });

  const isSelected = (dateStr) => dateStr === selectedStart || dateStr === selectedEnd;
  const isInRange = (dateStr) => {
    if (!selectedStart || !selectedEnd) return false;
    const d = new Date(dateStr);
    return d > new Date(selectedStart) && d < new Date(selectedEnd);
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const prevMonthDays = daysInMonth(year, month === 0 ? 11 : month - 1);

  // Build calendar grid
  const calendarDays = [];
  // Previous month tail
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month === 0 ? 11 : month - 1, prevMonthDays - i);
    calendarDays.push({ ...d, toISOString: () => d.toISOString(), isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    calendarDays.push({ ...d, toISOString: () => d.toISOString(), isCurrentMonth: true });
  }
  // Next month head
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month === 11 ? 0 : month + 1, i);
    calendarDays.push({ ...d, toISOString: () => d.toISOString(), isCurrentMonth: false });
  }

  const handleDateClick = (dateStr) => {
    const dateObj = new Date(dateStr);
    dateObj.setHours(0, 0, 0, 0);
    const todayObj = new Date(today);
    todayObj.setHours(0, 0, 0, 0);
    if (dateObj < todayObj) return; // Can't select past dates
    if (blockedSet.has(dateStr) || bookedSet.has(dateStr)) return; // Can't select blocked/booked
    onDateSelect(dateStr);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="rounded-[1.6rem] border border-[rgba(37,52,42,0.08)] bg-white/70 p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
          aria-label="Previous month"
        >
          <FiX size={16} className="rotate-45" />
        </button>
        <h3 className="text-lg font-bold text-slate-900">{monthNames[month]} {year}</h3>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
          aria-label="Next month"
        >
          <FiX size={16} className="-rotate-45" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-slate-500 font-semibold uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateStr = day.toISOString().split('T')[0];
          const isBlocked = blockedSet.has(dateStr) || bookedSet.has(dateStr);
          const isToday = dateStr === today.toISOString().split('T')[0];
          const isSel = isSelected(dateStr);
          const isRange = isInRange(dateStr);
          const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);

          let variant = 'available';
          if (isBlocked) variant = 'blocked';
          else if (isSel) variant = 'selected';
          else if (isRange) variant = 'range';

          return (
            <button
              key={i}
              onClick={() => !isPast && handleDateClick(dateStr)}
              disabled={isPast || isBlocked || !day.isCurrentMonth}
              className={`h-10 w-10 rounded-lg text-sm transition-all duration-200 flex items-center justify-center ${
                variant === 'blocked'
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : variant === 'selected'
                  ? 'bg-brand-600 text-white shadow-brand'
                  : variant === 'range'
                  ? 'bg-brand-50/30 text-brand-600'
                  : isToday
                  ? 'bg-slate-200 text-slate-900 font-bold ring-1 ring-brand-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              aria-label={dateStr}
              aria-disabled={isPast || isBlocked || !day.isCurrentMonth}
            >
              {day.getDate()}
              {!isBlocked && !isSel && !isRange && day.isCurrentMonth && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
              {isBlocked && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400" /> Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-600" /> Selected
        </span>
      </div>
    </div>
  );
}
