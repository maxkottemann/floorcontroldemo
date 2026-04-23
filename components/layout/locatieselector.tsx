"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

import { Locatie } from "@/types/locatie";
interface LocatieSelectorProps {
  locaties: Locatie[];
  value?: Locatie | null;
  onChange?: (locatie: Locatie) => void;
}

export default function LocatieSelector({
  locaties,
  value,
  onChange,
}: LocatieSelectorProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = locaties.filter((l) =>
    [l.naam, l.plaats, l.type].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

  return (
    <div className="w-full">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Locatie
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Search bar */}
        <div
          className={`relative border-b transition-colors duration-200 ${
            focused ? "border-p" : "border-slate-100"
          }`}
        >
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Zoek locatie..."
            className="w-full py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300 outline-none bg-transparent"
          />
          {zoekterm && (
            <button
              onClick={() => setZoekterm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* List */}
        <ul className="max-h-56 overflow-y-auto divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-slate-300">
              Geen locaties gevonden
            </li>
          ) : (
            filtered.map((locatie, i) => {
              const isSelected = value?.naam === locatie.naam;
              return (
                <li
                  key={i}
                  onClick={() => onChange?.(locatie)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150
                    ${isSelected ? "bg-slate-50" : "hover:bg-slate-50"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? "bg-p/10" : "bg-slate-100"}`}
                  >
                    <MapPinIcon
                      className={`w-4 h-4 ${isSelected ? "text-p" : "text-slate-400"}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isSelected ? "text-p" : "text-slate-800"
                      }`}
                    >
                      {locatie.naam}
                    </p>
                    {(locatie.plaats || locatie.type) && (
                      <p className="text-xs text-slate-400 truncate">
                        {[
                          locatie.perceel,
                          locatie.type,
                          locatie.plaats,
                          locatie.adres,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-p shrink-0" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
