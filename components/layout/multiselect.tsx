"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface MultiSelectProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({
  title,
  options,
  selected,
  onChange,
  placeholder = "Alle",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [zoek, setZoek] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setZoek("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val],
    );
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(zoek.toLowerCase()),
  );

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : selected.length === 2
          ? selected.join(", ")
          : `${selected.length} geselecteerd`;

  const hasSelection = selected.length > 0;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all duration-150 min-w-[140px] select-none
          ${
            open
              ? "border-p shadow-[0_0_0_3px_rgba(21,66,115,0.08)] bg-white"
              : hasSelection
                ? "border-p/40 bg-p/5 hover:border-p/60"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
          }`}
      >
        <div className="flex-1 min-w-0">
          <p
            className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5 ${hasSelection ? "text-p/70" : "text-slate-400"}`}
          >
            {title}
          </p>
          <p
            className={`text-sm font-semibold truncate leading-tight ${hasSelection ? "text-p" : "text-slate-500"}`}
          >
            {label}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasSelection && (
            <button
              onClick={clearAll}
              className="w-4 h-4 rounded-full bg-p/20 hover:bg-p/30 flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-2.5 h-2.5 text-p" />
            </button>
          )}
          <ChevronDownIcon
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180 text-p" : "text-slate-400"}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Search */}
          {options.length > 5 && (
            <div className="px-3 py-2.5 border-b border-slate-50">
              <input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoeken..."
                autoFocus
                className="w-full text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100 outline-none focus:border-p/40 placeholder:text-slate-300 transition-all"
              />
            </div>
          )}

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1.5">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-300 text-center">
                Geen resultaten
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <li
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={`flex items-center gap-3 px-3 py-2 mx-1.5 rounded-xl cursor-pointer transition-colors
                      ${isSelected ? "bg-p/8" : "hover:bg-slate-50"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all
                      ${isSelected ? "bg-p border-p" : "border-slate-300 bg-white"}`}
                    >
                      {isSelected && (
                        <CheckIcon
                          className="w-2.5 h-2.5 text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium flex-1 ${isSelected ? "text-p" : "text-slate-600"}`}
                    >
                      {opt}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="px-3 py-2.5 border-t border-slate-50 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {selected.length} geselecteerd
              </p>
              <button
                onClick={() => onChange([])}
                className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
              >
                Alles wissen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
