"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

interface ProjectRow {
  id: string;
  naam: string;
  beschrijving: string | null;
  locatie_naam: string | null;
  start_datum: string | null;
  eind_datum: string | null;
  status: string | null;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  gepland: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
  },
  bezig: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
  },
  afgerond: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
  },
};

export default function FinishedProjectsPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [projecten, setProjecten] = useState<ProjectRow[]>([]);
  const [zoekterm, setZoekterm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProjecten() {
      setLoading(true);
      const { error, data } = await supabase
        .from("projecten")
        .select(
          "id, naam, beschrijving, start_datum, eind_datum, status, locaties!projecten_locatie_id_fkey(naam)",
        )
        .eq("status", "afgerond")
        .order("start_datum", { ascending: false })
        .limit(100);
      if (error || !data) {
        showToast("Projecten niet geladen, probeer het opnieuw", "error");
        setLoading(false);
        return;
      }
      setProjecten(
        data.map((d: any) => ({
          id: d.id,
          naam: d.naam,
          beschrijving: d.beschrijving ?? null,
          locatie_naam: d.locaties?.naam ?? null,
          start_datum: d.start_datum ?? null,
          eind_datum: d.eind_datum ?? null,
          status: d.status ?? null,
        })),
      );
      setLoading(false);
    }
    getProjecten();
  }, []);

  const filtered = projecten.filter((p) =>
    [p.naam, p.locatie_naam, p.beschrijving].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

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
          title="Projecten"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Afgeronde projecten
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {projecten.length} projecten gevonden
                </p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                <button
                  onClick={() => router.push("/klant/projecten")}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Actieve</span>
                </button>
                <button
                  onClick={() => router.push("/klant/projecten/agenda")}
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <CalendarDaysIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Agenda bekijken</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Zoek op projectnaam, locatie..."
                className="w-full pl-11 pr-4 py-3 text-slate-700 text-sm bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:border-p/30 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  Geen projecten gevonden
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {zoekterm
                    ? "Probeer een andere zoekterm"
                    : "Er zijn nog geen afgeronde projecten"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table — hidden on mobile */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-10" />
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                          Project
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-48">
                          Locatie
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-32">
                          Startdatum
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-32">
                          Einddatum
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                          Status
                        </th>
                        <th className="w-8 px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {filtered.map((p) => {
                        const sc = STATUS_CONFIG[p.status ?? ""] ?? {
                          bg: "bg-slate-100",
                          text: "text-slate-500",
                          border: "border-slate-200",
                        };
                        return (
                          <tr
                            key={p.id}
                            onClick={() =>
                              router.push(
                                `/klant/projecten/afgerond/bekijken/${p.id}`,
                              )
                            }
                            className="cursor-pointer transition-colors group hover:bg-blue-50/40 bg-white"
                          >
                            <td className="pl-5 py-4">
                              <div className="w-8 ml-3 h-8 rounded-xl bg-p/10 group-hover:bg-p/20 flex items-center justify-center transition-colors shrink-0">
                                <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-p transition-colors">
                                {p.naam}
                              </p>
                              {p.beschrijving && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                  {p.beschrijving}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <p className="text-sm text-slate-500 truncate">
                                  {p.locatie_naam ?? "—"}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-500">
                                {formatDate(p.start_datum)}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-sm text-slate-500">
                                {formatDate(p.eind_datum)}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}
                              >
                                {p.status ?? "—"}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-p transition-colors" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                    <p className="text-xs text-slate-400">
                      {filtered.length} project
                      {filtered.length !== 1 ? "en" : ""}
                    </p>
                  </div>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden space-y-2">
                  {filtered.map((p) => {
                    const sc = STATUS_CONFIG[p.status ?? ""] ?? {
                      bg: "bg-slate-100",
                      text: "text-slate-500",
                      border: "border-slate-200",
                    };
                    return (
                      <div
                        key={p.id}
                        onClick={() =>
                          router.push(
                            `/klant/projecten/afgerond/bekijken/${p.id}`,
                          )
                        }
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0 mt-0.5">
                              <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {p.naam}
                              </p>
                              {p.beschrijving && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                  {p.beschrijving}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-1.5">
                                <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
                                <p className="text-xs text-slate-400 truncate">
                                  {p.locatie_naam ?? "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}
                            >
                              {p.status ?? "—"}
                            </span>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <p className="text-xs text-slate-400">
                            {formatDate(p.start_datum)}
                            {p.eind_datum
                              ? ` — ${formatDate(p.eind_datum)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-slate-400 text-center pt-1">
                    {filtered.length} project{filtered.length !== 1 ? "en" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
