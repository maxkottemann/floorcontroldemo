"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

interface Steekproef {
  id: string;
  project_id: string;
  project_naam: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  status: string;
  goedgekeurd: boolean | null;
  aangemaakt_op: string;
  afgerond_op: string | null;
  afgerond_door: string | null;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({
  status,
  goedgekeurd,
}: {
  status: string;
  goedgekeurd: boolean | null;
}) {
  if (status !== "afgerond") {
    const cfg =
      status === "in_progress"
        ? {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-100",
            dot: "bg-amber-400 animate-pulse",
            label: "Bezig",
          }
        : {
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-100",
            dot: "bg-blue-400",
            label: "Open",
          };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }
  if (goedgekeurd === true)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">
        <CheckCircleIcon className="w-3.5 h-3.5" /> Goedgekeurd
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-50 text-red-700 border-red-100">
      <XCircleIcon className="w-3.5 h-3.5" /> Afgekeurd
    </span>
  );
}

type Tab = "in_progress" | "goedgekeurd" | "afgekeurd";

export default function SteekproevenOverviewPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [steekproeven, setSteekproeven] = useState<Steekproef[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("in_progress");

  useEffect(() => {
    async function getAllSteekproeven() {
      setLoading(true);
      const { data, error } = await supabase
        .from("steekproeven")
        .select(
          "id, project_id, projecten(naam, locaties(naam, plaats)), status, goedgekeurd, aangemaakt_op, afgerond_op, profielen(naam)",
        )
        .order("aangemaakt_op", { ascending: false });

      if (error) {
        showToast("Steekproeven konden niet worden geladen", "error");
        setLoading(false);
        return;
      }

      setSteekproeven(
        (data ?? []).map((d: any) => ({
          id: d.id,
          project_id: d.project_id,
          project_naam: d.projecten?.naam ?? "—",
          locatie_naam: d.projecten?.locaties?.naam ?? "—",
          locatie_plaats: d.projecten?.locaties?.plaats ?? null,
          status: d.status ?? "open",
          goedgekeurd: d.goedgekeurd ?? null,
          aangemaakt_op: d.aangemaakt_op,
          afgerond_op: d.afgerond_op ?? null,
          afgerond_door: d.profielen?.naam ?? null,
        })),
      );
      setLoading(false);
    }
    getAllSteekproeven();
  }, []);

  const inProgressList = steekproeven.filter((s) => s.status !== "afgerond");
  const goedgekeurdList = steekproeven.filter(
    (s) => s.status === "afgerond" && s.goedgekeurd === true,
  );
  const afgekeurdList = steekproeven.filter(
    (s) => s.status === "afgerond" && s.goedgekeurd === false,
  );

  const activeList =
    activeTab === "in_progress"
      ? inProgressList
      : activeTab === "goedgekeurd"
        ? goedgekeurdList
        : afgekeurdList;

  const displayed = activeList.filter((s) =>
    [s.project_naam, s.locatie_naam].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

  const tabs: {
    key: Tab;
    label: string;
    count: number;
    activeColor: string;
  }[] = [
    {
      key: "in_progress",
      label: "In uitvoering",
      count: inProgressList.length,
      activeColor: "bg-amber-100 text-amber-600",
    },
    {
      key: "goedgekeurd",
      label: "Goedgekeurd",
      count: goedgekeurdList.length,
      activeColor: "bg-emerald-100 text-emerald-600",
    },
    {
      key: "afgekeurd",
      label: "Afgekeurd",
      count: afgekeurdList.length,
      activeColor: "bg-red-100 text-red-600",
    },
  ];

  function rowDot(s: Steekproef) {
    if (s.status !== "afgerond")
      return <div className="w-2 h-2 rounded-full bg-amber-400" />;
    if (s.goedgekeurd === true)
      return <CheckCircleIcon className="w-4 h-4 text-emerald-400" />;
    return <XCircleIcon className="w-4 h-4 text-red-400" />;
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <ClipboardDocumentCheckIcon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400 font-medium">
        {activeTab === "in_progress"
          ? "Geen steekproeven in uitvoering"
          : activeTab === "goedgekeurd"
            ? "Geen goedgekeurde steekproeven"
            : "Geen afgekeurde steekproeven"}
      </p>
      <p className="text-xs text-slate-300 mt-0.5">
        {zoekterm
          ? "Probeer een andere zoekterm"
          : "Er zijn nog geen steekproeven in deze categorie"}
      </p>
    </div>
  );

  const tabBar = (mobile = false) => (
    <div
      className={`flex items-center gap-1 bg-slate-100 rounded-xl p-1 ${mobile ? "w-full" : ""}`}
    >
      {tabs.map(({ key, label, count, activeColor }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key as Tab)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${mobile ? "flex-1 justify-center" : ""} ${activeTab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          {label}
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === key ? activeColor : "bg-slate-200 text-slate-400"}`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );

  const searchBar = (mobile = false) => (
    <div className={`relative ${mobile ? "" : "flex-1 max-w-xs ml-auto"}`}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
      <input
        value={zoekterm}
        onChange={(e) => setZoekterm(e.target.value)}
        placeholder="Zoek op project, locatie..."
        className={`w-full pl-9 pr-4 text-sm rounded-xl border outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all ${mobile ? "py-2.5 bg-white border-slate-100 shadow-sm" : "py-2 bg-slate-50 border-slate-100"}`}
      />
    </div>
  );

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
          title="Steekproeven"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          {/* ── Desktop ── */}
          <div className="hidden md:block space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Steekproeven
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {inProgressList.length} in uitvoering ·{" "}
                  {goedgekeurdList.length} goedgekeurd · {afgekeurdList.length}{" "}
                  afgekeurd
                </p>
              </div>
              <div className="flex items-center gap-3">
                {inProgressList.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                    <ClockIcon className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-bold text-amber-600">
                      {inProgressList.length} in uitvoering
                    </p>
                  </div>
                )}
                {afgekeurdList.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-2xl">
                    <XCircleIcon className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-bold text-red-600">
                      {afgekeurdList.length} afgekeurd
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
                {tabBar()}
                {searchBar()}
              </div>

              <div className="grid grid-cols-[24px_1fr_180px_130px_150px_40px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                {["", "Project", "Locatie", "Aangemaakt", "Status", ""].map(
                  (h, i) => (
                    <p
                      key={i}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </p>
                  ),
                )}
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
                  </div>
                ) : displayed.length === 0 ? (
                  emptyState
                ) : (
                  displayed.map((s) => (
                    <div
                      key={s.id}
                      onClick={() =>
                        router.push(`/steekproeven/bekijken/${s.id}`)
                      }
                      className="grid grid-cols-[24px_1fr_180px_130px_150px_40px] items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center">{rowDot(s)}</div>
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-p transition-colors">
                          {s.project_naam}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-500 truncate">
                            {s.locatie_naam}
                          </p>
                          {s.locatie_plaats && (
                            <p className="text-xs text-slate-300 truncate">
                              {s.locatie_plaats}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <p className="text-sm text-slate-500">
                          {formatDate(s.aangemaakt_op)}
                        </p>
                      </div>
                      <StatusBadge
                        status={s.status}
                        goedgekeurd={s.goedgekeurd}
                      />
                      <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p transition-colors" />
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                <p className="text-xs text-slate-400">
                  {displayed.length} steekproef
                  {displayed.length !== 1 ? "en" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* ── Mobile ── */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Steekproeven
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inProgressList.length} bezig · {goedgekeurdList.length} goed
                  · {afgekeurdList.length} afgekeurd
                </p>
              </div>
              <div className="flex items-center gap-2">
                {inProgressList.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-xs font-bold text-amber-600">
                      {inProgressList.length}
                    </p>
                  </div>
                )}
                {afgekeurdList.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl">
                    <XCircleIcon className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs font-bold text-red-600">
                      {afgekeurdList.length}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {tabBar(true)}
            {searchBar(true)}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : displayed.length === 0 ? (
              emptyState
            ) : (
              <div className="space-y-2">
                {displayed.map((s) => (
                  <div
                    key={s.id}
                    onClick={() =>
                      router.push(`/steekproeven/bekijken/${s.id}`)
                    }
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-1 shrink-0">{rowDot(s)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {s.project_naam}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
                            <p className="text-xs text-slate-400 truncate">
                              {s.locatie_naam}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge
                          status={s.status}
                          goedgekeurd={s.goedgekeurd}
                        />
                        <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <p className="text-xs text-slate-400">
                        {formatDate(s.aangemaakt_op)}
                      </p>
                      {s.afgerond_op && (
                        <>
                          <span className="text-slate-200">·</span>
                          <p className="text-xs text-slate-400">
                            Afgerond {formatDate(s.afgerond_op)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 text-center pt-1">
                  {displayed.length} steekproef
                  {displayed.length !== 1 ? "en" : ""}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
