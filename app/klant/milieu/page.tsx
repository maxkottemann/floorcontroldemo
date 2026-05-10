"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  BeakerIcon,
  CloudIcon,
  SparklesIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckBadgeIcon,
  FireIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { GiWaterDrop, GiWaterRecycling } from "react-icons/gi";
import { BsLightning } from "react-icons/bs";
import { formatNumber } from "@/lib/utils";
import Datepicker from "@/components/layout/datepicker";
import SidebarClient from "@/components/layout/sidebarclient";

interface Locatie {
  id: string;
  naam: string;
  plaats: string | null;
}
interface Methode {
  id: string;
  naam: string;
}
interface Totals {
  m2: number;
  water: number;
  waterOld: number;
  afval: number;
  afvalOld: number;
  chemie: number;
  chemieOld: number;
  stroom: number;
  stroomOld: number;
  co2actualTon: number;
  co2savedTon: number;
  co2pct: number;
}
interface MethodeTotaal {
  id: string;
  naam: string;
  m2: number;
  water: number;
  waterOld: number;
  afval: number;
  afvalOld: number;
  chemie: number;
  chemieOld: number;
  stroom: number;
  stroomOld: number;
}
interface Filters {
  locatieIds: string[];
  methodeIds: string[];
  vanDatum: string;
  totDatum: string;
}

function safenumber(v: any): number {
  return Number(v) || 0;
}
function calcPct(oldVal: number, newVal: number): number {
  if (oldVal === 0) return 0;
  return ((oldVal - newVal) / oldVal) * 100;
}
function calcSaved(oldVal: number, newVal: number): number {
  return Math.max(oldVal - newVal, 0);
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  color,
  savedValue,
  savedUnit,
  savedPct,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  savedValue: number;
  savedUnit: string;
  savedPct: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col gap-3">
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          {label}
        </p>
        <p className={`text-xl md:text-2xl font-bold tracking-tight ${color}`}>
          {formatNumber(value)}
          <span className="text-xs font-normal text-slate-400 ml-1">
            {unit}
          </span>
        </p>
      </div>
      <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
        {savedValue > 0 ? (
          <>
            <span className="text-xs font-semibold text-emerald-700">
              Bespaard: {formatNumber(savedValue)} {savedUnit}
            </span>
            {savedPct > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                {formatNumber(savedPct)}%
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-slate-300">Geen besparing</span>
        )}
      </div>
    </div>
  );
}

function ResourceRow({
  icon,
  label,
  unit,
  value,
  oldValue,
}: {
  icon: React.ReactNode;
  label: string;
  unit: string;
  value: number;
  oldValue?: number;
}) {
  const saved = oldValue && oldValue > 0 ? calcSaved(oldValue, value) : 0;
  const pct = oldValue && oldValue > 0 ? calcPct(oldValue, value) : 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">{label}</p>
          <p className="text-[11px] text-slate-400">
            {formatNumber(value)} {unit} gebruikt
          </p>
        </div>
      </div>
      {saved > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            −{formatNumber(saved)} {unit} · {pct.toFixed(0)}%
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-300">Geen besparing</span>
      )}
    </div>
  );
}

function MethodeCard({ m }: { m: MethodeTotaal }) {
  const savings = [
    calcPct(m.waterOld, m.water),
    calcPct(m.afvalOld, m.afval),
    calcPct(m.chemieOld, m.chemie),
    calcPct(m.stroomOld, m.stroom),
  ].filter((s) => !isNaN(s) && s > 0);
  const avgSaving =
    savings.length > 0
      ? savings.reduce((a, b) => a + b, 0) / savings.length
      : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-p" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {m.naam}
            </p>
            <p className="text-xs text-slate-400">
              {formatNumber(m.m2)}m² onderhouden
            </p>
          </div>
        </div>
        {avgSaving > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl shrink-0">
            <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 hidden sm:inline">
              Gem. {formatNumber(avgSaving)}% bespaard
            </span>
            <span className="text-xs font-bold text-emerald-700 sm:hidden">
              {formatNumber(avgSaving)}%
            </span>
          </div>
        )}
      </div>
      <div className="px-4 md:px-5 py-2">
        <ResourceRow
          icon={<BeakerIcon className="w-4 h-4 text-blue-600" />}
          label="Waterverbruik"
          unit="L"
          value={m.water}
          oldValue={m.waterOld}
        />
        <ResourceRow
          icon={<GiWaterRecycling className="w-4 h-4 text-green-600" />}
          label="Afvalwater"
          unit="L"
          value={m.afval}
          oldValue={m.afvalOld}
        />
        <ResourceRow
          icon={<FireIcon className="w-4 h-4 text-orange-500" />}
          label="Chemieverbruik"
          unit="L"
          value={m.chemie}
          oldValue={m.chemieOld}
        />
        <ResourceRow
          icon={<BsLightning className="w-4 h-4 text-amber-500" />}
          label="Stroomverbruik"
          unit="kWh"
          value={m.stroom}
          oldValue={m.stroomOld}
        />
      </div>
      <div className="px-4 md:px-5 py-3 bg-slate-50/60 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Per m²
        </p>
        <div className="flex items-center gap-3 overflow-x-auto">
          {[
            {
              label: "Water",
              value: m.m2 > 0 ? m.water / m.m2 : 0,
              unit: "L",
              color: "text-blue-600",
            },
            {
              label: "Afval",
              value: m.m2 > 0 ? m.afval / m.m2 : 0,
              unit: "L",
              color: "text-green-600",
            },
            {
              label: "Chemie",
              value: m.m2 > 0 ? m.chemie / m.m2 : 0,
              unit: "L",
              color: "text-orange-500",
            },
            {
              label: "Stroom",
              value: m.m2 > 0 ? m.stroom / m.m2 : 0,
              unit: "kWh",
              color: "text-amber-600",
            },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-400">{label}:</span>
              <span className={`text-[10px] font-bold ${color}`}>
                {formatNumber(value, 3)} {unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { id: string; naam: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 px-3 py-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${selected.length > 0 ? "bg-p/8 border-p/20 text-p" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-p text-white text-[10px] font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDownIcon
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full mt-2 left-0 min-w-[200px] bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-300">Geen opties</p>
            ) : (
              options.map((o) => (
                <div
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${selected.includes(o.id) ? "bg-p/5" : ""}`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected.includes(o.id) ? "bg-p border-p" : "border-slate-300"}`}
                  >
                    {selected.includes(o.id) && (
                      <div className="w-2 h-2 rounded-sm bg-white" />
                    )}
                  </div>
                  <p
                    className={`text-sm font-medium truncate ${selected.includes(o.id) ? "text-p" : "text-slate-700"}`}
                  >
                    {o.naam}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MilieuPage() {
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allLocaties, setAllLocaties] = useState<Locatie[]>([]);
  const [allMethodes, setAllMethodes] = useState<Methode[]>([]);
  const [totals, setTotals] = useState<Totals>({
    m2: 0,
    water: 0,
    waterOld: 0,
    afval: 0,
    afvalOld: 0,
    chemie: 0,
    chemieOld: 0,
    stroom: 0,
    stroomOld: 0,
    co2actualTon: 0,
    co2savedTon: 0,
    co2pct: 0,
  });
  const [methodeTotalen, setMethodeTotalen] = useState<MethodeTotaal[]>([]);

  const [filters, setFilters] = useState<Filters>({
    locatieIds: [],
    methodeIds: [],
    vanDatum: "",
    totDatum: "",
  });
  const hasFilters =
    filters.locatieIds.length > 0 ||
    filters.methodeIds.length > 0 ||
    !!filters.vanDatum ||
    !!filters.totDatum;
  const showMethodeCards = filters.methodeIds.length > 0;

  useEffect(() => {
    async function loadOptions() {
      const [{ data: locaties }, { data: methodes }] = await Promise.all([
        supabase.from("locaties").select("id, naam, plaats").order("naam"),
        supabase
          .from("reinigings_methodes")
          .select("id, naam")
          .order("sort_num"),
      ]);
      setAllLocaties(
        (locaties ?? []).map((d) => ({
          id: d.id,
          naam: d.naam,
          plaats: d.plaats,
        })),
      );
      setAllMethodes((methodes ?? []).map((d) => ({ id: d.id, naam: d.naam })));
    }
    loadOptions();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    const { data: projectData } = await supabase
      .from("projecten")
      .select(
        "start_datum, eind_datum, project_bussen(bussen(type)), locaties(afstand, id)",
      )
      .eq("status", "afgerond");

    let co2max = 0,
      co2total = 0;
    (projectData ?? []).forEach((d: any) => {
      if (!d.start_datum || !d.eind_datum) return;
      if (
        filters.locatieIds.length > 0 &&
        !filters.locatieIds.includes(d.locaties?.id)
      )
        return;
      const afstand = Number(d?.locaties?.afstand) || 0;
      const diffDays =
        Math.ceil(
          (new Date(d.eind_datum).getTime() -
            new Date(d.start_datum).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      const kmDriven = afstand * diffDays * 2;
      (d.project_bussen || []).forEach((pb: any) => {
        const type = pb.bussen?.type;
        co2max += kmDriven * 0.173;
        if (type === "Diesel") co2total += kmDriven * 0.173;
        else if (type === "HVO100") co2total += kmDriven * 0.017;
      });
    });

    const co2actualTon = Number((co2total / 1000).toFixed(2));
    const co2savedTon = Number(((co2max - co2total) / 1000).toFixed(2));
    const co2pct = co2max > 0 ? ((co2max - co2total) / co2max) * 100 : 0;

    // Gewassen vloeren
    let query = supabase.from("gewassen_vloeren").select(`
      vierkante_meter, aangemaakt_op, reinigmethode_id,
      reinigings_methodes(id, naam, waterverbruik, afvalwater, chemieverbruik, stroom, waterverbruik_old, afvalwater_old, chemieverbruik_old, stroom_old),
      projecten(locatie_id)
    `);

    if (filters.methodeIds.length > 0)
      query = query.in("reinigmethode_id", filters.methodeIds);
    if (filters.vanDatum) query = query.gte("aangemaakt_op", filters.vanDatum);
    if (filters.totDatum)
      query = query.lte("aangemaakt_op", filters.totDatum + "T23:59:59");

    const { data, error } = await query;
    if (error) {
      showToast("Kon gegevens niet laden", "error");
      setLoading(false);
      return;
    }

    const filtered = (data ?? []).filter((d: any) => {
      if (
        filters.locatieIds.length > 0 &&
        !filters.locatieIds.includes(d.projecten?.locatie_id)
      )
        return false;
      return true;
    });

    // Aggregate totals
    let m2 = 0,
      water = 0,
      waterOld = 0,
      afval = 0,
      afvalOld = 0;
    let chemie = 0,
      chemieOld = 0,
      stroom = 0,
      stroomOld = 0;

    // Aggregate per methode
    const methodeMap: Record<string, MethodeTotaal> = {};

    for (const row of filtered) {
      const rm = row.reinigings_methodes as any;
      const v = safenumber(row.vierkante_meter);
      m2 += v;
      water += safenumber(rm?.waterverbruik) * v;
      waterOld += safenumber(rm?.waterverbruik_old) * v;
      afval += safenumber(rm?.afvalwater) * v;
      afvalOld += safenumber(rm?.afvalwater_old) * v;
      chemie += safenumber(rm?.chemieverbruik) * v;
      chemieOld += safenumber(rm?.chemieverbruik_old) * v;
      stroom += safenumber(rm?.stroom) * v;
      stroomOld += safenumber(rm?.stroom_old) * v;

      // Per methode
      const mid = rm?.id ?? row.reinigmethode_id;
      if (mid) {
        if (!methodeMap[mid]) {
          methodeMap[mid] = {
            id: mid,
            naam: rm?.naam ?? "Onbekend",
            m2: 0,
            water: 0,
            waterOld: 0,
            afval: 0,
            afvalOld: 0,
            chemie: 0,
            chemieOld: 0,
            stroom: 0,
            stroomOld: 0,
          };
        }
        methodeMap[mid].m2 += v;
        methodeMap[mid].water += safenumber(rm?.waterverbruik) * v;
        methodeMap[mid].waterOld += safenumber(rm?.waterverbruik_old) * v;
        methodeMap[mid].afval += safenumber(rm?.afvalwater) * v;
        methodeMap[mid].afvalOld += safenumber(rm?.afvalwater_old) * v;
        methodeMap[mid].chemie += safenumber(rm?.chemieverbruik) * v;
        methodeMap[mid].chemieOld += safenumber(rm?.chemieverbruik_old) * v;
        methodeMap[mid].stroom += safenumber(rm?.stroom) * v;
        methodeMap[mid].stroomOld += safenumber(rm?.stroom_old) * v;
      }
    }

    setTotals({
      m2,
      water,
      waterOld,
      afval,
      afvalOld,
      chemie,
      chemieOld,
      stroom,
      stroomOld,
      co2actualTon,
      co2savedTon,
      co2pct,
    });
    setMethodeTotalen(Object.values(methodeMap));
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function clearFilters() {
    setFilters({ locatieIds: [], methodeIds: [], vanDatum: "", totDatum: "" });
  }

  const statCards = [
    {
      icon: <GiWaterDrop className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      label: "Waterverbruik",
      value: totals.water,
      unit: "L gebruikt",
      color: "text-blue-700",
      savedValue: calcSaved(totals.waterOld, totals.water),
      savedUnit: "L",
      savedPct: calcPct(totals.waterOld, totals.water),
    },
    {
      icon: <GiWaterRecycling className="w-4 h-4 text-teal-600" />,
      iconBg: "bg-teal-100",
      label: "Afvalwater",
      value: totals.afval,
      unit: "L geproduceerd",
      color: "text-teal-700",
      savedValue: calcSaved(totals.afvalOld, totals.afval),
      savedUnit: "L",
      savedPct: calcPct(totals.afvalOld, totals.afval),
    },
    {
      icon: <BeakerIcon className="w-4 h-4 text-orange-500" />,
      iconBg: "bg-orange-100",
      label: "Chemieverbruik",
      value: totals.chemie,
      unit: "L gebruikt",
      color: "text-orange-600",
      savedValue: calcSaved(totals.chemieOld, totals.chemie),
      savedUnit: "L",
      savedPct: calcPct(totals.chemieOld, totals.chemie),
    },
    {
      icon: <BsLightning className="w-4 h-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      label: "Stroomverbruik",
      value: totals.stroom,
      unit: "kWh gebruikt",
      color: "text-amber-600",
      savedValue: calcSaved(totals.stroomOld, totals.stroom),
      savedUnit: "kWh",
      savedPct: calcPct(totals.stroomOld, totals.stroom),
    },
    {
      icon: <CloudIcon className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-100",
      label: "CO₂ uitstoot",
      value: totals.co2actualTon,
      unit: "ton uitgestoten",
      color: "text-green-700",
      savedValue: totals.co2savedTon,
      savedUnit: "ton",
      savedPct: totals.co2pct,
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Milieu & Duurzaamheid"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Overzicht
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Milieu & Duurzaamheid
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {formatNumber(totals.m2)}m² totaal onderhouden
                {hasFilters && (
                  <span className="ml-2 text-p font-semibold">· Gefilterd</span>
                )}
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
                  <FunnelIcon className="w-3.5 h-3.5" />
                  Filter
                </div>

                <MultiSelect
                  label="Locatie"
                  options={allLocaties}
                  selected={filters.locatieIds}
                  onChange={(ids) =>
                    setFilters((f) => ({ ...f, locatieIds: ids }))
                  }
                />

                <MultiSelect
                  label="Methode"
                  options={allMethodes}
                  selected={filters.methodeIds}
                  onChange={(ids) =>
                    setFilters((f) => ({ ...f, methodeIds: ids }))
                  }
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-44">
                    <Datepicker
                      title="Van"
                      value={filters.vanDatum}
                      onChange={(val) =>
                        setFilters((f) => ({ ...f, vanDatum: val }))
                      }
                    />
                  </div>
                  <div className="w-44">
                    <Datepicker
                      title="Tot"
                      value={filters.totDatum}
                      onChange={(val) =>
                        setFilters((f) => ({ ...f, totDatum: val }))
                      }
                    />
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer ml-auto"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    Wis filters
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : totals.m2 === 0 && hasFilters ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
                <SparklesIcon className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">
                  Geen gegevens voor deze filters
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Pas de filters aan om resultaten te zien
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 text-xs font-semibold text-p hover:text-p/70 cursor-pointer transition-colors"
                >
                  Filters wissen
                </button>
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  {statCards.map((c, i) => (
                    <StatCard key={i} {...c} />
                  ))}
                </div>

                {/* Per methode cards — only when methode filter active */}
                {showMethodeCards && methodeTotalen.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Per reinigmethode
                      </p>
                      <span className="text-xs font-bold text-p bg-p/8 px-2 py-0.5 rounded-full">
                        {methodeTotalen.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                      {methodeTotalen.map((m) => (
                        <MethodeCard key={m.id} m={m} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
