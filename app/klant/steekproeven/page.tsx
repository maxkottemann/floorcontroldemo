"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import SidebarClient from "@/components/layout/sidebarclient";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Tab = "lopend" | "afgerond";

interface ProjectRow {
  id: string;
  naam: string;
  locatie_naam?: string;
  eind_datum?: string;
  steekproef_id?: string;
  steekproef_status?: string;
}

export default function SteekproevenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");
  const [tab, setTab] = useState<Tab>("lopend");

  useEffect(() => {
    async function load() {
      // Fetch all finished projects
      const { data: projecten, error } = await supabase
        .from("projecten")
        .select("id, naam, locaties(naam), eind_datum")
        .eq("status", "afgerond")
        .order("eind_datum", { ascending: false });

      if (error) {
        showToast("Laden mislukt", "error");
        setLoading(false);
        return;
      }

      // Fetch steekproeven for these projects
      const projectIds = (projecten || []).map((p) => p.id);
      const { data: steekproeven } = projectIds.length
        ? await supabase
            .from("steekproeven")
            .select("id, project_id, status")
            .in("project_id", projectIds)
        : { data: [] };

      const steekproefMap = Object.fromEntries(
        (steekproeven || []).map((s) => [s.project_id, s]),
      );

      setProjects(
        (projecten || []).map((p: any) => ({
          id: p.id,
          naam: p.naam,
          locatie_naam: p.locaties?.naam,
          eind_datum: p.eind_datum,
          steekproef_id: steekproefMap[p.id]?.id,
          steekproef_status: steekproefMap[p.id]?.status,
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  const lopend = projects.filter((p) => p.steekproef_status !== "afgerond");
  const afgerond = projects.filter((p) => p.steekproef_status === "afgerond");
  const tabProjects = tab === "lopend" ? lopend : afgerond;
  const filtered = tabProjects.filter((p) =>
    [p.naam, p.locatie_naam].some((f) =>
      f?.toLowerCase().includes(zoek.toLowerCase()),
    ),
  );

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Steekproeven" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Kwaliteitscontrole
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Steekproeven
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Selecteer een project om een steekproef te starten of te
                bekijken
              </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 w-fit">
              {(
                [
                  {
                    key: "lopend",
                    label: "Lopend",
                    icon: <ClockIcon className="w-3.5 h-3.5" />,
                    count: lopend.length,
                  },
                  {
                    key: "afgerond",
                    label: "Afgerond",
                    icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
                    count: afgerond.length,
                  },
                ] as {
                  key: Tab;
                  label: string;
                  icon: React.ReactNode;
                  count: number;
                }[]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
                    ${tab === t.key ? "bg-p text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                >
                  {t.icon}
                  {t.label}
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op projectnaam of locatie..."
                className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  Geen projecten gevonden
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {zoek
                    ? "Probeer een andere zoekterm"
                    : tab === "lopend"
                      ? "Alle steekproeven zijn afgerond"
                      : "Nog geen afgeronde steekproeven"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => {
                  const isDone = p.steekproef_status === "afgerond";
                  const isInProgress = p.steekproef_status === "in_progress";
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                          ${isDone ? "bg-emerald-100 text-emerald-600" : isInProgress ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}
                        >
                          {isDone ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : isInProgress ? (
                            <ClockIcon className="w-5 h-5" />
                          ) : (
                            <ClipboardDocumentCheckIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {p.naam}
                            </p>
                            {isDone && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                Afgerond
                              </span>
                            )}
                            {isInProgress && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                In uitvoering
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {p.locatie_naam && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPinIcon className="w-3 h-3 shrink-0" />
                                {p.locatie_naam}
                              </span>
                            )}
                            {p.eind_datum && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <CalendarDaysIcon className="w-3 h-3 shrink-0" />
                                Afgerond {formatDate(p.eind_datum)}
                              </span>
                            )}
                          </div>
                        </div>

                        {!isDone ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/klant/steekproeven/uitvoeren/${p.id}`,
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-p text-white hover:bg-p/90 transition-all cursor-pointer shadow-sm shrink-0"
                          >
                            <ClipboardDocumentCheckIcon className="w-4 h-4 shrink-0" />
                            <span className="text-sm font-bold hidden sm:block">
                              {isInProgress ? "Verdergaan" : "Starten"}
                            </span>
                            <ChevronRightIcon className="w-3.5 h-3.5 opacity-70" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              router.push(
                                `/klant/steekproeven/uitvoeren/${p.id}`,
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer shrink-0"
                          >
                            <span className="text-sm font-semibold hidden sm:block">
                              Bekijken
                            </span>
                            <ChevronRightIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-slate-400 text-center">
              {filtered.length} project{filtered.length !== 1 ? "en" : ""}{" "}
              gevonden
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
