"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MapPinIcon,
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
  SwatchIcon,
  ChevronRightIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface SteekproefVloer {
  id: string;
  kamervloer_id: string;
  kamer_naam: string;
  verdieping_naam: string;
  bouwdeel_naam: string;
  vloertype_naam: string;
  vierkante_meter: number | null;
  status: string | null;
  goedgekeurd: boolean | null;
  opmerking: string | null;
}

interface Steekproef {
  id: string;
  project_id: string;
  project_naam: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  status: string;
  aangemaakt_op: string;
  afgerond_op: string | null;
  afgerond_door: string | null;
  vloeren: SteekproefVloer[];
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { bg: string; text: string; border: string; dot: string; label: string }
  > = {
    afgerond: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      dot: "bg-emerald-400",
      label: "Afgerond",
    },
    in_progress: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      dot: "bg-amber-400 animate-pulse",
      label: "Bezig",
    },
    open: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      dot: "bg-blue-400",
      label: "Open",
    },
  };
  const s = config[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ProgressBar({ pct, critical }: { pct: number; critical: boolean }) {
  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${critical ? "bg-red-400" : pct >= 100 ? "bg-emerald-400" : "bg-p"}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function SteekproefBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [steekproef, setSteekproef] = useState<Steekproef | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSteekproef() {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("steekproeven")
        .select(
          "id, project_id, status, aangemaakt_op, afgerond_op, afgerond_door,profielen(naam) ,projecten(naam, locaties(naam, plaats))",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        showToast("Steekproef kon niet worden geladen", "error");
        setLoading(false);
        return;
      }

      const { data: vloerData } = await supabase
        .from("steekproef_vloeren")
        .select(
          "id, kamervloer_id, goedgekeurd, opmerking, status, kamer_vloeren(vierkante_meter, vloer_types(naam), kamers(naam, verdiepingen(naam, bouwdeel(naam))))",
        )
        .eq("steekproef_id", id)
        .order("aangemaakt_op", { ascending: true });

      setSteekproef({
        id: data.id,
        project_id: data.project_id,
        project_naam: (data.projecten as any)?.naam ?? "—",
        locatie_naam: (data.projecten as any)?.locaties?.naam ?? "—",
        locatie_plaats: (data.projecten as any)?.locaties?.plaats ?? null,
        status: data.status ?? "open",
        aangemaakt_op: data.aangemaakt_op,
        afgerond_op: data.afgerond_op ?? null,
        afgerond_door: (data.profielen as any)?.naam ?? null,
        vloeren: (vloerData ?? []).map((v: any) => {
          const kv = v.kamer_vloeren;
          const kamer = kv?.kamers;
          const verdieping = kamer?.verdiepingen;
          const bouwdeel = verdieping?.bouwdeel;
          return {
            id: v.id,
            kamervloer_id: v.kamervloer_id,
            kamer_naam: kamer?.naam ?? "—",
            verdieping_naam: verdieping?.naam ?? "—",
            bouwdeel_naam: bouwdeel?.naam ?? "—",
            vloertype_naam: kv?.vloer_types?.naam ?? "Onbekend",
            vierkante_meter: kv?.vierkante_meter ?? null,
            status: v.status ?? null,
            goedgekeurd: v.goedgekeurd ?? null,
            opmerking: v.opmerking ?? null,
          };
        }),
      });
      setLoading(false);
    }
    getSteekproef();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex bg-[#F5F6FA]">
        <Sidebar
          className="fixed top-0 left-0 h-screen"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-col flex-1 h-screen">
          <Topbar
            title="Steekproef"
            onMenuToggle={() => setSidebarOpen((p) => !p)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );

  if (!steekproef) return null;

  const totaal = steekproef.vloeren.length;
  const gedaan = steekproef.vloeren.filter(
    (v) => v.goedgekeurd !== null,
  ).length;
  const goedgekeurd = steekproef.vloeren.filter(
    (v) => v.goedgekeurd === true,
  ).length;
  const afgekeurd = steekproef.vloeren.filter(
    (v) => v.goedgekeurd === false,
  ).length;
  const metOpmerking = steekproef.vloeren.filter((v) => v.opmerking).length;

  const pctGedaan = totaal > 0 ? (gedaan / totaal) * 100 : 0;
  const pctGoedgekeurd = gedaan > 0 ? (goedgekeurd / gedaan) * 100 : 0;
  const isCritical = gedaan > 0 && pctGoedgekeurd < 95;
  const isAfgerond = steekproef.status === "afgerond";

  const grouped: Record<string, Record<string, SteekproefVloer[]>> = {};
  for (const v of steekproef.vloeren) {
    if (!grouped[v.bouwdeel_naam]) grouped[v.bouwdeel_naam] = {};
    if (!grouped[v.bouwdeel_naam][v.verdieping_naam])
      grouped[v.bouwdeel_naam][v.verdieping_naam] = [];
    grouped[v.bouwdeel_naam][v.verdieping_naam].push(v);
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Steekproef"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug naar steekproeven
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                    Steekproef
                  </p>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {steekproef.project_naam}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {steekproef.locatie_naam}
                    </span>
                    {steekproef.locatie_plaats && (
                      <span className="text-sm text-slate-300">
                        · {steekproef.locatie_plaats}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={steekproef.status} />
              </div>
            </div>

            {/* Critical banner */}
            {isCritical && (
              <div className="flex items-start gap-3 px-4 py-4 bg-red-50 border border-red-100 rounded-2xl">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Kritisch — Kwaliteit onder norm
                  </p>
                  <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                    Het goedkeuringspercentage van {pctGoedgekeurd.toFixed(1)}%
                    ligt onder de vereiste drempel van 95%. Direct actie
                    vereist.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Totaal vloeren",
                  value: totaal,
                  sub: "in steekproef",
                  color: "text-p",
                  bg: "bg-p/10",
                  icon: (
                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-p" />
                  ),
                },
                {
                  label: "Gecontroleerd",
                  value: gedaan,
                  sub: `${pctGedaan.toFixed(0)}% gereed`,
                  color: "text-slate-700",
                  bg: "bg-slate-100",
                  icon: <ClockIcon className="w-5 h-5 text-slate-500" />,
                },
                {
                  label: "Goedgekeurd",
                  value: goedgekeurd,
                  sub:
                    gedaan > 0
                      ? `${pctGoedgekeurd.toFixed(1)}% van gecontroleerd`
                      : "—",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  icon: (
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  ),
                },
                {
                  label: "Afgekeurd",
                  value: afgekeurd,
                  sub: afgekeurd > 0 ? "Vereist aandacht" : "Geen problemen",
                  color: afgekeurd > 0 ? "text-red-600" : "text-slate-400",
                  bg: afgekeurd > 0 ? "bg-red-50" : "bg-slate-100",
                  icon: (
                    <XCircleIcon
                      className={`w-5 h-5 ${afgekeurd > 0 ? "text-red-500" : "text-slate-300"}`}
                    />
                  ),
                },
              ].map(({ label, value, sub, color, bg, icon }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}
                  >
                    {icon}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    {label}
                  </p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Progress bars */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Voortgang
              </p>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Gecontroleerd
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {gedaan} / {totaal}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      vloeren
                    </span>
                  </p>
                </div>
                <ProgressBar pct={pctGedaan} critical={false} />
                <p className="text-xs text-slate-400 mt-1">
                  {pctGedaan.toFixed(0)}% van alle vloeren gecontroleerd
                </p>
              </div>

              {gedaan > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        Goedkeuringspercentage
                      </p>
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-[10px] font-bold text-red-600">
                          <ExclamationTriangleIcon className="w-3 h-3" />
                          Kritisch
                        </span>
                      )}
                      {!isCritical && pctGoedgekeurd >= 95 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">
                          <CheckCircleIcon className="w-3 h-3" />
                          Norm gehaald
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm font-bold ${isCritical ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {pctGoedgekeurd.toFixed(1)}%
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        / 95% norm
                      </span>
                    </p>
                  </div>
                  <ProgressBar pct={pctGoedgekeurd} critical={isCritical} />
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-xs ${isCritical ? "text-red-500 font-semibold" : "text-slate-400"}`}
                    >
                      {isCritical
                        ? `${(95 - pctGoedgekeurd).toFixed(1)}% onder de vereiste norm van 95%`
                        : `${(pctGoedgekeurd - 95).toFixed(1)}% boven de norm`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Floor detail table */}
            {totaal > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                    <SwatchIcon className="w-4 h-4 text-p" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      Vloerdetails
                    </h2>
                    <p className="text-xs text-slate-400">
                      {totaal} vloeren · {metOpmerking} met opmerkingen
                    </p>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                          Vloer
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-40">
                          Locatie
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                          Resultaat
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                          Opmerking
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(grouped).map(
                        ([bouwdeel, verdiepingen]) => (
                          <>
                            <tr
                              key={`bd-${bouwdeel}`}
                              className="bg-slate-50/80"
                            >
                              <td colSpan={4} className="px-5 py-2">
                                <div className="flex items-center gap-2">
                                  <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-600">
                                    {bouwdeel}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {Object.entries(verdiepingen).map(
                              ([verdieping, vloeren]) =>
                                vloeren.map((v) => (
                                  <tr
                                    key={v.id}
                                    className={`border-t border-slate-50 ${v.goedgekeurd === false ? "bg-red-50/30" : v.goedgekeurd === true ? "bg-emerald-50/20" : ""}`}
                                  >
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                          <SwatchIcon className="w-3.5 h-3.5 text-p" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">
                                            {v.vloertype_naam}
                                          </p>
                                          {v.vierkante_meter && (
                                            <p className="text-xs text-slate-400">
                                              {v.vierkante_meter}m²
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      <div className="flex items-center gap-1.5">
                                        <HomeModernIcon className="w-3 h-3 text-slate-300 shrink-0" />
                                        <div>
                                          <p className="text-xs font-medium text-slate-600">
                                            {v.kamer_naam}
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            {verdieping}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {v.goedgekeurd === null ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
                                          <ClockIcon className="w-3 h-3" />{" "}
                                          Wacht
                                        </span>
                                      ) : v.goedgekeurd ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                          <CheckCircleIcon className="w-3 h-3" />{" "}
                                          OK
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                          <XCircleIcon className="w-3 h-3" />{" "}
                                          Afgekeurd
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {v.opmerking ? (
                                        <p className="text-xs text-slate-500 max-w-xs truncate">
                                          {v.opmerking}
                                        </p>
                                      ) : (
                                        <span className="text-xs text-slate-200">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )),
                            )}
                          </>
                        ),
                      )}
                    </tbody>
                  </table>
                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                    <p className="text-xs text-slate-400">
                      {totaal} vloer{totaal !== 1 ? "en" : ""} · {goedgekeurd}{" "}
                      goedgekeurd · {afgekeurd} afgekeurd
                    </p>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-50">
                  {Object.entries(grouped).map(([bouwdeel, verdiepingen]) => (
                    <div key={bouwdeel}>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80">
                        <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">
                          {bouwdeel}
                        </span>
                      </div>
                      {Object.entries(verdiepingen).map(
                        ([verdieping, vloeren]) =>
                          vloeren.map((v) => (
                            <div
                              key={v.id}
                              className={`px-4 py-3.5 ${v.goedgekeurd === false ? "bg-red-50/30" : v.goedgekeurd === true ? "bg-emerald-50/20" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                    <SwatchIcon className="w-3.5 h-3.5 text-p" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">
                                      {v.vloertype_naam}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <HomeModernIcon className="w-3 h-3 text-slate-300" />
                                      <p className="text-xs text-slate-400">
                                        {v.kamer_naam} · {verdieping}
                                      </p>
                                      {v.vierkante_meter && (
                                        <span className="text-xs text-slate-300">
                                          · {v.vierkante_meter}m²
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {v.goedgekeurd === null ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 shrink-0">
                                    <ClockIcon className="w-3 h-3" /> Wacht
                                  </span>
                                ) : v.goedgekeurd ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                    <CheckCircleIcon className="w-3 h-3" /> OK
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100 shrink-0">
                                    <XCircleIcon className="w-3 h-3" />{" "}
                                    Afgekeurd
                                  </span>
                                )}
                              </div>
                              {v.opmerking && (
                                <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <p className="text-xs text-amber-700">
                                    {v.opmerking}
                                  </p>
                                </div>
                              )}
                            </div>
                          )),
                      )}
                    </div>
                  ))}
                  <div className="px-4 py-3 bg-slate-50/40">
                    <p className="text-xs text-slate-400 text-center">
                      {totaal} vloer{totaal !== 1 ? "en" : ""} · {goedgekeurd}{" "}
                      goedgekeurd · {afgekeurd} afgekeurd
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Meta info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {[
                  { label: "Project", value: steekproef.project_naam },
                  { label: "Locatie", value: steekproef.locatie_naam },
                  {
                    label: "Status",
                    value:
                      steekproef.status === "afgerond"
                        ? "Afgerond"
                        : steekproef.status === "in_progress"
                          ? "Bezig"
                          : "Open",
                  },
                  {
                    label: "Aangemaakt",
                    value: formatDateTime(steekproef.aangemaakt_op),
                  },
                  {
                    label: "Afgerond op",
                    value: formatDate(steekproef.afgerond_op),
                  },
                  {
                    label: "Afgerond door",
                    value: steekproef.afgerond_door ?? "—",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between px-4 md:px-5 py-3"
                  >
                    <p className="text-xs font-semibold text-slate-400">
                      {label}
                    </p>
                    <p className="text-xs font-bold text-slate-800 text-right max-w-[60%] truncate">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
