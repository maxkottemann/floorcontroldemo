"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  MapPinIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RapportenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [alleProjecten, setAlleProjecten] = useState<project[]>([]);
  const [zoekterm, setZoekterm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function getProjecten() {
      const { error, data } = await supabase
        .from("projecten")
        .select(
          "id, naam, locaties!projecten_locatie_id_fkey(naam, plaats), aangemaakt_op, start_datum, eind_datum",
        )
        .eq("status", "afgerond")
        .order("aangemaakt_op", { ascending: false })
        .limit(20);

      if (error || !data) {
        showToast("Projecten niet geladen, probeer het opnieuw", "error");
        return;
      }

      setAlleProjecten(
        data.map((d: any) => ({
          id: d.id,
          locatie_naam: (d.locaties as any)?.naam,
          locatie_plaats: (d.locaties as any)?.plaats,
          naam: d.naam,
          aangemaakt_op: d.aangemaakt_op,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
        })),
      );
    }
    getProjecten();
  }, []);

  const filtered = alleProjecten.filter((p) =>
    [p.naam, p.locatie_naam].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

  const selected = alleProjecten.find((p) => p.id === selectedId);

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Rapporten" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Overzicht
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Rapporten
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Selecteer een afgerond project om een rapport te genereren
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      value={zoekterm}
                      onChange={(e) => setZoekterm(e.target.value)}
                      placeholder="Zoek op projectnaam of locatie..."
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 text-slate-700 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_160px_120px_40px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                  {["Project", "Locatie", "Datum", ""].map((h) => (
                    <p
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </p>
                  ))}
                </div>

                <div className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                        <DocumentTextIcon className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium">
                        Geen projecten gevonden
                      </p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {zoekterm
                          ? "Probeer een andere zoekterm"
                          : "Er zijn nog geen afgeronde projecten"}
                      </p>
                    </div>
                  ) : (
                    filtered.map((p) => {
                      const isSelected = selectedId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() =>
                            setSelectedId(isSelected ? null : p.id)
                          }
                          className={`grid grid-cols-[1fr_160px_120px_40px] items-center px-5 py-3.5 cursor-pointer transition-all duration-150 border-l-2
                            ${isSelected ? "bg-p/5 border-l-p" : "border-l-transparent hover:bg-slate-50"}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                              ${isSelected ? "bg-p text-white" : "bg-slate-100 text-slate-400"}`}
                            >
                              {isSelected ? (
                                <CheckCircleIcon className="w-4 h-4" />
                              ) : (
                                <DocumentTextIcon className="w-4 h-4" />
                              )}
                            </div>
                            <p
                              className={`text-sm font-semibold truncate ${isSelected ? "text-p" : "text-slate-800"}`}
                            >
                              {p.naam}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <p className="text-sm text-slate-500 truncate">
                              {p.locatie_naam ?? "—"}
                            </p>
                          </div>

                          <p className="text-sm text-slate-400">
                            {formatDate(p.aangemaakt_op)}
                          </p>

                          <ChevronRightIcon
                            className={`w-4 h-4 transition-colors ${isSelected ? "text-p" : "text-slate-200"}`}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                  <p className="text-xs text-slate-400">
                    {filtered.length} project{filtered.length !== 1 ? "en" : ""}{" "}
                    gevonden
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {!selected ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <DocumentTextIcon className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">
                      Geen project geselecteerd
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Selecteer een rij om acties te zien
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-5 border-b border-slate-50 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-p/60 mb-1">
                        Geselecteerd
                      </p>
                      <p className="text-base font-bold text-slate-800">
                        {selected.naam}
                      </p>
                      {selected.locatie_naam && (
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />
                          <p className="text-sm text-slate-400">
                            {selected.locatie_naam}
                          </p>
                        </div>
                      )}
                      {(selected.start_datum || selected.eind_datum) && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300" />
                          <p className="text-xs text-slate-400">
                            {formatDate(selected.start_datum)} —{" "}
                            {formatDate(selected.eind_datum)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-4 border-b border-slate-50">
                      <button
                        onClick={() =>
                          router.push(`/rapporten/bekijken/${selected.id}`)
                        }
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
                          label: "Opleverbon",
                          sub: "Overzicht van alle vloeren en m²",
                        },
                      ].map(({ label, sub }) => (
                        <a
                          key={label}
                          href={`/api/rapport?project_id=${selected.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
