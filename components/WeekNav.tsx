'use client';

/**
 * WeekNav — client component.
 *
 * Displays the current week label and prev/next navigation buttons.
 * Navigation updates the `?week=` URL search param, which triggers a
 * server-side re-fetch in the parent page.
 *
 * The week label is a clickable button that opens a calendar popup
 * (react-day-picker in week-selection mode) so users can jump to any
 * week within ±3 months of today without repeated prev/next clicks.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { prevWeek, nextWeek, formatWeekLabel, formatIsoWeek, getWeekBounds } from '@/lib/week';

type WeekNavProps = {
  isoWeek: string; // e.g. "2026-W10"
  /** Optional label override — used when the current week shows a rolling window range. */
  weekLabel?: string;
};

export function WeekNav({ isoWeek, weekLabel }: WeekNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Whether the calendar popup is open. */
  const [isOpen, setIsOpen] = useState(false);

  /** Ref for the popup container — used to detect clicks outside. */
  const popupRef = useRef<HTMLDivElement>(null);
  /** Ref for the label button — excluded from outside-click detection. */
  const triggerRef = useRef<HTMLButtonElement>(null);

  function navigate(targetWeek: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', targetWeek);
    // replace instead of push — week navigation shouldn't pollute the back stack
    router.replace(`?${params.toString()}`);
  }

  /** Close popup on click-outside or Escape key. */
  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }

    function onPointerDown(e: MouseEvent) {
      // Close if the click is outside both the trigger and the popup
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen, handleClose]);

  /**
   * Compute ±3 month date limits for the calendar.
   * Computed at render time on the client so it reflects the user's local clock.
   */
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setMonth(today.getMonth() - 3);
  const toDate = new Date(today);
  toDate.setMonth(today.getMonth() + 3);

  /**
   * Derive the selected week range for the picker from the isoWeek prop.
   * react-day-picker's week-selection mode expects a `{ from, to }` DateRange.
   */
  const { start: selectedFrom, end: selectedTo } = getWeekBounds(isoWeek);
  // selectedTo has time 23:59:59.999 — day picker needs a clean date for selection highlight
  const selectedWeekRange = { from: selectedFrom, to: selectedTo };

  /** Handle a week selection from the picker. */
  function handleWeekSelect(range: { from?: Date; to?: Date } | undefined) {
    if (!range?.from) return;
    const picked = formatIsoWeek(range.from);
    navigate(picked);
    handleClose();
  }

  return (
    // Relative container so the absolute popup is positioned under the label
    <nav
      aria-label="Week navigation"
      className="relative flex items-center justify-between gap-4 py-4"
    >
      {/* Prev week */}
      <button
        onClick={() => navigate(prevWeek(isoWeek))}
        aria-label="Previous week"
        className="rounded px-3 py-2 text-lg font-medium hover:bg-gray-100 active:bg-gray-200"
      >
        ←
      </button>

      {/* Week label — clicking opens the calendar popup. ▾ and dashed underline signal interactivity. */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="rounded px-2 py-1 text-base font-semibold hover:bg-gray-100 active:bg-gray-200"
      >
        {weekLabel ?? formatWeekLabel(isoWeek)} ▾
      </button>

      {/* Calendar popup — rendered directly in the DOM flow but absolutely positioned */}
      {isOpen && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Pick a week"
          // Centred below the label; z-50 floats above page content
          className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded-lg bg-white shadow-lg ring-1 ring-gray-200"
        >
          <DayPicker
            mode="range"
            // Show week numbers so users can orient themselves
            showWeekNumber
            // Restrict to ±3 months
            fromDate={fromDate}
            toDate={toDate}
            // Highlight the active week
            selected={selectedWeekRange}
            // On any day click, snap selection to the full Mon–Sun week
            onDayClick={(day) => {
              // Derive week start (Monday) for the clicked day
              const dayOfWeek = (day.getDay() + 6) % 7; // Mon=0…Sun=6
              const monday = new Date(day);
              monday.setDate(day.getDate() - dayOfWeek);
              monday.setHours(0, 0, 0, 0);
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              handleWeekSelect({ from: monday, to: sunday });
            }}
            // Default to the month of the currently selected week
            defaultMonth={selectedFrom}
            // Tailwind-friendly inline styles via classNames prop
            classNames={{
              root: 'p-3 select-none',
              month_caption: 'flex justify-center mb-2 font-semibold text-sm text-gray-700',
              nav: 'flex items-center justify-between mb-1',
              button_previous:
                'rounded p-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 cursor-pointer',
              button_next:
                'rounded p-1 text-gray-500 hover:bg-gray-100 active:bg-gray-200 cursor-pointer',
              weeks: 'border-collapse',
              // Both the header row and data rows must be flex so w-8 cells align uniformly
              weekdays: 'flex',
              week: 'flex',
              // Spacer in the header row above the week-number column — must match week_number width
              week_number_header: 'w-8',
              week_number: 'w-8 text-xs text-gray-400 flex items-center justify-center',
              weekday: 'w-8 text-xs font-medium text-gray-400 text-center pb-1',
              day: 'w-8 h-8 flex items-center justify-center text-sm rounded cursor-pointer hover:bg-gray-100',
              day_button: 'w-full h-full flex items-center justify-center rounded',
              selected: 'bg-blue-100 text-blue-900 rounded-none',
              range_start: 'bg-blue-500 text-white rounded-l-full',
              range_end: 'bg-blue-500 text-white rounded-r-full',
              range_middle: 'bg-blue-100 text-blue-900 rounded-none',
              today: 'font-bold underline',
              outside: 'text-gray-300',
              disabled: 'text-gray-200 cursor-not-allowed',
            }}
          />
        </div>
      )}

      {/* Next week */}
      <button
        onClick={() => navigate(nextWeek(isoWeek))}
        aria-label="Next week"
        className="rounded px-3 py-2 text-lg font-medium hover:bg-gray-100 active:bg-gray-200"
      >
        →
      </button>
    </nav>
  );
}
