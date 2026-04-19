"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { gewassenvloer } from "@/types/gewassenvloer";
import { kamervloer } from "@/types/kamervloer";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  SwatchIcon,
  SparklesIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CgClose } from "react-icons/cg";
import { error } from "console";

function DonutChart({
  segments,
  size = 130,
  strokeWidth = 18,
  centerLabel,
  centerSub,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerSub: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  let offset = 0;
  const paths = segments.map((seg, i) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circ;
    const gap = circ - dash;
    const el = (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset * circ}
        strokeLinecap="butt"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    );
    offset += pct;
    return el;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
        ) : (
          paths
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-bold text-slate-800 leading-none">
          {centerLabel}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">
          {centerSub}
        </p>
      </div>
    </div>
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLORS = [
  "#154273",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#84cc16",
];

export default function RapportBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const { id } = useParams();

  const [allFinishedFloors, setAllFinishedFloors] = useState<gewassenvloer[]>(
    [],
  );
  const [allScheduledFloors, setAllScheduledFloors] = useState<kamervloer[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [kmDriven, setKmDriven] = useState(1);

  useEffect(() => {
    async function getKm() {
      const { data, error } = await supabase
        .from("projecten")
        .select(
          "locaties(afstand), start_datum, eind_datum, project_bussen(id)",
        )
        .eq("id", id)
        .single();

      if (!data || error) {
        showToast("Kon afstand niet berekenen", "error");
        console.log(error);
        return;
      }

      const locatie = data.locaties as any;
      const afstand = locatie?.afstand ?? 0;

      const start = new Date(data.start_datum);
      const end = new Date(data.eind_datum);
      const days = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      const aantalBussen = (data.project_bussen as any[]).length;
      setKmDriven(days * afstand * 2 * aantalBussen);

      getKm();
    }
  }, [id]);

  useEffect(() => {
    async function getProjectData() {
      if (!id) return;
      setLoading(true);
      try {
        const { data: vloerIds } = await supabase
          .from("project_vloeren")
          .select("kamervloer_id")
          .eq("project_id", id);

        if (!vloerIds?.length) {
          setAllFinishedFloors([]);
          setAllScheduledFloors([]);
          return;
        }

        const ids = vloerIds.map((v) => v.kamervloer_id);
        const { data: floors } = await supabase
          .from("kamer_vloeren")
          .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
          .in("id", ids);
        setAllScheduledFloors(
          (floors ?? []).map((d) => ({
            id: d.id,
            kamer_id: d.kamer_id,
            vloertype_naam: (d.vloer_types as any)?.naam,
            vierkante_meter: d.vierkante_meter,
            status: d.status,
          })),
        );

        const { data: finished, error: finishedError } = await supabase
          .from("gewassen_vloeren")
          .select(
            "id,kamervloer_id,kamer_vloeren(status,vloer_types(naam)),project_id,projecten(naam),reinigmethode_id,reinigings_methodes(naam),vierkante_meter,opmerking,aangemaakt_op",
          )
          .eq("project_id", id)
          .order("aangemaakt_op", { ascending: false });

        if (finishedError) console.log("finished error:", finishedError);

        setAllFinishedFloors(
          (finished ?? []).map((d: any) => ({
            id: d.id,
            kamervloer_id: d.kamervloer_id,
            kamervloernaam: d.kamer_vloeren?.vloer_types?.naam ?? "—",
            kamervloer_status: d.kamer_vloeren?.status ?? "—",
            project_id: d.project_id,
            project_naam: d.projecten?.naam ?? "—",
            reinigMethode_id: d.reinigins_methode_id ?? "",
            reinigMethode_naam: d.reinigings_methodes?.naam ?? "—",
            vierkante_meter: d.vierkante_meter,
            opmerking: d.opmerking ?? "",
            aangemaakt_op: d.aangemaakt_op,
          })),
        );
      } catch (err) {
        console.log("getProjectData error:", err);
      } finally {
        setLoading(false);
      }
    }
    getProjectData();
  }, [id]);

  const totalM2 = allScheduledFloors.reduce(
    (s, v) => s + (v.vierkante_meter ?? 0),
    0,
  );
  const washedM2 = allFinishedFloors.reduce(
    (s, v) => s + (v.vierkante_meter ?? 0),
    0,
  );
  const washedFloorIds = new Set(
    allFinishedFloors.map((f: any) => f.kamervloer_id).filter(Boolean),
  );
  const doneCount = washedFloorIds.size;
  const totalCount = allScheduledFloors.length;
  const todoCount = Math.max(0, totalCount - doneCount);
  const progressPct = totalM2 > 0 ? Math.round((washedM2 / totalM2) * 100) : 0;

  const vloertypeMap: Record<string, number> = {};
  for (const f of allFinishedFloors) {
    const key =
      f.kamervloernaam && f.kamervloernaam !== "—"
        ? f.kamervloernaam
        : "Onbekend";
    vloertypeMap[key] = (vloertypeMap[key] ?? 0) + (f.vierkante_meter ?? 0);
  }
  const vloertypeSegments = Object.entries(vloertypeMap).map(
    ([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }),
  );

  const methodeMap: Record<string, number> = {};
  for (const f of allFinishedFloors) {
    const key =
      f.reinigMethode_naam && f.reinigMethode_naam !== "—"
        ? f.reinigMethode_naam
        : "Onbekend";
    methodeMap[key] = (methodeMap[key] ?? 0) + 1;
  }
  const methodeSegments = Object.entries(methodeMap).map(
    ([label, value], i) => ({
      label,
      value,
      color: COLORS[(i + 3) % COLORS.length],
    }),
  );

  const progressSegments = [
    { label: "Gereed", value: doneCount, color: "#154273" },
    { label: "Niet onderhouden", value: todoCount, color: "#e2e8f0" },
  ];

  const opmerkingen = allFinishedFloors.filter((f) => f.opmerking);

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Rapport bekijken" />

        <main className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Projectrapport
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {allFinishedFloors[0]?.project_naam ?? "Project"}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Overzicht van uitgevoerde werkzaamheden
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      {
                        label: "Totaal m² onderhouden",
                        value: `${washedM2}m²`,
                        sub: `van ${totalM2}m² gepland`,
                        accent: true,
                      },
                      {
                        label: "Voortgang",
                        value: `${progressPct}%`,
                        sub: "compleet",
                      },
                      {
                        label: "Gereed",
                        value: doneCount,
                        sub: `van ${totalCount} vloeren`,
                      },
                      {
                        label: "Niet onderhouden",
                        value: todoCount,
                        sub: "vloeren openstaand",
                      },
                      {
                        label: "Gereden km",
                        value: `${kmDriven}km`,
                        sub: "totaal heen en terug",
                      },
                    ].map(({ label, value, sub, accent }: any) => (
                      <div
                        key={label}
                        className={`rounded-2xl border shadow-sm px-5 py-4 ${accent ? "bg-p border-p/20" : "bg-white border-slate-100"}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${accent ? "text-white/60" : "text-slate-400"}`}
                        >
                          {label}
                        </p>
                        <p
                          className={`text-3xl font-bold leading-tight ${accent ? "text-white" : "text-p"}`}
                        >
                          {value}
                        </p>
                        <p
                          className={`text-xs mt-1 ${accent ? "text-white/60" : "text-slate-400"}`}
                        >
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
                    <div className="flex items-center gap-4">
                      <p className="text-xs font-bold text-slate-500 shrink-0">
                        Voortgang m²
                      </p>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-p rounded-full transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 shrink-0">
                        {washedM2}m² / {totalM2}m²
                      </p>
                      <p className="text-xs font-bold text-p shrink-0">
                        {progressPct}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                      <p className="text-sm font-bold text-slate-800 mb-5">
                        Vloeren gereed
                      </p>
                      <div className="flex items-center gap-5 flex-1">
                        <DonutChart
                          segments={progressSegments}
                          centerLabel={`${doneCount}/${totalCount}`}
                          centerSub="vloeren"
                        />
                        <div className="space-y-3 flex-1">
                          {progressSegments.map((s) => (
                            <div
                              key={s.label}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                              <p className="text-xs text-slate-600 flex-1">
                                {s.label}
                              </p>
                              <p className="text-xs font-bold text-slate-700">
                                {s.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                      <p className="text-sm font-bold text-slate-800 mb-5">
                        Vloerverdeling
                      </p>
                      {vloertypeSegments.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                          Geen data
                        </div>
                      ) : (
                        <div className="flex items-center gap-5 flex-1">
                          <DonutChart
                            segments={vloertypeSegments}
                            centerLabel={`${washedM2}m²`}
                            centerSub="onderhouden"
                          />
                          <div className="space-y-2 flex-1">
                            {vloertypeSegments.map((s) => (
                              <div
                                key={s.label}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: s.color }}
                                />
                                <p className="text-xs text-slate-600 flex-1 truncate">
                                  {s.label}
                                </p>
                                <p className="text-xs font-bold text-slate-700">
                                  {s.value}m²
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                      <p className="text-sm font-bold text-slate-800 mb-5">
                        Reinigingsmethodes
                      </p>
                      {methodeSegments.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                          Geen data
                        </div>
                      ) : (
                        <div className="flex items-center gap-5 flex-1">
                          <DonutChart
                            segments={methodeSegments}
                            centerLabel={`${allFinishedFloors.length}`}
                            centerSub="totaal"
                          />
                          <div className="space-y-2 flex-1">
                            {methodeSegments.map((s) => (
                              <div
                                key={s.label}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: s.color }}
                                />
                                <p className="text-xs text-slate-600 flex-1 truncate">
                                  {s.label}
                                </p>
                                <p className="text-xs font-bold text-slate-700">
                                  {s.value}x
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Onderhoudsgeschiedenis table */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center">
                        <CheckCircleIcon className="w-4 h-4 text-p" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Onderhoudsgeschiedenis
                        </p>
                        <p className="text-xs text-slate-400">
                          {allFinishedFloors.length} sessies geregistreerd
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_200px_80px_120px_80px] px-6 py-2.5 border-b border-slate-50 bg-slate-50/60">
                      {["Vloertype", "Methode", "m²", "Datum", "Tijd"].map(
                        (h) => (
                          <p
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                          >
                            {h}
                          </p>
                        ),
                      )}
                    </div>
                    <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                      {allFinishedFloors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <SparklesIcon className="w-7 h-7 text-slate-200 mb-2" />
                          <p className="text-sm text-slate-400">
                            Geen onderhoud geregistreerd
                          </p>
                        </div>
                      ) : (
                        allFinishedFloors.map((f, i) => (
                          <div
                            key={f.id}
                            className={`grid grid-cols-[1fr_200px_80px_120px_80px] items-center px-6 py-3 ${i === 0 ? "bg-emerald-50/30" : ""}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${i === 0 ? "bg-emerald-100" : "bg-slate-100"}`}
                              >
                                <SwatchIcon
                                  className={`w-3.5 h-3.5 ${i === 0 ? "text-emerald-600" : "text-slate-400"}`}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">
                                  {f.kamervloernaam}
                                </p>
                                {f.opmerking && (
                                  <p className="text-xs text-amber-500 truncate flex items-center gap-1">
                                    <ChatBubbleBottomCenterTextIcon className="w-3 h-3 shrink-0" />
                                    {f.opmerking}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 truncate">
                              {f.reinigMethode_naam}
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                              {f.vierkante_meter}m²
                            </p>
                            <p className="text-sm text-slate-400">
                              {formatDate(f.aangemaakt_op)}
                            </p>
                            <p className="text-sm text-slate-400">
                              {formatTime(f.aangemaakt_op)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Niet onderhouden */}
                  {todoCount > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Niet onderhouden
                          </p>
                          <p className="text-xs text-slate-400">
                            {todoCount} vloer{todoCount !== 1 ? "en" : ""} niet
                            uitgevoerd
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_100px_100px] px-6 py-2.5 border-b border-slate-50 bg-slate-50/60">
                        {["Vloertype", "m²", "Status"].map((h) => (
                          <p
                            key={h}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                          >
                            {h}
                          </p>
                        ))}
                      </div>
                      <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                        {allScheduledFloors
                          .filter((f) => !washedFloorIds.has(f.id))
                          .map((f) => (
                            <div
                              key={f.id}
                              className="grid grid-cols-[1fr_100px_100px] items-center px-6 py-3"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <SwatchIcon className="w-3.5 h-3.5 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-600 truncate">
                                  {f.vloertype_naam ?? "Onbekend"}
                                </p>
                              </div>
                              <p className="text-sm text-slate-400">
                                {f.vierkante_meter}m²
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-500 border border-slate-200 w-fit">
                                <CgClose></CgClose>
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-5 border-b border-slate-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-p/60 mb-2">
                        Project
                      </p>
                      <p className="text-base font-bold text-slate-800">
                        {allFinishedFloors[0]?.project_naam ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {allFinishedFloors.length} onderhoudsbeurten ·{" "}
                        {totalCount} vloeren gepland
                      </p>
                    </div>

                    <div className="px-5 py-4 border-b border-slate-50">
                      <button
                        onClick={() => router.push(`/projecten/bekijken/${id}`)}
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl bg-p/5 hover:bg-p/10 border border-p/15 transition-all duration-150 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-p/15 flex items-center justify-center shrink-0">
                          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-p" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-p">
                            Bekijk project
                          </p>
                          <p className="text-xs text-p/60">
                            Ga naar projectoverzicht
                          </p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-p/40 group-hover:text-p shrink-0 transition-colors" />
                      </button>
                    </div>

                    <div className="p-5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                        Rapport genereren
                      </p>
                      {[
                        {
                          label: "Vloerrapport",
                          sub: "Overzicht van alle vloeren en m²",
                        },
                        {
                          label: "Projectrapport",
                          sub: "Volledig projectoverzicht",
                        },
                      ].map(({ label, sub }) => (
                        <button
                          key={label}
                          onClick={() =>
                            router.push(
                              `/rapporten/${id}?type=${label.toLowerCase()}`,
                            )
                          }
                          className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-p/30 hover:bg-p/5 transition-all duration-150 group text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-p/10 flex items-center justify-center shrink-0 transition-colors">
                            <ArrowDownTrayIcon className="w-4 h-4 text-slate-400 group-hover:text-p transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 group-hover:text-p transition-colors">
                              {label}
                            </p>
                            <p className="text-xs text-slate-400">{sub}</p>
                          </div>
                          <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                      Kilometers
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Totaal gereden</p>
                      <p className="text-sm font-bold text-p">
                        {Math.round(kmDriven)} km
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Heen en terug · alle bussen
                    </p>
                  </div>

                  {opmerkingen.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <p className="text-sm font-bold text-slate-800">
                          Opmerkingen
                        </p>
                        <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          {opmerkingen.length}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-50 max-h-52 overflow-y-auto">
                        {opmerkingen.map((f) => (
                          <a
                            href={`/vloerenpaspoort/bekijken/${f.kamervloer_id}`}
                            key={f.id}
                          >
                            <div className="flex items-start gap-3 px-5 py-3">
                              <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-amber-500 text-xs font-bold">
                                  !
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-500 truncate">
                                  {f.kamervloernaam}
                                </p>
                                <p className="text-sm text-slate-700 font-medium mt-0.5">
                                  {f.opmerking}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-300 shrink-0 mt-0.5">
                                {formatTime(f.aangemaakt_op)}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
