"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { reinigmethode } from "@/types/reinigmethodesduurzaamheid";
import { supabase } from "@/lib/supabase";
import {
  BeakerIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
  FireIcon,
  PlusIcon,
  CloudIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { GiWaterDrop, GiWaterRecycling } from "react-icons/gi";
import { BsLightning } from "react-icons/bs";
import MainButton from "@/components/layout/mainbutton";
import { useRouter } from "next/navigation";

function safenumber(v: any): number {
  return v ?? 0;
}
function calcSaved(oldVal: number, newVal: number): number {
  return Math.max(oldVal - newVal, 0);
}
function calcPercentageSave(oldVal: number, newVal: number): number {
  if (!oldVal || oldVal === 0) return 0;
  return ((oldVal - newVal) / oldVal) * 100;
}
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(1);
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
  const pct =
    oldValue && oldValue > 0 ? calcPercentageSave(oldValue, value) : 0;
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

export default function MilieuPage() {
  const { toast, showToast, hideToast } = useToast();
  const [reinigmethodes, setReinigMethodes] = useState<reinigmethode[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totaalKGco2, setTotaalKGco2] = useState<number>(0);
  const [maxKGco2, setmaxKGco2] = useState<number>(0);
  const [co2saved, setco2saved] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    async function getKMs() {
      const { data } = await supabase
        .from("projecten")
        .select(
          "start_datum,eind_datum,project_bussen(bussen(type)),locaties(afstand)",
        )
        .eq("status", "afgerond");

      let total = 0; // actual emissions
      let max = 0; // all diesel baseline

      (data || []).forEach((d: any) => {
        const start = new Date(d.start_datum);
        const end = new Date(d.eind_datum);

        const afstand = Number(d?.locaties?.afstand) || 0;

        const diffDays =
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

        const kmDriven = afstand * diffDays * 2;

        const buses = d.project_bussen || [];

        buses.forEach((pb: any) => {
          const type = pb.bussen?.type;

          max += kmDriven * 1;

          if (type === "Diesel") {
            total += kmDriven * 0.1;
          }

          if (type === "Elektrisch") {
            total += kmDriven * 0.00000003;
          }
        });
      });

      setTotaalKGco2(total);

      const co2saved = max > 0 ? ((max - total) / max) * 100 : 0;
      setco2saved(co2saved);
    }

    getKMs();
  }, []);

  useEffect(() => {
    async function getReinigmethodes() {
      const { data, error } = await supabase
        .from("gewassen_vloeren_per_methode")
        .select("*");
      if (error) {
        showToast("Er ging iets mis, probeer het opnieuw", "error");
        setLoading(false);
        return;
      }
      setReinigMethodes(
        (data || []).map((d) => ({
          reinigmethode_id: d.reinigmethode_id,
          reinigmethode_naam: d.reinigmethode_naam,
          waterverbruik: d.waterverbruik,
          afvalwater: d.afvalwater,
          chemieverbruik: d.chemieverbruik,
          stroomverbruik: d.stroom,
          waterverbruik_old: d.waterverbruik_old,
          afvalwater_old: d.afvalwater_old,
          chemievebruik_old: d.chemieverbruik_old,
          stroom_old: d.stroom_old,
          vierkante_meter: d.totaal_vierkante_meter,
        })),
      );
      setLoading(false);
    }
    getReinigmethodes();
  }, []);

  const totalWater = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.waterverbruik) * safenumber(r.vierkante_meter),
    0,
  );
  const totalAfval = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.afvalwater) * safenumber(r.vierkante_meter),
    0,
  );
  const totalChemie = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.chemieverbruik) * safenumber(r.vierkante_meter),
    0,
  );
  const totalStroom = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.stroomverbruik) * safenumber(r.vierkante_meter),
    0,
  );
  const totalM2 = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.vierkante_meter),
    0,
  );
  const totalWaterOld = reinigmethodes.reduce(
    (s, r) =>
      s + safenumber(r.waterverbruik_old) * safenumber(r.vierkante_meter),
    0,
  );
  const totalAfvalOld = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.afvalwater_old) * safenumber(r.vierkante_meter),
    0,
  );
  const totalChemieOld = reinigmethodes.reduce(
    (s, r) =>
      s + safenumber(r.chemievebruik_old) * safenumber(r.vierkante_meter),
    0,
  );
  const totalStroomOld = reinigmethodes.reduce(
    (s, r) => s + safenumber(r.stroom_old) * safenumber(r.vierkante_meter),
    0,
  );

  const waterSaving = calcPercentageSave(totalWaterOld, totalWater);
  const afvalSaving = calcPercentageSave(totalAfvalOld, totalAfval);
  const chemieSaving = calcPercentageSave(totalChemieOld, totalChemie);
  const stroomSaving = calcPercentageSave(totalStroomOld, totalStroom);

  const statCards = [
    {
      icon: <GiWaterDrop className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-100",
      value: totalWater,
      unit: "L",
      label: "Waterverbruik",
      color: "text-blue-700",
      saving: waterSaving,
    },
    {
      icon: <GiWaterRecycling className="w-5 h-5 text-green-600" />,
      bg: "bg-green-100",
      value: totalAfval,
      unit: "L",
      label: "Afvalwater",
      color: "text-green-600",
      saving: afvalSaving,
    },
    {
      icon: <BeakerIcon className="w-5 h-5 text-orange-500" />,
      bg: "bg-orange-100",
      value: totalChemie,
      unit: "L",
      label: "Chemieverbruik",
      color: "text-orange-500",
      saving: chemieSaving,
    },
    {
      icon: <BsLightning className="w-5 h-5 text-amber-500" />,
      bg: "bg-yellow-100",
      value: totalStroom,
      unit: "kWh",
      label: "Stroomverbruik",
      color: "text-amber-600",
      saving: stroomSaving,
    },
    {
      icon: <CloudIcon className="w-5 h-5 text-green-500" />,
      bg: "bg-green-100",
      value: totaalKGco2,
      unit: "kg CO₂",
      label: "CO₂-uitstoot",
      color: "text-green-600",
      saving: co2saved,
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Milieu & Duurzaamheid
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Verbruik en besparing per reinigingsmethode ·{" "}
                  {totalM2.toFixed(0)}m² totaal onderhouden
                </p>
              </div>
              <div className="shrink-0">
                <MainButton
                  onClick={() => router.push("/milieu/kernwaardes")}
                  label="Reinigmethode toevoegen"
                  icon={<PlusIcon />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {statCards.map(
                ({ icon, bg, value, unit, label, color, saving }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5"
                  >
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${bg} mb-3 md:mb-4`}
                    >
                      {icon}
                    </div>
                    <p
                      className={`text-xl md:text-2xl font-bold tracking-tight ${color}`}
                    >
                      {formatNumber(value)}
                      <span className="text-xs md:text-sm font-medium text-slate-400 ml-1">
                        {unit}
                      </span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {label}
                    </p>
                    {saving > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                        <ArrowTrendingDownIcon className="w-3 h-3 shrink-0" />
                        {saving.toFixed(0)}% minder
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : reinigmethodes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20">
                <SparklesIcon className="w-8 h-8 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-400">
                  Geen gegevens beschikbaar
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Er zijn nog geen vloeren gewassen
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
                {reinigmethodes.map((rm) => {
                  const water =
                    safenumber(rm.waterverbruik) *
                    safenumber(rm.vierkante_meter);
                  const afval =
                    safenumber(rm.afvalwater) * safenumber(rm.vierkante_meter);
                  const chemie =
                    safenumber(rm.chemieverbruik) *
                    safenumber(rm.vierkante_meter);
                  const stroom =
                    safenumber(rm.stroomverbruik) *
                    safenumber(rm.vierkante_meter);
                  const waterOld = rm.waterverbruik_old
                    ? rm.waterverbruik_old * safenumber(rm.vierkante_meter)
                    : undefined;
                  const afvalOld = rm.afvalwater_old
                    ? rm.afvalwater_old * safenumber(rm.vierkante_meter)
                    : undefined;
                  const chemieOld = rm.chemievebruik_old
                    ? rm.chemievebruik_old * safenumber(rm.vierkante_meter)
                    : undefined;
                  const stroomOld = rm.stroom_old
                    ? rm.stroom_old * safenumber(rm.vierkante_meter)
                    : undefined;

                  const savings = [waterOld, afvalOld, chemieOld, stroomOld]
                    .map((old, i) => {
                      const cur = [water, afval, chemie, stroom][i];
                      return old ? calcPercentageSave(old, cur) : 0;
                    })
                    .filter((s) => s > 0);
                  const avgSaving =
                    savings.length > 0
                      ? savings.reduce((a, b) => a + b, 0) / savings.length
                      : 0;

                  return (
                    <div
                      key={rm.reinigmethode_id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="px-4 md:px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                            <SparklesIcon className="w-4 h-4 md:w-5 md:h-5 text-p" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {rm.reinigmethode_naam}
                            </p>
                            <p className="text-xs text-slate-400">
                              {safenumber(rm.vierkante_meter).toFixed(0)}m²
                              onderhouden
                            </p>
                          </div>
                        </div>
                        {avgSaving > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl shrink-0">
                            <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 hidden sm:inline">
                              Gem. {avgSaving.toFixed(0)}% bespaard
                            </span>
                            <span className="text-xs font-bold text-emerald-700 sm:hidden">
                              {avgSaving.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="px-4 md:px-5 py-2">
                        <ResourceRow
                          icon={
                            <BeakerIcon className="w-4 h-4 text-blue-600" />
                          }
                          label="Waterverbruik"
                          unit="L"
                          value={water}
                          oldValue={waterOld}
                        />
                        <ResourceRow
                          icon={
                            <GiWaterRecycling className="w-4 h-4 text-green-600" />
                          }
                          label="Afvalwater"
                          unit="L"
                          value={afval}
                          oldValue={afvalOld}
                        />
                        <ResourceRow
                          icon={
                            <FireIcon className="w-4 h-4 text-orange-500" />
                          }
                          label="Chemieverbruik"
                          unit="L"
                          value={chemie}
                          oldValue={chemieOld}
                        />
                        <ResourceRow
                          icon={
                            <BsLightning className="w-4 h-4 text-amber-500" />
                          }
                          label="Stroomverbruik"
                          unit="kWh"
                          value={stroom}
                          oldValue={stroomOld}
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
                              value: safenumber(rm.waterverbruik).toFixed(3),
                              unit: "L",
                              color: "text-blue-600",
                            },
                            {
                              label: "Afval",
                              value: safenumber(rm.afvalwater).toFixed(3),
                              unit: "L",
                              color: "text-green-600",
                            },
                            {
                              label: "Chemie",
                              value: safenumber(rm.chemieverbruik).toFixed(3),
                              unit: "L",
                              color: "text-orange-500",
                            },
                            {
                              label: "Stroom",
                              value: safenumber(rm.stroomverbruik).toFixed(3),
                              unit: "kWh",
                              color: "text-amber-600",
                            },
                          ].map(({ label, value, unit, color }) => (
                            <div
                              key={label}
                              className="flex items-center gap-1 shrink-0"
                            >
                              <span className="text-[10px] text-slate-400">
                                {label}:
                              </span>
                              <span
                                className={`text-[10px] font-bold ${color}`}
                              >
                                {value} {unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
