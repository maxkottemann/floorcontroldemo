"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import SidebarClient from "@/components/layout/sidebarclient";
import { useEffect, useState } from "react";
import { project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SteekproevenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState<project[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function getProjects() {
      const { data, error } = await supabase
        .from("projecten")
        .select(
          "id, locaties(naam), naam, beschrijving, aangemaakt_op, start_datum, eind_datum, status",
        )
        .eq("status", "afgerond")
        .order("eind_datum", { ascending: false });

      if (error) {
        showToast("Er ging iets mis, probeer het opnieuw", "error");
        setLoading(false);
        return;
      }

      setProjects(
        (data || []).map((d: any) => ({
          id: d.id,
          locatie_naam: d.locaties?.naam,
          naam: d.naam,
          beschrijving: d.beschrijving,
          aangemaakt_op: d.aangemaakt_op,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
          status: d.status,
        })),
      );
      setLoading(false);
    }
    getProjects();
  }, []);

  const filtered = projects.filter((p) =>
    [p.naam, p.locatie_naam].some((f) =>
      f?.toLowerCase().includes(zoek.toLowerCase()),
    ),
  );

  const selected = projects.find((p) => p.id === selectedId);

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
                Selecteer een afgerond project om een steekproef te starten
              </p>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op projectnaam of locatie..."
                className="w-full pl-11 pr-4 py-3 text-sm bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
              />
            </div>

            {/* Project cards */}
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
                    : "Er zijn nog geen afgeronde projecten"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => {
                  const isSelected = selectedId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-150
                        ${isSelected ? "border-p/30 ring-2 ring-p/10" : "border-slate-100 hover:border-slate-200 hover:shadow-md"}`}
                    >
                      <div className="flex items-center gap-4 px-5 py-4">
                        {/* Icon */}
                        <div
                          onClick={() =>
                            setSelectedId(isSelected ? null : p.id)
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer
                          ${isSelected ? "bg-p text-white" : "bg-slate-100 text-slate-400"}`}
                        >
                          {isSelected ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            <ClipboardDocumentCheckIcon className="w-5 h-5" />
                          )}
                        </div>

                        {/* Info */}
                        <div
                          onClick={() =>
                            setSelectedId(isSelected ? null : p.id)
                          }
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p
                            className={`text-sm font-bold truncate ${isSelected ? "text-p" : "text-slate-800"}`}
                          >
                            {p.naam}
                          </p>
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/klant/steekproeven/uitvoeren/${p.id}`,
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-p text-white hover:bg-p/90 transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          <ClipboardDocumentCheckIcon className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-bold hidden sm:block">
                            Starten
                          </span>
                          <ChevronRightIcon className="w-3.5 h-3.5 opacity-70" />
                        </button>
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
