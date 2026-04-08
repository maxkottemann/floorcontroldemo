"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  CheckIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

interface SelectItem {
  id: string;
  naam?: string;
}

interface Bouwdeel extends SelectItem {
  locatie_id: string;
}
interface Verdieping extends SelectItem {
  bouwdeel_id: string;
}
interface Kamer extends SelectItem {
  verdieping_id: string;
}
interface Kamervloer extends SelectItem {
  kamer_id: string;
  vloertype_naam?: string;
  vierkante_meter?: number;
  status?: string;
}

interface SelectedState {
  bouwdeelIds: string[];
  alleKamersPerBouwdeel: Record<string, boolean>;
  verdiepingIds: string[];
  alleKamersPerVerdieping: Record<string, boolean>;
  kamerIds: string[];
  vloerIds: string[];
}

interface BouwdeelTreeProps {
  alleBouwdelen: Bouwdeel[];
  alleVerdiepingen: Verdieping[];
  alleKamers: Kamer[];
  alleKamersvloeren: Kamervloer[];
  selected: SelectedState;
  onChange: (updated: SelectedState) => void;
}

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onChange(!enabled);
        }}
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${
          enabled ? "bg-p" : "bg-slate-200"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

function SelectRow({
  icon,
  label,
  sub,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group
        ${selected ? "bg-p/8 border border-p/20" : "border border-transparent hover:bg-slate-50"}`}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors
          ${selected ? "bg-p/15 text-p" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${selected ? "text-p" : "text-slate-700"}`}
        >
          {label}
        </p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
      {selected && <CheckIcon className="w-3.5 h-3.5 text-p shrink-0" />}
    </div>
  );
}

export default function BouwdeelTree({
  alleBouwdelen,
  alleVerdiepingen,
  alleKamers,
  alleKamersvloeren,
  selected,
  onChange,
}: BouwdeelTreeProps) {
  const toggleBouwdeel = (id: string) => {
    const isSelected = selected.bouwdeelIds.includes(id);
    const bouwdeelIds = isSelected
      ? selected.bouwdeelIds.filter((b) => b !== id)
      : [...selected.bouwdeelIds, id];

    // clean up children if deselected
    const alleKamersPerBouwdeel = { ...selected.alleKamersPerBouwdeel };
    const verdiepingIds = isSelected
      ? selected.verdiepingIds.filter(
          (v) =>
            !alleVerdiepingen.find(
              (av) => av.id === v && av.bouwdeel_id === id,
            ),
        )
      : selected.verdiepingIds;

    if (isSelected) delete alleKamersPerBouwdeel[id];

    onChange({
      ...selected,
      bouwdeelIds,
      alleKamersPerBouwdeel,
      verdiepingIds,
    });
  };

  const toggleAlleKamersPerBouwdeel = (bouwdeelId: string, value: boolean) => {
    onChange({
      ...selected,
      alleKamersPerBouwdeel: {
        ...selected.alleKamersPerBouwdeel,
        [bouwdeelId]: value,
      },
    });
  };

  const toggleVerdieping = (id: string, bouwdeelId: string) => {
    const isSelected = selected.verdiepingIds.includes(id);
    const verdiepingIds = isSelected
      ? selected.verdiepingIds.filter((v) => v !== id)
      : [...selected.verdiepingIds, id];

    const alleKamersPerVerdieping = { ...selected.alleKamersPerVerdieping };
    const kamerIds = isSelected
      ? selected.kamerIds.filter(
          (k) =>
            !alleKamers.find((ak) => ak.id === k && ak.verdieping_id === id),
        )
      : selected.kamerIds;

    if (isSelected) delete alleKamersPerVerdieping[id];

    onChange({ ...selected, verdiepingIds, alleKamersPerVerdieping, kamerIds });
  };

  const toggleAlleKamersPerVerdieping = (
    verdiepingId: string,
    value: boolean,
  ) => {
    onChange({
      ...selected,
      alleKamersPerVerdieping: {
        ...selected.alleKamersPerVerdieping,
        [verdiepingId]: value,
      },
    });
  };

  const toggleKamer = (id: string) => {
    const isSelected = selected.kamerIds.includes(id);
    const kamerIds = isSelected
      ? selected.kamerIds.filter((k) => k !== id)
      : [...selected.kamerIds, id];

    const vloerIds = isSelected
      ? selected.vloerIds.filter(
          (v) =>
            !alleKamersvloeren.find((av) => av.id === v && av.kamer_id === id),
        )
      : selected.vloerIds;

    onChange({ ...selected, kamerIds, vloerIds });
  };

  const toggleVloer = (id: string) => {
    const isSelected = selected.vloerIds.includes(id);
    const vloerIds = isSelected
      ? selected.vloerIds.filter((v) => v !== id)
      : [...selected.vloerIds, id];
    onChange({ ...selected, vloerIds });
  };

  if (alleBouwdelen.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-slate-300">
        Selecteer eerst een locatie
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
        Bouwdelen & verdiepingen
      </p>

      {alleBouwdelen.map((bouwdeel) => {
        const isBouwdeelSelected = selected.bouwdeelIds.includes(bouwdeel.id);
        const alleKamers_bouwdeel =
          selected.alleKamersPerBouwdeel[bouwdeel.id] ?? false;
        const verdiepingen = alleVerdiepingen.filter(
          (v) => v.bouwdeel_id === bouwdeel.id,
        );

        return (
          <div
            key={bouwdeel.id}
            className="rounded-xl border border-slate-100 overflow-hidden"
          >
            {/* Bouwdeel row */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
              <div
                onClick={() => toggleBouwdeel(bouwdeel.id)}
                className={`flex items-center gap-2.5 flex-1 cursor-pointer rounded-lg transition-all duration-150 group`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors
                    ${isBouwdeelSelected ? "bg-p/15 text-p" : "bg-slate-200 text-slate-400"}`}
                >
                  <BuildingOfficeIcon className="w-3.5 h-3.5" />
                </div>
                <p
                  className={`text-sm font-semibold ${isBouwdeelSelected ? "text-p" : "text-slate-700"}`}
                >
                  {bouwdeel.naam}
                </p>
                {isBouwdeelSelected && (
                  <CheckIcon className="w-3.5 h-3.5 text-p" />
                )}
              </div>

              {isBouwdeelSelected && (
                <Toggle
                  enabled={alleKamers_bouwdeel}
                  onChange={(v) => toggleAlleKamersPerBouwdeel(bouwdeel.id, v)}
                  label="Alle kamers"
                />
              )}
            </div>

            {/* Verdiepingen */}
            {isBouwdeelSelected &&
              !alleKamers_bouwdeel &&
              verdiepingen.length > 0 && (
                <div className="p-2 space-y-1 border-t border-slate-100">
                  {verdiepingen.map((verdieping) => {
                    const isVerdiepingSelected =
                      selected.verdiepingIds.includes(verdieping.id);
                    const alleKamers_verdieping =
                      selected.alleKamersPerVerdieping[verdieping.id] ?? false;
                    const kamers = alleKamers.filter(
                      (k) => k.verdieping_id === verdieping.id,
                    );

                    return (
                      <div
                        key={verdieping.id}
                        className="ml-4 rounded-lg border border-slate-100 overflow-hidden"
                      >
                        {/* Verdieping row */}
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-white">
                          <div
                            onClick={() =>
                              toggleVerdieping(verdieping.id, bouwdeel.id)
                            }
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors
                              ${isVerdiepingSelected ? "bg-p/15 text-p" : "bg-slate-100 text-slate-400"}`}
                            >
                              <Square3Stack3DIcon className="w-3 h-3" />
                            </div>
                            <p
                              className={`text-xs font-medium ${isVerdiepingSelected ? "text-p" : "text-slate-600"}`}
                            >
                              {verdieping.naam}
                            </p>
                            {isVerdiepingSelected && (
                              <CheckIcon className="w-3 h-3 text-p" />
                            )}
                          </div>

                          {isVerdiepingSelected && (
                            <Toggle
                              enabled={alleKamers_verdieping}
                              onChange={(v) =>
                                toggleAlleKamersPerVerdieping(verdieping.id, v)
                              }
                              label="Alle kamers"
                            />
                          )}
                        </div>

                        {/* Kamers */}
                        {isVerdiepingSelected &&
                          !alleKamers_verdieping &&
                          kamers.length > 0 && (
                            <div className="px-2 pb-2 pt-1 space-y-1 border-t border-slate-50 bg-slate-50/50">
                              {kamers.map((kamer) => {
                                const isKamerSelected =
                                  selected.kamerIds.includes(kamer.id);
                                const vloeren = alleKamersvloeren.filter(
                                  (v) => v.kamer_id === kamer.id,
                                );

                                return (
                                  <div key={kamer.id} className="ml-3">
                                    <div
                                      onClick={() => toggleKamer(kamer.id)}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors
                                    ${isKamerSelected ? "bg-p/8 border border-p/15" : "border border-transparent hover:bg-white"}`}
                                    >
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0
                                      ${isKamerSelected ? "bg-p/15 text-p" : "bg-slate-200 text-slate-400"}`}
                                      >
                                        <HomeModernIcon className="w-2.5 h-2.5" />
                                      </div>
                                      <p
                                        className={`text-xs font-medium flex-1 ${isKamerSelected ? "text-p" : "text-slate-600"}`}
                                      >
                                        {kamer.naam}
                                      </p>
                                      {isKamerSelected && (
                                        <CheckIcon className="w-3 h-3 text-p" />
                                      )}
                                    </div>

                                    {/* Vloeren */}
                                    {isKamerSelected && vloeren.length > 0 && (
                                      <div className="ml-4 mt-1 space-y-0.5">
                                        {vloeren.map((vloer) => {
                                          const isVloerSelected =
                                            selected.vloerIds.includes(
                                              vloer.id,
                                            );
                                          return (
                                            <div
                                              key={vloer.id}
                                              onClick={() =>
                                                toggleVloer(vloer.id)
                                              }
                                              className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors
                                            ${isVloerSelected ? "bg-p/8 border border-p/15" : "border border-transparent hover:bg-white"}`}
                                            >
                                              <div
                                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0
                                              ${isVloerSelected ? "bg-p/15 text-p" : "bg-slate-200 text-slate-400"}`}
                                              >
                                                <SwatchIcon className="w-2 h-2" />
                                              </div>
                                              <p
                                                className={`text-xs flex-1 ${isVloerSelected ? "text-p font-medium" : "text-slate-500"}`}
                                              >
                                                {vloer.vloertype_naam ??
                                                  vloer.naam}
                                                {vloer.vierkante_meter && (
                                                  <span className="text-slate-400 font-normal ml-1">
                                                    · {vloer.vierkante_meter}m²
                                                  </span>
                                                )}
                                              </p>
                                              {isVloerSelected && (
                                                <CheckIcon className="w-2.5 h-2.5 text-p" />
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}
