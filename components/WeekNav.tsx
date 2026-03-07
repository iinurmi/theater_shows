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
import {
  prevWeek,
  nextWeek,
  formatWeekLabel,
  formatIsoWeek,
  getWeekBounds,
  getCurrentIsoWeek,
} from '@/lib/week';

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

  /**
   * Controlled month shown in the DayPicker.
   * Initialised to the month of the currently selected week so the picker
   * opens on the right month. Synced via useEffect whenever isoWeek changes
   * (e.g. prev/next navigation while the popup is open).
   */
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => getWeekBounds(isoWeek).start);

  /** Ref for the popup container — used to detect clicks outside. */
  const popupRef = useRef<HTMLDivElement>(null);
  /** Ref for the label button in the main nav — excluded from outside-click detection. */
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** Ref for the label button in the sticky bar — also excluded from outside-click detection. */
  const stickyTriggerRef = useRef<HTMLButtonElement>(null);

  /** Ref attached to the <nav> element to observe its viewport visibility. */
  const navRef = useRef<HTMLElement>(null);
  /**
   * True while the main <nav> is intersecting the viewport.
   * When false (user has scrolled past), the sticky bottom bar is shown.
   */
  const [isNavVisible, setIsNavVisible] = useState(true);

  /** Track whether the main nav is in the viewport via IntersectionObserver. */
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsNavVisible(entry.isIntersecting),
      // Fire as soon as any part of the nav leaves/enters the viewport
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function navigate(targetWeek: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('week', targetWeek);
    // replace instead of push — week navigation shouldn't pollute the back stack
    router.replace(`?${params.toString()}`);
  }

  /** Sync the displayed calendar month whenever the week prop changes. */
  useEffect(() => {
    setCalendarMonth(getWeekBounds(isoWeek).start);
  }, [isoWeek]);

  /** Close popup on click-outside or Escape key. */
  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }

    function onPointerDown(e: MouseEvent) {
      // Close if the click is outside the popup and both trigger buttons
      const target = e.target as Node;
      const insidePopup = popupRef.current?.contains(target) ?? false;
      const insideTrigger = triggerRef.current?.contains(target) ?? false;
      const insideStickyTrigger = stickyTriggerRef.current?.contains(target) ?? false;
      if (!insidePopup && !insideTrigger && !insideStickyTrigger) {
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

  /** True when the displayed week is the current ISO week. */
  const isCurrentWeek = isoWeek === getCurrentIsoWeek();

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
    <>
    {/* Relative container so the absolute popup is positioned under the label */}
    <nav
      ref={navRef}
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
          // When nav is visible: absolute below the label. When sticky bar is shown:
          // fixed below the sticky bar (~52 px from top) so popup stays on-screen.
          className={`z-50 -translate-x-1/2 rounded-lg bg-white shadow-lg ring-1 ring-gray-200 ${
            isNavVisible
              ? 'absolute left-1/2 top-full mt-1'
              : 'fixed left-1/2 top-[52px] mt-1'
          }`}
        >
          {/* Today shortcut inside the popup — jumps calendar to current month and navigates */}
          <div className="flex justify-end px-3 pt-2">
            <button
              onClick={() => {
                setCalendarMonth(new Date());
                navigate(getCurrentIsoWeek());
                handleClose();
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              ↩ Today
            </button>
          </div>
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
            // Controlled month so "Today" button can sync the displayed month
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
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

    {/*
     * Sticky top bar — shown on mobile only (md:hidden) when the main nav
     * has been scrolled out of view. Provides quick prev/next access without
     * scrolling back to the top.
     */}
    {!isNavVisible && (
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-2 md:hidden"
        aria-label="Quick week navigation"
      >
        <button
          onClick={() => navigate(prevWeek(isoWeek))}
          aria-label="Previous week"
          className="rounded px-4 py-2 text-xl font-medium hover:bg-gray-100 active:bg-gray-200"
        >
          ←
        </button>

        {/* Week label — opens the same calendar popup as the main nav */}
        <button
          ref={stickyTriggerRef}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="rounded px-2 py-1 text-base font-semibold hover:bg-gray-100 active:bg-gray-200"
        >
          {weekLabel ?? formatWeekLabel(isoWeek)} ▾
        </button>

        <button
          onClick={() => navigate(nextWeek(isoWeek))}
          aria-label="Next week"
          className="rounded px-4 py-2 text-xl font-medium hover:bg-gray-100 active:bg-gray-200"
        >
          →
        </button>
      </div>
    )}

    {/* Today shortcut — only visible when browsing a non-current week */}
    {!isCurrentWeek && (
      <div className="flex justify-center -mt-2 pb-1">
        <button
          onClick={() => navigate(getCurrentIsoWeek())}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          ↩ Back to Today
        </button>
      </div>
    )}
    </>
  );
}
