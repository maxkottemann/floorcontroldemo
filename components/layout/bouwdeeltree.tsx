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
import { formatNumber } from "@/lib/utils";

interface SelectItem {
  id: string;
  naam: string;
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
interface Kamervloer {
  id: string;
  kamer_id: string;
  naam?: string;
  vloertype_naam?: string;
  vierkante_meter?: number;
  status?: string;
}

interface SelectedState {
  bouwdeelIds: string[];
  alleKamersPerBouwdeel: Record<string, boolean>;
  verdiepingIds: string[];
  alleKamersPerVerdieping: Record<string, boolean>;
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
        className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${enabled ? "bg-p" : "bg-slate-200"}`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
    </label>
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
  const [expandedKamerIds, setExpandedKamerIds] = useState<string[]>([]);

  const toggleKamerExpand = (id: string) => {
    setExpandedKamerIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  };

  const toggleBouwdeel = (id: string) => {
    const isSelected = selected.bouwdeelIds.includes(id);
    const bouwdeelIds = isSelected
      ? selected.bouwdeelIds.filter((b) => b !== id)
      : [...selected.bouwdeelIds, id];

    const alleKamersPerBouwdeel = { ...selected.alleKamersPerBouwdeel };
    const alleKamersPerVerdieping = { ...selected.alleKamersPerVerdieping };

    if (isSelected) {
      delete alleKamersPerBouwdeel[id];
      alleVerdiepingen
        .filter((v) => v.bouwdeel_id === id)
        .forEach((v) => delete alleKamersPerVerdieping[v.id]);
    }

    const verdiepingIds = isSelected
      ? selected.verdiepingIds.filter(
          (v) =>
            !alleVerdiepingen.find(
              (av) => av.id === v && av.bouwdeel_id === id,
            ),
        )
      : selected.verdiepingIds;

    const vloerIds = isSelected
      ? selected.vloerIds.filter((vid) => {
          const vloer = alleKamersvloeren.find((v) => v.id === vid);
          const kamer = alleKamers.find((k) => k.id === vloer?.kamer_id);
          const verd = alleVerdiepingen.find(
            (v) => v.id === kamer?.verdieping_id,
          );
          return verd?.bouwdeel_id !== id;
        })
      : selected.vloerIds;

    onChange({
      ...selected,
      bouwdeelIds,
      alleKamersPerBouwdeel,
      alleKamersPerVerdieping,
      verdiepingIds,
      vloerIds,
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

  const toggleVerdieping = (id: string) => {
    const isSelected = selected.verdiepingIds.includes(id);
    const verdiepingIds = isSelected
      ? selected.verdiepingIds.filter((v) => v !== id)
      : [...selected.verdiepingIds, id];

    const alleKamersPerVerdieping = { ...selected.alleKamersPerVerdieping };
    if (isSelected) delete alleKamersPerVerdieping[id];

    const vloerIds = isSelected
      ? selected.vloerIds.filter((vid) => {
          const vloer = alleKamersvloeren.find((v) => v.id === vid);
          const kamer = alleKamers.find((k) => k.id === vloer?.kamer_id);
          return kamer?.verdieping_id !== id;
        })
      : selected.vloerIds;

    onChange({ ...selected, verdiepingIds, alleKamersPerVerdieping, vloerIds });
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
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
        Bouwdelen & verdiepingen
      </p>

      {alleBouwdelen.map((bouwdeel) => {
        const isBouwdeelSelected = selected.bouwdeelIds.includes(bouwdeel.id);
        const alleVloeren_bouwdeel =
          selected.alleKamersPerBouwdeel[bouwdeel.id] ?? false;
        const verdiepingen = alleVerdiepingen.filter(
          (v) => v.bouwdeel_id === bouwdeel.id,
        );

        return (
          <div
            key={bouwdeel.id}
            className="rounded-xl border border-slate-100 overflow-hidden"
          >
            {/* Bouwdeel */}
            <div
              className={`flex items-center gap-2 px-3 py-2.5 transition-colors ${isBouwdeelSelected ? "bg-p/5" : "bg-slate-50"}`}
            >
              <div
                onClick={() => toggleBouwdeel(bouwdeel.id)}
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${isBouwdeelSelected ? "bg-p/15 text-p" : "bg-slate-200 text-slate-400"}`}
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
                  enabled={alleVloeren_bouwdeel}
                  onChange={(v) => toggleAlleKamersPerBouwdeel(bouwdeel.id, v)}
                  label="Alle vloeren"
                />
              )}
            </div>

            {/* Verdiepingen */}
            {isBouwdeelSelected &&
              !alleVloeren_bouwdeel &&
              verdiepingen.length > 0 && (
                <div className="p-2 space-y-1 border-t border-slate-100">
                  {verdiepingen.map((verdieping) => {
                    const isVerdiepingSelected =
                      selected.verdiepingIds.includes(verdieping.id);
                    const alleVloeren_verdieping =
                      selected.alleKamersPerVerdieping[verdieping.id] ?? false;
                    const kamers = alleKamers.filter(
                      (k) => k.verdieping_id === verdieping.id,
                    );

                    return (
                      <div
                        key={verdieping.id}
                        className="ml-3 rounded-lg border border-slate-100 overflow-hidden"
                      >
                        {/* Verdieping */}
                        <div
                          className={`flex items-center gap-2 px-2 py-2 transition-colors ${isVerdiepingSelected ? "bg-p/5" : "bg-white"}`}
                        >
                          <div
                            onClick={() => toggleVerdieping(verdieping.id)}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isVerdiepingSelected ? "bg-p/15 text-p" : "bg-slate-100 text-slate-400"}`}
                            >
                              <Square3Stack3DIcon className="w-3 h-3" />
                            </div>
                            <p
                              className={`text-xs font-semibold ${isVerdiepingSelected ? "text-p" : "text-slate-600"}`}
                            >
                              {verdieping.naam}
                            </p>
                            {isVerdiepingSelected && (
                              <CheckIcon className="w-3 h-3 text-p" />
                            )}
                          </div>
                          {isVerdiepingSelected && (
                            <Toggle
                              enabled={alleVloeren_verdieping}
                              onChange={(v) =>
                                toggleAlleKamersPerVerdieping(verdieping.id, v)
                              }
                              label="Alle vloeren"
                            />
                          )}
                        </div>

                        {/* Kamers — grouping only, expandable */}
                        {isVerdiepingSelected &&
                          !alleVloeren_verdieping &&
                          kamers.length > 0 && (
                            <div className="border-t border-slate-50 bg-slate-50/40 px-2 py-1.5 space-y-1">
                              {kamers.map((kamer) => {
                                const vloeren = alleKamersvloeren.filter(
                                  (v) => v.kamer_id === kamer.id,
                                );
                                const isExpanded = expandedKamerIds.includes(
                                  kamer.id,
                                );
                                const selectedCount = vloeren.filter((v) =>
                                  selected.vloerIds.includes(v.id),
                                ).length;
                                const allSelected =
                                  vloeren.length > 0 &&
                                  selectedCount === vloeren.length;

                                const toggleAllKamerVloeren = (
                                  e: React.MouseEvent,
                                ) => {
                                  e.stopPropagation();
                                  const kamerVloerIds = vloeren.map(
                                    (v) => v.id,
                                  );
                                  const vloerIds = allSelected
                                    ? selected.vloerIds.filter(
                                        (id) => !kamerVloerIds.includes(id),
                                      )
                                    : [
                                        ...new Set([
                                          ...selected.vloerIds,
                                          ...kamerVloerIds,
                                        ]),
                                      ];
                                  onChange({ ...selected, vloerIds });
                                };

                                return (
                                  <div key={kamer.id} className="ml-2">
                                    {/* Kamer header — click body to select all, chevron to expand */}
                                    <div
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${allSelected ? "bg-p/5" : "hover:bg-white"}`}
                                    >
                                      <div
                                        onClick={toggleAllKamerVloeren}
                                        className="flex items-center gap-2 flex-1 cursor-pointer"
                                      >
                                        <div
                                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${allSelected ? "bg-p text-white" : "bg-slate-200 text-slate-400"}`}
                                        >
                                          {allSelected ? (
                                            <CheckIcon className="w-2.5 h-2.5" />
                                          ) : (
                                            <HomeModernIcon className="w-2.5 h-2.5" />
                                          )}
                                        </div>
                                        <p
                                          className={`text-xs font-medium flex-1 ${allSelected ? "text-p font-semibold" : "text-slate-600"}`}
                                        >
                                          {kamer.naam}
                                        </p>
                                        {selectedCount > 0 && (
                                          <span className="text-[10px] font-bold text-p bg-p/10 px-1.5 py-0.5 rounded-full">
                                            {selectedCount}/{vloeren.length}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleKamerExpand(kamer.id);
                                        }}
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 transition-colors shrink-0"
                                      >
                                        <ChevronDownIcon
                                          className={`w-3 h-3 text-slate-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button>
                                    </div>

                                    {/* Vloeren — primary selectable */}
                                    {isExpanded && vloeren.length > 0 && (
                                      <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
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
                                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150
                                            ${isVloerSelected ? "bg-p/8 border border-p/20" : "border border-transparent hover:bg-white hover:border-slate-100"}`}
                                            >
                                              <div
                                                className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${isVloerSelected ? "bg-p/15 text-p" : "bg-slate-200 text-slate-400"}`}
                                              >
                                                <SwatchIcon className="w-2 h-2" />
                                              </div>
                                              <p
                                                className={`text-xs flex-1 font-medium ${isVloerSelected ? "text-p" : "text-slate-500"}`}
                                              >
                                                {vloer.vloertype_naam ??
                                                  vloer.naam}
                                                {vloer.vierkante_meter && (
                                                  <span
                                                    className={`font-normal ml-1 ${isVloerSelected ? "text-p/60" : "text-slate-400"}`}
                                                  >
                                                    ·{" "}
                                                    {formatNumber(
                                                      vloer.vierkante_meter,
                                                    )}
                                                    m²
                                                  </span>
                                                )}
                                              </p>
                                              {isVloerSelected && (
                                                <CheckIcon className="w-3 h-3 text-p shrink-0" />
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
