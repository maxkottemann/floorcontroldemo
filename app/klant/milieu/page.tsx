"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
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
import { formatNumber } from "@/lib/utils";
import SidebarClient from "@/components/layout/sidebarclient";

function safenumber(v: any): number {
  return v ?? 0;
}
function calcSaved(oldVal: number, newVal: number): number {
  return Math.max(oldVal - newVal, 0);
}
function calcPercentageSave(oldVal: number, newVal: number): number {
  if (oldVal === null || oldVal === undefined) return 0;
  if (oldVal === 0) return newVal > 0 ? -100 : 0;
  return ((oldVal - newVal) / oldVal) * 100;
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
  const [co2tonsaved, setco2Tonsaved] = useState(0);

  const router = useRouter();

  useEffect(() => {
    async function getKMs() {
      const { data } = await supabase
        .from("projecten")
        .select(
          "start_datum,eind_datum,project_bussen(bussen(type)),locaties(afstand)",
        )
        .eq("status", "afgerond");

      let total = 0;
      let max = 0;

      (data || []).forEach((d: any) => {
        if (!d.start_datum || !d.eind_datum) return;
        const start = new Date(d.start_datum);
        const end = new Date(d.eind_datum);

        const afstand = Number(d?.locaties?.afstand) || 0;

        const diffDays =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;

        const kmDriven = afstand * diffDays * 2;

        const buses = d.project_bussen || [];

        buses.forEach((pb: any) => {
          const type = pb.bussen?.type;

          max += kmDriven * 0.173;

          if (type === "Diesel") {
            total += kmDriven * 0.173;
          } else if (type === "HVO100") {
            total += kmDriven * 0.017;
          }
        });
      });

      const kgsaved = Number(max - total);
      setco2Tonsaved(kgsaved);
      const tonssaved = Number(((max - total) / 1000).toFixed(2));
      setco2Tonsaved(tonssaved);

      const co2saved = max > 0 ? ((max - total) / max) * 100 : 0;
      setco2saved(co2saved);
    }

    getKMs();
  }, []);

  useEffect(() => {
    async function getReinigmethodes() {
      const { data, error } = await supabase
        .from("gewassen_vloeren_per_methode")
        .select("*")
        .order("sort_num", { ascending: true });
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
          vierkante_meter: d.vierkante_meter,
        })),
      );
      setLoading(false);
      console.log(data);
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
  console.log(totalM2);
  const chemieBesparing = totalChemieOld - totalChemie;
  const waterBesparing = totalWaterOld - totalWater;
  const afvalBesparing = totalAfvalOld - totalAfval;
  const stroomBesparing = totalStroomOld - totalStroom;

  const waterSaving = calcPercentageSave(totalWaterOld, totalWater);
  const afvalSaving = calcPercentageSave(totalAfvalOld, totalAfval);
  const chemieSaving = calcPercentageSave(totalChemieOld, totalChemie);
  const stroomSaving = calcPercentageSave(totalStroomOld, totalStroom);

  const statCards = [
    {
      icon: <GiWaterDrop className="w-4 h-4 text-blue-600" />,
      iconBg: "bg-blue-100",
      label: "Waterverbruik",
      currentValue: totalWater,
      currentUnit: "L gebruikt",
      currentColor: "text-blue-700",
      savedValue: waterBesparing,
      savedUnit: "L",
      savedPct: waterSaving,
    },
    {
      icon: <GiWaterRecycling className="w-4 h-4 text-teal-600" />,
      iconBg: "bg-teal-100",
      label: "Afvalwater",
      currentValue: totalAfval,
      currentUnit: "L geproduceerd",
      currentColor: "text-teal-700",
      savedValue: afvalBesparing,
      savedUnit: "L",
      savedPct: afvalSaving,
    },
    {
      icon: <BeakerIcon className="w-4 h-4 text-orange-500" />,
      iconBg: "bg-orange-100",
      label: "Chemieverbruik",
      currentValue: totalChemie,
      currentUnit: "L gebruikt",
      currentColor: "text-orange-600",
      savedValue: chemieBesparing,
      savedUnit: "L",
      savedPct: chemieSaving,
    },
    {
      icon: <BsLightning className="w-4 h-4 text-amber-500" />,
      iconBg: "bg-amber-100",
      label: "Stroomverbruik",
      currentValue: totalStroom,
      currentUnit: "kWh gebruikt",
      currentColor: "text-amber-600",
      savedValue: stroomBesparing,
      savedUnit: "kWh",
      savedPct: stroomSaving,
    },
    {
      icon: <CloudIcon className="w-4 h-4 text-green-600" />,
      iconBg: "bg-green-100",
      label: "CO₂ uitstoot",
      currentValue: totaalKGco2,
      currentUnit: "ton uitgestoten",
      currentColor: "text-green-700",
      savedValue: co2tonsaved,
      savedUnit: "ton",
      savedPct: co2saved,
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
                  {formatNumber(totalM2)}m² totaal onderhouden
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
              {statCards.map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.iconBg}`}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {c.label}
                    </p>
                    <p
                      className={`text-xl md:text-2xl font-bold tracking-tight ${c.currentColor}`}
                    >
                      {formatNumber(c.currentValue)}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {c.currentUnit}
                      </span>
                    </p>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-emerald-700">
                      Bespaard: {formatNumber(c.savedValue)} {c.savedUnit}
                    </span>
                    {c.savedPct > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                        {formatNumber(c.savedPct)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
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

                  const savings = [
                    waterOld,
                    afvalOld,
                    chemieOld,
                    stroomOld,
                  ].map((old, i) => {
                    const cur = [water, afval, chemie, stroom][i];

                    if (old == null) return 0;

                    return calcPercentageSave(old, cur);
                  });
                  const validSavings = savings.filter((s) => !isNaN(s));

                  const avgSaving =
                    validSavings.length > 0
                      ? validSavings.reduce((a, b) => a + b, 0) /
                        validSavings.length
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
                              {formatNumber(safenumber(rm.vierkante_meter))}m²
                              onderhouden
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
                              value: formatNumber(
                                safenumber(rm.waterverbruik),
                                3,
                              ),
                              unit: "L",
                              color: "text-blue-600",
                            },
                            {
                              label: "Afval",
                              value: formatNumber(safenumber(rm.afvalwater), 3),
                              unit: "L",
                              color: "text-green-600",
                            },
                            {
                              label: "Chemie",
                              value: formatNumber(
                                safenumber(rm.chemieverbruik),
                                3,
                              ),
                              unit: "L",
                              color: "text-orange-500",
                            },
                            {
                              label: "Stroom",
                              value: formatNumber(
                                safenumber(rm.stroomverbruik),
                                3,
                              ),
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
