"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  TruckIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

interface AgendaProject {
  id: string;
  naam: string;
  start_datum: string;
  eind_datum: string;
  status: string;
  locatie_naam: string;
  locatie_plaats: string;
  bussen: {
    id: string;
    naam: string;
    kenteken: string;
    medewerkers: { voornaam: string; achternaam: string }[];
  }[];
}

const DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAGEN_LONG = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];
const MAANDEN = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function getMondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(str: string) {
  const [y, m, d] = str.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

function projectOnDay(project: AgendaProject, day: Date) {
  const dayStr = toDateStr(day);
  const startStr = project.start_datum.split("T")[0];
  const endStr = project.eind_datum.split("T")[0];
  return dayStr >= startStr && dayStr <= endStr;
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    gepland: "bg-blue-50 text-blue-700 border-blue-100",
    bezig: "bg-amber-50 text-amber-700 border-amber-100",
    afgerond: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${config[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
    >
      {status}
    </span>
  );
}

function ProjectCard({
  project,
  compact = false,
  onClick,
}: {
  project: AgendaProject;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden ${onClick ? "cursor-pointer hover:border-p/30 hover:shadow-md transition-all" : ""}`}
    >
      <div className="px-3 py-2.5 border-b border-slate-50 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {project.naam}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
            <p className="text-xs text-slate-400 truncate">
              {project.locatie_naam}
            </p>
          </div>
        </div>
        <StatusPill status={project.status} />
      </div>

      {!compact && (
        <div className="px-3 py-2 space-y-1.5">
          {project.bussen.map((b) => (
            <div key={b.id} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md bg-p/10 flex items-center justify-center shrink-0 mt-0.5">
                <TruckIcon className="w-3 h-3 text-p" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">
                  {b.naam} · {b.kenteken}
                </p>
                {b.medewerkers.length > 0 && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {b.medewerkers
                      .map((m) => `${m.voornaam} ${m.achternaam}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
          {project.bussen.length === 0 && (
            <p className="text-xs text-slate-300 italic">Geen wagens</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgendaPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [view, setView] = useState<"week" | "dag">("week");
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dayWindowStart, setDayWindowStart] = useState(() =>
    addDays(getMondayOf(new Date()), -3),
  );
  const [projecten, setProjecten] = useState<AgendaProject[]>([]);
  const [loading, setLoading] = useState(true);

  function navigateDay(newDay: Date) {
    setSelectedDay(newDay);
    const windowEnd = addDays(dayWindowStart, 13);
    if (newDay > windowEnd || newDay < dayWindowStart) {
      setDayWindowStart(addDays(newDay, -6));
    }
  }

  // Fetch projects for visible range
  useEffect(() => {
    async function load() {
      setLoading(true);
      const from = view === "week" ? weekStart : dayWindowStart;
      const to =
        view === "week" ? addDays(weekStart, 6) : addDays(dayWindowStart, 13);

      const fromStr = toDateStr(from);
      const toStr = toDateStr(to);

      // Fetch projects overlapping the range
      const { data, error } = await supabase
        .from("projecten")
        .select(
          `
          id, naam, start_datum, eind_datum, status,
          locaties!projecten_locatie_id_fkey(naam, plaats),
          project_bussen(
            bussen(id, naam, kenteken),
            project_bus_medewerkers(medewerkers(voornaam, achternaam))
          )
        `,
        )
        .lte("start_datum", toStr + "T23:59:59")
        .gte("eind_datum", fromStr)
        .order("start_datum");

      if (error) {
        showToast("Kon agenda niet laden", "error");
        setLoading(false);
        return;
      }

      setProjecten(
        (data ?? []).map((d: any) => ({
          id: d.id,
          naam: d.naam,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
          status: d.status,
          locatie_naam: d.locaties?.naam ?? "—",
          locatie_plaats: d.locaties?.plaats ?? "",
          bussen: (d.project_bussen ?? []).map((pb: any) => ({
            id: pb.bussen?.id,
            naam: pb.bussen?.naam ?? "—",
            kenteken: pb.bussen?.kenteken ?? "—",
            medewerkers: (pb.project_bus_medewerkers ?? [])
              .map((pbm: any) => pbm.medewerkers)
              .filter(Boolean),
          })),
        })),
      );
      setLoading(false);
    }
    load();
  }, [weekStart, selectedDay, dayWindowStart, view]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekLabel = (() => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth()) {
      return `${weekStart.getDate()}–${end.getDate()} ${MAANDEN[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${weekStart.getDate()} ${MAANDEN[weekStart.getMonth()]} – ${end.getDate()} ${MAANDEN[end.getMonth()]} ${end.getFullYear()}`;
  })();

  const dayLabel = `${DAGEN_LONG[(selectedDay.getDay() + 6) % 7]} ${selectedDay.getDate()} ${MAANDEN[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`;

  const dayProjects = (day: Date) =>
    projecten.filter((p) => projectOnDay(p, day));

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Agenda" />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (view === "week") setWeekStart((w) => addDays(w, -7));
                    else navigateDay(addDays(selectedDay, -1));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (view === "week") setWeekStart((w) => addDays(w, 7));
                    else navigateDay(addDays(selectedDay, 1));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Period label */}
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {view === "week" ? weekLabel : dayLabel}
                </p>
                {view === "week" && (
                  <p className="text-xs text-slate-400">
                    Week {Math.ceil(weekStart.getDate() / 7)}
                  </p>
                )}
              </div>

              {/* Today button */}
              <button
                onClick={() => {
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  setWeekStart(getMondayOf(t));
                  setSelectedDay(t);
                  setDayWindowStart(addDays(getMondayOf(t), -3));
                }}
                className="px-3 py-1.5 text-xs font-semibold text-p bg-p/8 hover:bg-p/15 rounded-lg transition-colors cursor-pointer"
              >
                Vandaag
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(
                [
                  ["week", "Week", Squares2X2Icon],
                  ["dag", "Dag", ViewColumnsIcon],
                ] as const
              ).map(([v, label, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${view === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto min-h-0 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : view === "week" ? (
              /* ─── Week view ─── */
              <div className="h-full flex flex-col px-6 py-4 gap-3">
                {/* Day header row */}
                <div className="grid grid-cols-7 gap-3 shrink-0">
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, today);
                    const count = dayProjects(day).length;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          navigateDay(day);
                          setView("dag");
                        }}
                        className={`flex flex-col items-center py-2.5 rounded-xl transition-all cursor-pointer ${isToday ? "bg-p text-white" : "bg-white border border-slate-100 text-slate-600 hover:border-p/30"}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? "text-white/70" : "text-slate-400"}`}
                        >
                          {DAGEN[i]}
                        </p>
                        <p
                          className={`text-lg font-bold leading-tight ${isToday ? "text-white" : "text-slate-800"}`}
                        >
                          {day.getDate()}
                        </p>
                        {count > 0 && (
                          <div
                            className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isToday ? "bg-white/20 text-white" : "bg-p/10 text-p"}`}
                          >
                            {count}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Project grid per day — fills remaining height */}
                <div className="grid grid-cols-7 gap-3 flex-1 min-h-0">
                  {weekDays.map((day, i) => {
                    const projects = dayProjects(day);
                    const isToday = isSameDay(day, today);
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl p-2 space-y-2 overflow-y-auto ${isToday ? "bg-p/5 border border-p/15" : "bg-slate-50/60 border border-slate-100"}`}
                      >
                        {projects.length === 0 ? (
                          <div className="flex items-center justify-center h-full min-h-20">
                            <p className="text-xs text-slate-300">Vrij</p>
                          </div>
                        ) : (
                          projects.map((p) => (
                            <ProjectCard
                              key={p.id}
                              project={p}
                              compact
                              onClick={() =>
                                router.push(`/projecten/bekijken/${p.id}`)
                              }
                            />
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ─── Day view ─── */
              <div className="h-full flex flex-col px-6 py-4 min-h-0 w-full">
                {/* Day nav pills — full width grid */}
                <div
                  className="grid grid-cols-14 gap-2 mb-4 shrink-0"
                  style={{ gridTemplateColumns: `repeat(14, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: 14 }, (_, i) =>
                    addDays(dayWindowStart, i),
                  ).map((day, i) => {
                    const isSelected = isSameDay(day, selectedDay);
                    const isToday = isSameDay(day, today);
                    const count = dayProjects(day).length;
                    return (
                      <button
                        key={i}
                        onClick={() => navigateDay(day)}
                        className={`flex flex-col items-center py-3 rounded-xl transition-all cursor-pointer border ${isSelected ? "bg-p border-p text-white" : isToday ? "bg-p/5 border-p/20 text-p" : "bg-white border-slate-100 text-slate-600 hover:border-p/30"}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-white/70" : "text-slate-400"}`}
                        >
                          {DAGEN[(day.getDay() + 6) % 7]}
                        </p>
                        <p
                          className={`text-base font-bold ${isSelected ? "text-white" : "text-slate-800"}`}
                        >
                          {day.getDate()}
                        </p>
                        {count > 0 && (
                          <div
                            className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-p"}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Projects for selected day — scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0 w-full">
                  {dayProjects(selectedDay).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                        <CalendarDaysIcon className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-400">
                        Geen projecten
                      </p>
                      <p className="text-sm text-slate-300 mt-1">
                        Er zijn geen projecten gepland voor deze dag
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4 w-full">
                      {dayProjects(selectedDay).map((p) => (
                        <div
                          key={p.id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                        >
                          {/* Project header */}
                          <div className="px-5 py-4 border-b border-slate-50 flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-bold text-slate-800">
                                {p.naam}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />
                                <p className="text-sm text-slate-400">
                                  {p.locatie_naam}
                                  {p.locatie_plaats
                                    ? ` · ${p.locatie_plaats}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusPill status={p.status} />
                              <button
                                onClick={() =>
                                  router.push(`/projecten/bekijken/${p.id}`)
                                }
                                className="px-3 py-1.5 text-xs font-bold text-p bg-p/8 hover:bg-p/15 rounded-lg transition-colors cursor-pointer"
                              >
                                Bekijken
                              </button>
                            </div>
                          </div>

                          {/* Wagens */}
                          <div className="p-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              Wagens & bezetting
                            </p>
                            {p.bussen.length === 0 ? (
                              <p className="text-sm text-slate-300 italic">
                                Geen wagens toegewezen
                              </p>
                            ) : (
                              p.bussen.map((b) => (
                                <div
                                  key={b.id}
                                  className="flex items-start gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                    <TruckIcon className="w-4 h-4 text-p" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700">
                                      {b.naam}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {b.kenteken}
                                    </p>
                                    {b.medewerkers.length > 0 && (
                                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        <UserGroupIcon className="w-3.5 h-3.5 text-slate-300" />
                                        {b.medewerkers.map((m, i) => (
                                          <span
                                            key={i}
                                            className="inline-flex items-center px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs text-slate-600 font-medium"
                                          >
                                            {m.voornaam} {m.achternaam}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
