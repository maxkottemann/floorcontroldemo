"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface DatepickerProps {
  title: string;
  value?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  className?: string;
}

const MONTHS = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

const DAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

export default function Datepicker({
  title,
  value: initialValue,
  onChange,
  className,
}: DatepickerProps) {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasContent = value.length > 0;

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    // 0 = Sunday, shift to Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }

  function selectDate(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${m}-${d}`;
    setValue(dateStr);
    onChange?.(dateStr);
    setOpen(false);
    setFocused(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const selectedDay = value ? parseInt(value.split("-")[2]) : null;
  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;
  const selectedYear = value ? parseInt(value.split("-")[0]) : null;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={`relative w-full ${className ?? ""}`} ref={ref}>
      {/* Input trigger */}
      <div
        onClick={() => {
          setOpen((p) => !p);
          setFocused(true);
        }}
        className={`
          relative rounded-xl border bg-white transition-all duration-200 cursor-pointer
          ${
            open || focused
              ? "border-p shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
              : "border-slate-200 shadow-sm hover:border-p"
          }
        `}
      >
        <label
          className={`
            pointer-events-none absolute left-4 font-medium tracking-wide transition-all duration-200
            ${
              focused || hasContent
                ? "top-1 text-[10px] uppercase text-slate-400"
                : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
            }
          `}
          style={{ letterSpacing: focused || hasContent ? "0.08em" : "0" }}
        >
          {title}
        </label>

        <div className="w-full px-4 pb-3 pt-5 text-sm text-slate-900 min-h-[46px]">
          {hasContent ? (
            <span>{formatDisplay(value)}</span>
          ) : (
            <span className="text-slate-300">
              {focused ? "DD-MM-YYYY" : ""}
            </span>
          )}
        </div>

        {/* Focus underline */}
        <div
          className={`
            absolute bottom-0 left-4 right-4 h-[1.5px] rounded-full
            bg-p transition-all duration-300
            ${open || focused ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
          `}
          style={{ transformOrigin: "left" }}
        />
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <p className="text-sm font-bold text-slate-800">
              {MONTHS[viewMonth]} {viewYear}
            </p>
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-300 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const isSelected =
                day === selectedDay &&
                viewMonth === selectedMonth &&
                viewYear === selectedYear;

              const isToday =
                day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear();

              return (
                <button
                  key={i}
                  onClick={() => selectDate(day)}
                  className={`
                    w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150
                    ${
                      isSelected
                        ? "bg-p text-white font-bold shadow-sm"
                        : isToday
                          ? "border border-p/30 text-p font-bold hover:bg-p/8"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear */}
          {hasContent && (
            <div className="px-4 pb-3 border-t border-slate-50 pt-2">
              <button
                onClick={() => {
                  setValue("");
                  onChange?.("");
                }}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors font-medium"
              >
                Datum wissen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
