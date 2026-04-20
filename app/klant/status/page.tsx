"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useRef, useState } from "react";
import { project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import { kamervloer } from "@/types/kamervloer";
import { gewassenvloer } from "@/types/gewassenvloer";
import {
  MapPinIcon,
  TruckIcon,
  CalendarDaysIcon,
  SignalIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

function DonutChart({
  segments,
  size = 140,
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
        <p className="text-2xl font-bold text-slate-800 leading-none">
          {centerLabel}
        </p>
        <p className="text-xs text-slate-400 mt-1 font-medium">{centerSub}</p>
      </div>
    </div>
  );
}

function ProjectSelector({
  projects,
  active,
  onChange,
}: {
  projects: project[];
  active?: project;
  onChange: (p: project) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border cursor-pointer transition-all duration-150 w-full
          ${open ? "border-p shadow-[0_0_0_3px_rgba(21,66,115,0.08)]" : "border-slate-200 shadow-sm hover:border-p/40"}`}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="flex-1 min-w-full">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Actief project
          </p>
          <p className="text-sm font-bold text-slate-800 truncate">
            {active?.naam ?? "Selecteer project"}
          </p>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {projects.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-300">
              Geen actieve projecten
            </p>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0
                  ${active?.id === p.id ? "bg-p/5" : ""}`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${active?.id === p.id ? "text-p" : "text-slate-700"}`}
                  >
                    {p.naam}
                  </p>
                  {p.locatie_naam && (
                    <p className="text-xs text-slate-400 truncate">
                      {p.locatie_naam}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────
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

export default function StatusPage() {
  const { toast, showToast, hideToast } = useToast();

  const [allActiveProjects, setAlleProjects] = useState<project[]>([]);
  const [activeProject, setActiveProject] = useState<project>();
  const [allFloors, setAllFloors] = useState<kamervloer[]>([]);
  const [finishedFloors, setFinishedFloors] = useState<gewassenvloer[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    async function getAllActiveProjects() {
      const { data, error } = await supabase
        .from("projecten")
        .select(
          "id,locaties(naam),naam,beschrijving,opmerkingen,start_datum,eind_datum,status,project_bussen(bussen(id,naam,kenteken))",
        )
        .eq("status", "bezig");
      if (error) {
        showToast("Kon actieve projecten niet laden", "error");
        return;
      }
      setAlleProjects(
        data.map((d: any) => ({
          id: d.id,
          locatie_naam: (d.locaties as any)?.naam,
          naam: d.naam,
          beschrijving: d.beschrijving,
          opmerkingen: d.opmerkingen,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
          bussen:
            d.project_bussen?.map((pb: any) => ({
              id: pb.bussen?.id,
              naam: pb.bussen?.naam,
              kenteken: pb.bussen?.kenteken,
            })) ?? [],
        })),
      );
    }
    getAllActiveProjects();
  }, []);

  async function loadProjectData(proj: project) {
    const { data: vloerIds } = await supabase
      .from("project_vloeren")
      .select("kamervloer_id")
      .eq("project_id", proj.id);

    if (!vloerIds?.length) {
      setAllFloors([]);
      setFinishedFloors([]);
      return;
    }

    const ids = vloerIds.map((v) => v.kamervloer_id);
    const { data: floors } = await supabase
      .from("kamer_vloeren")
      .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
      .in("id", ids);
    setAllFloors(
      (floors ?? []).map((d) => ({
        id: d.id,
        kamer_id: d.kamer_id,
        vloertype_naam: (d.vloer_types as any)?.naam,
        vierkante_meter: d.vierkante_meter,
        status: d.status,
      })),
    );

    const { data: finished } = await supabase
      .from("gewassen_vloeren")
      .select(
        "id,kamervloer_id,kamer_vloeren(status,vloer_types(naam)),project_id,projecten(naam),reinigmethode_id,reinigings_methodes(naam),vierkante_meter,opmerking,aangemaakt_op",
      )
      .eq("project_id", proj.id)
      .order("aangemaakt_op", { ascending: false });

    console.log(finished);
    setFinishedFloors(
      (finished ?? []).map((d: any) => ({
        id: d.id,
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
    setLastUpdate(new Date());
  }

  useEffect(() => {
    if (!activeProject) return;
    loadProjectData(activeProject);
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;

    const channel = supabase
      .channel(`status-${activeProject.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gewassen_vloeren",
          filter: `project_id=eq.${activeProject.id}`,
        },
        () => {
          loadProjectData(activeProject);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProject]);

  const totalFloors = allFloors.length;
  const totalM2 = allFloors.reduce((s, v) => s + (v.vierkante_meter ?? 0), 0);
  const washedM2 = finishedFloors.reduce(
    (s, v) => s + (v.vierkante_meter ?? 0),
    0,
  );
  const progressPct = totalM2 > 0 ? Math.round((washedM2 / totalM2) * 100) : 0;

  const washedFloorIds = new Set(finishedFloors.map((f: any) => f.id));
  const floorsDone = finishedFloors.length;
  const floorsToDo =
    totalFloors -
    new Set(finishedFloors.map((f: any) => f.kamervloer_id ?? f.id)).size;

  const statusCount = { goed: 0, matig: 0, slecht: 0 };
  for (const f of finishedFloors) {
    const s = (f.kamervloer_status ?? "").toLowerCase();
    if (s === "goed") statusCount.goed++;
    else if (s === "matig") statusCount.matig++;
    else if (s === "slecht") statusCount.slecht++;
  }

  const vloertypeMap: Record<string, number> = {};
  for (const f of finishedFloors) {
    const key =
      f.kamervloernaam && f.kamervloernaam !== "—"
        ? f.kamervloernaam
        : "Onbekend";
    vloertypeMap[key] = (vloertypeMap[key] ?? 0) + (f.vierkante_meter ?? 0);
  }
  const vloertypeSegments = Object.entries(vloertypeMap).map(
    ([label, value], i) => ({
      label,
      value,
      color: COLORS[i % COLORS.length],
    }),
  );

  const methodeMap: Record<string, number> = {};
  for (const f of finishedFloors) {
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
          title="Live status"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            {/* Header bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Dashboard
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeProject?.naam ?? "Live projectstatus"}
                </h1>
                {activeProject?.locatie_naam && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {activeProject.locatie_naam}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {lastUpdate && (
                  <div className=" items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm hidden md:flex">
                    <SignalIcon className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-500">
                      Live · {formatTime(lastUpdate.toISOString())}
                    </p>
                  </div>
                )}
                <ProjectSelector
                  projects={allActiveProjects}
                  active={activeProject}
                  onChange={(p) => setActiveProject(p)}
                />
              </div>
            </div>

            {!activeProject ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                  <SignalIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-400">
                  Selecteer een actief project
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Kies een project rechtsboven om de live status te zien
                </p>
              </div>
            ) : (
              <>
                {/* Project meta */}
                <div className="flex flex-wrap gap-3">
                  {activeProject.start_datum && (
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm w-full md:w-fit">
                      <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">
                        {formatDate(activeProject.start_datum)} —{" "}
                        {formatDate(activeProject.eind_datum)}
                      </span>
                    </div>
                  )}
                  {(activeProject as any).bussen?.map((b: any) => (
                    <div
                      key={b.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm w-full md:w-fit"
                    >
                      <TruckIcon className="w-4 h-4 text-p" />
                      <span className="text-xs font-semibold text-slate-600">
                        {b.naam} · {b.kenteken}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Voortgang",
                      value: `${progressPct}%`,
                      sub: `${washedM2} / ${totalM2}m²`,
                      accent: true,
                    },
                    {
                      label: "Vloeren gereed",
                      value: floorsDone,
                      sub: `van ${totalFloors} vloeren`,
                      accent: false,
                    },
                    {
                      label: "Nog te doen",
                      value: floorsToDo < 0 ? 0 : floorsToDo,
                      sub: "vloeren resterend",
                      accent: false,
                    },
                    {
                      label: "Laatste onderhoud geregisteerd",
                      value: finishedFloors[0]
                        ? formatTime(finishedFloors[0].aangemaakt_op)
                        : "—",
                      sub: finishedFloors[0]
                        ? formatDate(finishedFloors[0].aangemaakt_op)
                        : "Nog geen sessies",
                      accent: false,
                    },
                  ].map(({ label, value, sub, accent }) => (
                    <div
                      key={label}
                      className={`rounded-2xl border shadow-sm px-6 py-5 ${accent ? "bg-p border-p/20" : "bg-white border-slate-100"}`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${accent ? "text-white/60" : "text-slate-400"}`}
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

                {/* Progress bar — slim separator row */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 hidden md:flex">
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
                    <p className="text-xs font-bold text-slate-500 shrink-0">
                      {washedM2}m² / {totalM2}m²
                    </p>
                    <p className="text-xs font-bold text-p shrink-0">
                      {progressPct}%
                    </p>
                  </div>
                </div>

                {/* Row 1 — 3 charts, equal height */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
                  {/* Vloertype donut */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                    <p className="text-sm font-bold text-slate-800 mb-5">
                      Vloerverdeling
                    </p>
                    {vloertypeSegments.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                        Geen data
                      </div>
                    ) : (
                      <div className="flex items-center gap-6">
                        <DonutChart
                          segments={vloertypeSegments}
                          centerLabel={`${washedM2}m²`}
                          centerSub="totaal"
                          size={150}
                          strokeWidth={20}
                        />
                        <div className="flex-1 space-y-2.5">
                          {vloertypeSegments.map((s) => (
                            <div
                              key={s.label}
                              className="flex items-center gap-2.5"
                            >
                              <div
                                className="w-3 h-3 rounded-sm shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                              <p className="text-xs font-medium text-slate-600 flex-1 truncate">
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
                        Nog geen onderhoud uitgevoerd
                      </div>
                    ) : (
                      <div className="flex items-center gap-6">
                        <DonutChart
                          segments={methodeSegments}
                          centerLabel={`${finishedFloors.length}`}
                          centerSub="totaal"
                          size={150}
                          strokeWidth={20}
                        />
                        <div className="flex-1 space-y-2.5">
                          {methodeSegments.map((s) => (
                            <div
                              key={s.label}
                              className="flex items-center gap-2.5"
                            >
                              <div
                                className="w-3 h-3 rounded-sm shrink-0"
                                style={{ backgroundColor: s.color }}
                              />
                              <p className="text-xs font-medium text-slate-600 flex-1 truncate">
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

                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                    <p className="text-sm font-bold text-slate-800 mb-5">
                      Vloerstatus
                    </p>
                    {totalFloors === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">
                        Geen data
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {[
                          {
                            label: "Goed",
                            count: statusCount.goed,
                            bg: "bg-emerald-400",
                            text: "text-emerald-600",
                            light: "bg-emerald-50",
                          },
                          {
                            label: "Matig",
                            count: statusCount.matig,
                            bg: "bg-amber-400",
                            text: "text-amber-600",
                            light: "bg-amber-50",
                          },
                          {
                            label: "Slecht",
                            count: statusCount.slecht,
                            bg: "bg-red-400",
                            text: "text-red-600",
                            light: "bg-red-50",
                          },
                        ].map(({ label, count, bg, text, light }) => {
                          const pct =
                            finishedFloors.length > 0
                              ? Math.round(
                                  (count / finishedFloors.length) * 100,
                                )
                              : 0;
                          return (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full ${bg}`}
                                  />
                                  <p className="text-sm font-semibold text-slate-700">
                                    {label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`text-sm font-bold ${count > 0 ? text : "text-slate-300"}`}
                                  >
                                    {count}
                                  </p>
                                  <p className="text-xs text-slate-400 w-8 text-right">
                                    {pct}%
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`h-2.5 rounded-full overflow-hidden ${light}`}
                              >
                                <div
                                  className={`h-full ${bg} rounded-full transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-sm font-bold text-slate-800">
                        Live activiteit
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-56">
                      {finishedFloors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                          <p className="text-sm text-slate-300">
                            Wachten op activiteit...
                          </p>
                        </div>
                      ) : (
                        finishedFloors.slice(0, 20).map((f, i) => (
                          <div
                            key={f.id}
                            className={`flex items-start gap-3 px-5 py-3 ${i === 0 ? "bg-emerald-50/50" : ""}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-emerald-400" : "bg-slate-200"}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">
                                {f.kamervloernaam}
                              </p>
                              <p className="text-xs text-slate-400">
                                {f.reinigMethode_naam} · {f.vierkante_meter}m²
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-300 shrink-0 mt-0.5">
                              {formatTime(f.aangemaakt_op)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Laatste opmerkingen */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-sm font-bold text-slate-800">
                        Laatste opmerkingen
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-56">
                      {finishedFloors.filter((f) => f.opmerking).length ===
                      0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                          <p className="text-sm text-slate-300">
                            Geen opmerkingen
                          </p>
                        </div>
                      ) : (
                        finishedFloors
                          .filter((f) => f.opmerking)
                          .slice(0, 15)
                          .map((f) => (
                            <div
                              key={f.id}
                              className="flex items-start gap-3 px-5 py-3"
                            >
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
                          ))
                      )}
                    </div>
                  </div>

                  {/* Wagens & bezetting */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
                      <TruckIcon className="w-4 h-4 text-p" />
                      <p className="text-sm font-bold text-slate-800">
                        Wagens & bezetting
                      </p>
                    </div>
                    <div className="flex-1 divide-y divide-slate-50">
                      {!(activeProject as any).bussen?.length ? (
                        <div className="flex items-center justify-center py-10">
                          <p className="text-sm text-slate-300">
                            Geen wagens toegewezen
                          </p>
                        </div>
                      ) : (
                        (activeProject as any).bussen.map((b: any) => (
                          <div
                            key={b.id}
                            className="flex items-center gap-3 px-5 py-3.5"
                          >
                            <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                              <TruckIcon className="w-3.5 h-3.5 text-p" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">
                                {b.naam}
                              </p>
                              <p className="text-xs text-slate-400">
                                {b.kenteken}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
