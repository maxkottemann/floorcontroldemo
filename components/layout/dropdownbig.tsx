"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  title: string;
  options: string[];
  placeholder?: string;
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function DropdownBig({
  title,
  options,
  value,
  placeholder = "Select an option",
  onChange,
  initialValue,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);

  const hasValue = selected !== null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (initialValue) setSelected(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === "") setSelected(null);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      !open &&
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
    ) {
      setOpen(true);
      setHighlightedIndex(0);
      e.preventDefault();
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") {
        setHighlightedIndex((i) => Math.min(i + 1, options.length - 1));
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        e.preventDefault();
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        setSelected(options[highlightedIndex]);
        setOpen(false);
        setHighlightedIndex(-1);
        e.preventDefault();
      } else if (e.key === "Escape") {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
  };

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setHighlightedIndex(-1);
        }}
        className={`
          relative rounded-xl border bg-white cursor-pointer
          transition-all duration-200 select-none z-60
          ${className}
          ${
            open
              ? "border-p shadow-[0_0_0_3px_rgba(15,23,42,0.08)]"
              : "border-slate-200 shadow-sm hover:border-slate-300"
          }
        `}
      >
        <span
          className={`
            pointer-events-none absolute left-4 font-medium tracking-wide transition-all duration-200
            ${
              open || hasValue
                ? "top-2.5 text-[10px] uppercase text-slate-400"
                : "top-1/2 -translate-y-1/2 text-sm text-slate-400"
            }
          `}
          style={{ letterSpacing: open || hasValue ? "0.08em" : "0" }}
        >
          {title}
        </span>

        <div className="w-full px-4 pb-3 pt-7 text-sm text-slate-900 pr-10">
          {hasValue ? (
            <span>{selected}</span>
          ) : (
            <span
              className={`transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"} text-slate-300`}
            >
              {placeholder}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div
          className={`
            absolute bottom-0 left-4 right-4 h-[1.5px] rounded-full
            bg-p transition-all duration-300
            ${open ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}
          `}
          style={{ transformOrigin: "left" }}
        />
      </div>

      <div
        role="listbox"
        className={`
          absolute z-100 mt-2 w-full rounded-xl border border-slate-200
          bg-white shadow-lg overflow-hidden
          transition-all duration-200 origin-top
          ${open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"}
        `}
      >
        <div className="py-1.5">
          {options.map((option, i) => (
            <div
              key={option}
              role="option"
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseLeave={() => setHighlightedIndex(-1)}
              onClick={() => {
                setSelected(option);
                setOpen(false);
                setHighlightedIndex(-1);
                onChange?.(option);
              }}
              className={`
                relative flex items-center justify-between
                px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100
                ${highlightedIndex === i ? "bg-slate-50 text-slate-900" : "text-slate-600"}
              `}
            >
              <span
                className={
                  selected === option ? "font-medium text-slate-900" : ""
                }
              >
                {option}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
