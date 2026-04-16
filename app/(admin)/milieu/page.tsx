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
  BoltIcon,
  SparklesIcon,
  ArrowTrendingDownIcon,
  CheckBadgeIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { GiWaterDrop, GiWaterRecycling } from "react-icons/gi";
import { BsLightning } from "react-icons/bs";

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

function WaterRow({ value, oldValue }: { value: number; oldValue?: number }) {
  const saved = oldValue && oldValue > 0 ? calcSaved(oldValue, value) : 0;
  const pct =
    oldValue && oldValue > 0 ? calcPercentageSave(oldValue, value) : 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-100 shrink-0">
          <BeakerIcon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Waterverbruik</p>
          <p className="text-[11px] text-slate-400">
            {formatNumber(value)} L gebruikt
          </p>
        </div>
      </div>
      {saved > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            −{formatNumber(saved)} L · {pct.toFixed(0)}%
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-300">Geen besparing</span>
      )}
    </div>
  );
}

function AfvalRow({ value, oldValue }: { value: number; oldValue?: number }) {
  const saved = oldValue && oldValue > 0 ? calcSaved(oldValue, value) : 0;
  const pct =
    oldValue && oldValue > 0 ? calcPercentageSave(oldValue, value) : 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-100 shrink-0">
          <GiWaterRecycling className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Afvalwater</p>
          <p className="text-[11px] text-slate-400">
            {formatNumber(value)} L gebruikt
          </p>
        </div>
      </div>
      {saved > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            −{formatNumber(saved)} L · {pct.toFixed(0)}%
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-300">Geen besparing</span>
      )}
    </div>
  );
}

function ChemieRow({ value, oldValue }: { value: number; oldValue?: number }) {
  const saved = oldValue && oldValue > 0 ? calcSaved(oldValue, value) : 0;
  const pct =
    oldValue && oldValue > 0 ? calcPercentageSave(oldValue, value) : 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-100 shrink-0">
          <FireIcon className="w-4 h-4 text-orange-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Chemieverbruik</p>
          <p className="text-[11px] text-slate-400">
            {formatNumber(value)} L gebruikt
          </p>
        </div>
      </div>
      {saved > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            −{formatNumber(saved)} L · {pct.toFixed(0)}%
          </span>
        </div>
      ) : (
        <span className="text-xs text-slate-300">Geen besparing</span>
      )}
    </div>
  );
}

function StroomRow({ value, oldValue }: { value: number; oldValue?: number }) {
  const saved = oldValue && oldValue > 0 ? calcSaved(oldValue, value) : 0;
  const pct =
    oldValue && oldValue > 0 ? calcPercentageSave(oldValue, value) : 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-yellow-100 shrink-0">
          <BsLightning className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Stroomverbruik</p>
          <p className="text-[11px] text-slate-400">
            {formatNumber(value)} kWh gebruikt
          </p>
        </div>
      </div>
      {saved > 0 ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
          <ArrowTrendingDownIcon className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-700">
            −{formatNumber(saved)} kWh · {pct.toFixed(0)}%
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

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Milieu & Duurzaamheid" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Overzicht
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Milieu & Duurzaamheid
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Verbruik en besparing per reinigingsmethode ·{" "}
                {totalM2.toFixed(0)}m² totaal onderhouden
              </p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 mb-4">
                  <GiWaterDrop className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-700 tracking-tight">
                  {formatNumber(totalWater)}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    L
                  </span>
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Waterverbruik
                </p>
                {waterSaving > 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <ArrowTrendingDownIcon className="w-3 h-3 shrink-0" />
                    {waterSaving.toFixed(0)}% minder dan standaard
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-100 mb-4">
                  <GiWaterRecycling className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600 tracking-tight">
                  {formatNumber(totalAfval)}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    L
                  </span>
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Afvalwater
                </p>
                {afvalSaving > 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <ArrowTrendingDownIcon className="w-3 h-3 shrink-0" />
                    {afvalSaving.toFixed(0)}% minder dan standaard
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 mb-4">
                  <BeakerIcon className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-2xl font-bold text-orange-500 tracking-tight">
                  {formatNumber(totalChemie)}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    L
                  </span>
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Chemieverbruik
                </p>
                {chemieSaving > 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <ArrowTrendingDownIcon className="w-3 h-3 shrink-0" />
                    {chemieSaving.toFixed(0)}% minder dan standaard
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-100 mb-4">
                  <BsLightning className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-600 tracking-tight">
                  {formatNumber(totalStroom)}
                  <span className="text-sm font-medium text-slate-400 ml-1">
                    kWh
                  </span>
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Stroomverbruik
                </p>
                {stroomSaving > 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <ArrowTrendingDownIcon className="w-3 h-3 shrink-0" />
                    {stroomSaving.toFixed(0)}% minder dan standaard
                  </p>
                )}
              </div>
            </div>

            {/* Per methode cards */}
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

                  const wSave = waterOld
                    ? calcPercentageSave(waterOld, water)
                    : 0;
                  const aSave = afvalOld
                    ? calcPercentageSave(afvalOld, afval)
                    : 0;
                  const cSave = chemieOld
                    ? calcPercentageSave(chemieOld, chemie)
                    : 0;
                  const sSave = stroomOld
                    ? calcPercentageSave(stroomOld, stroom)
                    : 0;

                  const savings = [wSave, aSave, cSave, sSave].filter(
                    (s) => s > 0,
                  );
                  const avgSaving =
                    savings.length > 0
                      ? savings.reduce((a, b) => a + b, 0) / savings.length
                      : 0;

                  return (
                    <div
                      key={rm.reinigmethode_id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-p" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {rm.reinigmethode_naam}
                            </p>
                            <p className="text-xs text-slate-400">
                              {safenumber(rm.vierkante_meter).toFixed(0)}m²
                              onderhouden
                            </p>
                          </div>
                        </div>
                        {avgSaving > 0 && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700">
                              Gem. {avgSaving.toFixed(0)}% bespaard
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="px-5 py-2">
                        <WaterRow value={water} oldValue={waterOld} />
                        <AfvalRow value={afval} oldValue={afvalOld} />
                        <ChemieRow value={chemie} oldValue={chemieOld} />
                        <StroomRow value={stroom} oldValue={stroomOld} />
                      </div>

                      <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center gap-4 flex-wrap">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Per m²
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">
                            Water:
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">
                            {safenumber(rm.waterverbruik).toFixed(3)} L
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">
                            Afval:
                          </span>
                          <span className="text-[10px] font-bold text-green-600">
                            {safenumber(rm.afvalwater).toFixed(3)} L
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">
                            Chemie:
                          </span>
                          <span className="text-[10px] font-bold text-orange-500">
                            {safenumber(rm.chemieverbruik).toFixed(3)} L
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">
                            Stroom:
                          </span>
                          <span className="text-[10px] font-bold text-amber-600">
                            {safenumber(rm.stroomverbruik).toFixed(3)} kWh
                          </span>
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
