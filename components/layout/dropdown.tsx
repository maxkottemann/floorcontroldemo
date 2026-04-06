"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownProps {
  title?: string;
  options: string[];
  placeholder?: string;
  value?: string;
  initialValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function Dropdown({
  title,
  options,
  value,
  placeholder,
  onChange,
  initialValue,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(
    value || initialValue || null,
  );
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) setSelected(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) =>
        prev < options.length - 1 ? prev + 1 : prev,
      );
    }

    if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }

    if (e.key === "Enter" && highlightedIndex >= 0) {
      selectOption(options[highlightedIndex]);
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectOption = (option: string) => {
    setSelected(option);
    setOpen(false);
    setHighlightedIndex(-1);
    onChange?.(option);
  };

  return (
    <div className={`max-w-sm relative ${className}`} ref={ref}>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {title}
      </label>

      <div
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition"
      >
        <span
          className={`${selected ? "text-gray-900" : "text-gray-400"} text-sm`}
        >
          {selected || placeholder}
        </span>

        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <ul className="max-h-60 overflow-auto">
            {options.map((option, index) => (
              <li
                key={option}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
                className={`px-4 py-2 text-sm cursor-pointer transition
                  ${
                    highlightedIndex === index
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                  }
                  ${selected === option ? "font-semibold bg-gray-100" : ""}
                  hover:bg-blue-50`}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
