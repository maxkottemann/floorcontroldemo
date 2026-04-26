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
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

interface AgendaProject {
  id: string;
  naam: string;
  start_datum: string;
  eind_datum: string;
  opmerkingen?: string;
  status: string;
  locatie_naam: string;
  locatie_plaats: string;
  type: "project" | "vloerscan";
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
function itemOnDay(item: AgendaProject, day: Date) {
  const dayStr = toDateStr(day);
  return (
    dayStr >= item.start_datum.split("T")[0] &&
    dayStr <= item.eind_datum.split("T")[0]
  );
}

function StatusPill({
  status,
  type,
}: {
  status: string;
  type: "project" | "vloerscan";
}) {
  const config: Record<string, string> = {
    gepland: "bg-blue-50 text-blue-700 border-blue-100",
    bezig: "bg-amber-50 text-amber-700 border-amber-100",
    afgerond: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${config[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}
    >
      {type === "vloerscan" && (
        <ClipboardDocumentCheckIcon className="w-3 h-3" />
      )}
      {status}
    </span>
  );
}

function ItemCard({
  item,
  compact = false,
  onClick,
}: {
  item: AgendaProject;
  compact?: boolean;
  onClick?: () => void;
}) {
  const isVloerscan = item.type === "vloerscan";
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border shadow-sm overflow-hidden ${onClick ? "cursor-pointer hover:border-p/30 hover:shadow-md transition-all active:bg-slate-50" : ""}
        ${isVloerscan ? "bg-emerald-50/40 border-emerald-100" : "bg-white border-slate-100"}`}
    >
      <div className="px-3 py-2.5 border-b border-slate-50 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isVloerscan && (
              <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
            <p className="text-sm font-bold text-slate-800 truncate">
              {item.naam}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
            <p className="text-xs text-slate-400 truncate">
              {item.locatie_naam}
            </p>
          </div>
          {item.opmerkingen && (
            <div className="flex items-center gap-1 mt-0.5">
              <ChatBubbleLeftEllipsisIcon className="w-3 h-3 text-slate-300 shrink-0" />
              <p className="text-xs text-slate-400 truncate">
                {item.opmerkingen}
              </p>
            </div>
          )}
        </div>
        <StatusPill status={item.status} type={item.type} />
      </div>
      {!compact && (
        <div className="px-3 py-2 space-y-1.5">
          {item.bussen.map((b) => (
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
          {item.bussen.length === 0 && (
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [items, setItems] = useState<AgendaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVloerscans, setShowVloerscans] = useState(true);
  const [showProjecten, setShowProjecten] = useState(true);

  function navigateDay(newDay: Date) {
    setSelectedDay(newDay);
    const windowEnd = addDays(dayWindowStart, 13);
    if (newDay > windowEnd || newDay < dayWindowStart)
      setDayWindowStart(addDays(newDay, -6));
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const from = view === "week" ? weekStart : dayWindowStart;
      const to =
        view === "week" ? addDays(weekStart, 6) : addDays(dayWindowStart, 13);
      const fromStr = toDateStr(from);
      const toStr = toDateStr(to) + "T23:59:59";

      const [
        { data: projectData, error: projectError },
        { data: scanData, error: scanError },
      ] = await Promise.all([
        supabase
          .from("projecten")
          .select(
            `
          id, naam, start_datum, eind_datum, status, opmerkingen,
          locaties!projecten_locatie_id_fkey(naam, plaats),
          project_bussen(bussen(id, naam, kenteken), project_bus_medewerkers(medewerkers(voornaam, achternaam)))
        `,
          )
          .lte("start_datum", toStr)
          .gte("eind_datum", fromStr)
          .order("start_datum"),

        supabase
          .from("vloerscans")
          .select(
            `
          id, naam, beschrijving, start_datum, eind_datum, status,
          locaties(naam, plaats),
          medewerkers(voornaam, achternaam)
        `,
          )
          .lte("start_datum", toStr)
          .gte("eind_datum", fromStr)
          .order("start_datum"),
      ]);

      if (projectError || scanError) {
        showToast("Kon agenda niet laden", "error");
        setLoading(false);
        return;
      }

      const mappedProjects: AgendaProject[] = (projectData ?? []).map(
        (d: any) => ({
          id: d.id,
          naam: d.naam,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
          status: d.status,
          opmerkingen: d.opmerkingen,
          locatie_naam: d.locaties?.naam ?? "—",
          locatie_plaats: d.locaties?.plaats ?? "",
          type: "project" as const,
          bussen: (d.project_bussen ?? []).map((pb: any) => ({
            id: pb.bussen?.id,
            naam: pb.bussen?.naam ?? "—",
            kenteken: pb.bussen?.kenteken ?? "—",
            medewerkers: (pb.project_bus_medewerkers ?? [])
              .map((pbm: any) => pbm.medewerkers)
              .filter(Boolean),
          })),
        }),
      );

      const mappedScans: AgendaProject[] = (scanData ?? []).map((d: any) => ({
        id: d.id,
        naam: d.naam ?? "Naamloos",
        start_datum: d.start_datum,
        eind_datum: d.eind_datum,
        status: d.status,
        opmerkingen: d.beschrijving,
        locatie_naam: d.locaties?.naam ?? "—",
        locatie_plaats: d.locaties?.plaats ?? "",
        type: "vloerscan" as const,
        bussen: d.medewerkers
          ? [
              {
                id: "m",
                naam: "Medewerker",
                kenteken: "",
                medewerkers: [
                  {
                    voornaam: d.medewerkers.voornaam,
                    achternaam: d.medewerkers.achternaam,
                  },
                ],
              },
            ]
          : [],
      }));

      setItems([...mappedProjects, ...mappedScans]);
      setLoading(false);
    }
    load();
  }, [weekStart, dayWindowStart, view]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekLabel = (() => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth())
      return `${weekStart.getDate()}–${end.getDate()} ${MAANDEN[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    return `${weekStart.getDate()} ${MAANDEN[weekStart.getMonth()]} – ${end.getDate()} ${MAANDEN[end.getMonth()]} ${end.getFullYear()}`;
  })();

  const dayLabel = `${DAGEN_LONG[(selectedDay.getDay() + 6) % 7]} ${selectedDay.getDate()} ${MAANDEN[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`;

  const filteredItems = items.filter(
    (i) =>
      (i.type === "project" && showProjecten) ||
      (i.type === "vloerscan" && showVloerscans),
  );

  const dayItems = (day: Date) =>
    filteredItems.filter((i) => itemOnDay(i, day));

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
        <Topbar title="Agenda" onMenuToggle={() => setSidebarOpen((p) => !p)} />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 md:px-8 py-3 md:py-4 bg-white border-b border-slate-100 shrink-0 gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
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
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {view === "week" ? weekLabel : dayLabel}
                </p>
                {view === "week" && (
                  <p className="text-xs text-slate-400 hidden sm:block">
                    Week {Math.ceil(weekStart.getDate() / 7)}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  const t = new Date();
                  t.setHours(0, 0, 0, 0);
                  setWeekStart(getMondayOf(t));
                  setSelectedDay(t);
                  setDayWindowStart(addDays(getMondayOf(t), -3));
                }}
                className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-p bg-p/8 hover:bg-p/15 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Vandaag
              </button>

              {/* Filter toggles */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <button
                  onClick={() => setShowProjecten((p) => !p)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${showProjecten ? "bg-p/10 text-p border-p/20" : "bg-white text-slate-400 border-slate-200"}`}
                >
                  Projecten
                </button>
                <button
                  onClick={() => setShowVloerscans((p) => !p)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${showVloerscans ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-white text-slate-400 border-slate-200"}`}
                >
                  Vloerscans
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
              {(
                [
                  ["week", "Week", Squares2X2Icon],
                  ["dag", "Dag", ViewColumnsIcon],
                ] as const
              ).map(([v, label, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${view === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-0 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : view === "week" ? (
              <>
                {/* Desktop week */}
                <div className="hidden md:flex h-full flex-col px-6 py-4 gap-3">
                  <div className="grid grid-cols-7 gap-3 shrink-0">
                    {weekDays.map((day, i) => {
                      const isToday = isSameDay(day, today);
                      const count = dayItems(day).length;
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
                  <div className="grid grid-cols-7 gap-3 flex-1 min-h-0">
                    {weekDays.map((day, i) => {
                      const dayItemList = dayItems(day);
                      const isToday = isSameDay(day, today);
                      return (
                        <div
                          key={i}
                          className={`rounded-2xl p-2 space-y-2 overflow-y-auto ${isToday ? "bg-p/5 border border-p/15" : "bg-slate-50/60 border border-slate-100"}`}
                        >
                          {dayItemList.length === 0 ? (
                            <div className="flex items-center justify-center h-full min-h-20">
                              <p className="text-xs text-slate-300">Vrij</p>
                            </div>
                          ) : (
                            dayItemList.map((item) => (
                              <ItemCard
                                key={item.id}
                                item={item}
                                compact
                                onClick={() =>
                                  router.push(
                                    item.type === "project"
                                      ? `/klant/projecten/bekijken/${item.id}`
                                      : `/klant/vloerscans/bekijken/${item.id}`,
                                  )
                                }
                              />
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile week */}
                <div className="md:hidden px-3 py-4 space-y-4">
                  {weekDays.map((day, i) => {
                    const dayItemList = dayItems(day);
                    const isToday = isSameDay(day, today);
                    return (
                      <div key={i}>
                        <button
                          onClick={() => {
                            navigateDay(day);
                            setView("dag");
                          }}
                          className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl mb-2 transition-colors ${isToday ? "bg-p text-white" : "bg-white border border-slate-100"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isToday ? "bg-white/20" : "bg-slate-100"}`}
                          >
                            <p
                              className={`text-sm font-bold ${isToday ? "text-white" : "text-slate-800"}`}
                            >
                              {day.getDate()}
                            </p>
                          </div>
                          <div className="text-left flex-1">
                            <p
                              className={`text-sm font-bold ${isToday ? "text-white" : "text-slate-800"}`}
                            >
                              {DAGEN_LONG[i]}
                            </p>
                            <p
                              className={`text-xs ${isToday ? "text-white/70" : "text-slate-400"}`}
                            >
                              {dayItemList.length === 0
                                ? "Niets gepland"
                                : `${dayItemList.length} item${dayItemList.length !== 1 ? "s" : ""}`}
                            </p>
                          </div>
                          <ChevronRightIcon
                            className={`w-4 h-4 shrink-0 ${isToday ? "text-white/60" : "text-slate-300"}`}
                          />
                        </button>
                        {dayItemList.length > 0 && (
                          <div className="space-y-2 pl-2">
                            {dayItemList.map((item) => (
                              <ItemCard
                                key={item.id}
                                item={item}
                                compact
                                onClick={() =>
                                  router.push(
                                    item.type === "project"
                                      ? `/klant/projecten/bekijken/${item.id}`
                                      : `/vloerscans/bekijken/${item.id}`,
                                  )
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Day view */
              <div className="h-full flex flex-col px-3 md:px-6 py-4 min-h-0 w-full">
                <div className="overflow-x-auto mb-4 shrink-0 -mx-3 md:mx-0 px-3 md:px-0">
                  <div
                    className="flex gap-2 w-max md:grid md:w-auto"
                    style={{
                      gridTemplateColumns: `repeat(14, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: 14 }, (_, i) =>
                      addDays(dayWindowStart, i),
                    ).map((day, i) => {
                      const isSelected = isSameDay(day, selectedDay);
                      const isToday = isSameDay(day, today);
                      const count = dayItems(day).length;
                      return (
                        <button
                          key={i}
                          onClick={() => navigateDay(day)}
                          className={`flex flex-col items-center py-2.5 md:py-3 px-3 md:px-0 rounded-xl transition-all cursor-pointer border min-w-[52px] md:min-w-0
                            ${isSelected ? "bg-p border-p text-white" : isToday ? "bg-p/5 border-p/20 text-p" : "bg-white border-slate-100 text-slate-600 hover:border-p/30"}`}
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
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 w-full">
                  {dayItems(selectedDay).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                        <CalendarDaysIcon className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-400">
                        Niets gepland
                      </p>
                      <p className="text-sm text-slate-300 mt-1">
                        Er zijn geen items voor deze dag
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 pb-4 w-full">
                      {dayItems(selectedDay).map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border shadow-sm overflow-hidden ${item.type === "vloerscan" ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-100"}`}
                        >
                          <div className="px-4 md:px-5 py-4 border-b border-slate-50 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {item.type === "vloerscan" && (
                                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                )}
                                <p className="text-base font-bold text-slate-800 truncate">
                                  {item.naam}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <p className="text-sm text-slate-400 truncate">
                                  {item.locatie_naam}
                                  {item.locatie_plaats
                                    ? ` · ${item.locatie_plaats}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusPill
                                status={item.status}
                                type={item.type}
                              />
                              <button
                                onClick={() =>
                                  router.push(
                                    item.type === "project"
                                      ? `/klant/projecten/bekijken/${item.id}`
                                      : `/vloerscans/bekijken/${item.id}`,
                                  )
                                }
                                className="px-3 py-1.5 text-xs font-bold text-p bg-p/8 hover:bg-p/15 rounded-lg transition-colors cursor-pointer"
                              >
                                Bekijken
                              </button>
                            </div>
                          </div>
                          <div className="p-3 md:p-4 space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                              {item.type === "vloerscan"
                                ? "Medewerker"
                                : "Wagens & bezetting"}
                            </p>
                            {item.bussen.length === 0 ? (
                              <p className="text-sm text-slate-300 italic">
                                Geen wagens toegewezen
                              </p>
                            ) : (
                              item.bussen.map((b) => (
                                <div
                                  key={b.id}
                                  className="flex items-start gap-3 px-3 md:px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                    <TruckIcon className="w-4 h-4 text-p" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {b.naam !== "Medewerker" && (
                                      <>
                                        <p className="text-sm font-bold text-slate-700">
                                          {b.naam}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {b.kenteken}
                                        </p>
                                      </>
                                    )}
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
