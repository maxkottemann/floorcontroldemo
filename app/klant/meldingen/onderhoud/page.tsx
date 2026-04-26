"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserIcon,
  PlusIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";
import MainButton from "@/components/layout/mainbutton";

interface OnderhoudAanvraag {
  id: string;
  naam: string;
  beschrijving: string | null;
  opmerkingen: string | null;
  afgehandeld: boolean;
  aangemaakt_op: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  profiel_naam: string | null;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OnderhoudAanvragenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aanvragen, setAanvragen] = useState<OnderhoudAanvraag[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "afgehandeld">("open");

  useEffect(() => {
    async function getAanvragen() {
      setLoading(true);
      const { data, error } = await supabase
        .from("onderhoud_aanvragen")
        .select(
          "id, naam, beschrijving, opmerkingen, afgehandeld, aangemaakt_op, locaties(naam, plaats), profielen(naam)",
        )
        .order("aangemaakt_op", { ascending: false });

      if (error) {
        showToast("Aanvragen konden niet worden geladen", "error");
        setLoading(false);
        return;
      }

      setAanvragen(
        (data ?? []).map((d: any) => ({
          id: d.id,
          naam: d.naam,
          beschrijving: d.beschrijving ?? null,
          opmerkingen: d.opmerkingen ?? null,
          afgehandeld: d.afgehandeld ?? false,
          aangemaakt_op: d.aangemaakt_op,
          locatie_naam: d.locaties?.naam ?? "—",
          locatie_plaats: d.locaties?.plaats ?? null,
          profiel_naam: d.profielen?.naam,
        })),
      );
      setLoading(false);
    }
    getAanvragen();
  }, []);

  const open = aanvragen.filter((a) => !a.afgehandeld);
  const afgehandeld = aanvragen.filter((a) => a.afgehandeld);
  const displayed = (activeTab === "open" ? open : afgehandeld).filter((a) =>
    [a.naam, a.locatie_naam, a.beschrijving].some((f) =>
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

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar
          title="Onderhoud aanvragen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-row justify-between">
                <div>
                  <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Terug
                  </button>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    Onderhoud aanvragen
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {open.length} open · {afgehandeld.length} afgehandeld
                  </p>
                </div>
              </div>
              <MainButton
                label="Nieuw onderhoud aanvragen"
                onClick={() =>
                  router.push("/klant/meldingen/onderhoud/aanvragen")
                }
                icon={<PlusIcon></PlusIcon>}
              ></MainButton>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm p-1 shrink-0">
                {(["open", "afgehandeld"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${activeTab === tab ? "bg-p text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {tab === "open"
                      ? `Open (${open.length})`
                      : `Afgehandeld (${afgehandeld.length})`}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  value={zoekterm}
                  onChange={(e) => setZoekterm(e.target.value)}
                  placeholder="Zoek op naam, locatie..."
                  className="w-full pl-11 pr-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-100 rounded-xl outline-none focus:border-p/30 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  {zoekterm
                    ? "Geen aanvragen gevonden"
                    : activeTab === "open"
                      ? "Geen open aanvragen"
                      : "Geen afgehandelde aanvragen"}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {zoekterm
                    ? "Probeer een andere zoekterm"
                    : "Er zijn nog geen aanvragen ingediend"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-10" />
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                          Aanvraag
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-48">
                          Locatie
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-36">
                          Ingediend
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-36">
                          Aanvrager
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                          Status
                        </th>
                        <th className="w-8 px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {displayed.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() =>
                            router.push(
                              `/klant/meldingen/onderhoud/bekijken/${a.id}`,
                            )
                          }
                          className="cursor-pointer transition-colors group hover:bg-blue-50/40 bg-white"
                        >
                          <td className="pl-5 py-4">
                            <div
                              className={`w-8 h-8 ml-3 rounded-xl flex items-center justify-center transition-colors shrink-0
                              ${a.afgehandeld ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-p/10 group-hover:bg-p/20"}`}
                            >
                              {a.afgehandeld ? (
                                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800 group-hover:text-p transition-colors">
                              {a.naam}
                            </p>
                            {a.beschrijving && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                {a.beschrijving}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-slate-500 truncate">
                                  {a.locatie_naam}
                                </p>
                                {a.locatie_plaats && (
                                  <p className="text-xs text-slate-300 truncate">
                                    {a.locatie_plaats}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <p className="text-sm text-slate-500">
                                {formatDate(a.aangemaakt_op)}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {a.profiel_naam ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {a.profiel_naam.charAt(0)}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  {a.profiel_naam}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300">—</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {a.afgehandeld ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                Afgehandeld
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                                Open
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-p transition-colors" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                    <p className="text-xs text-slate-400">
                      {displayed.length} aanvra
                      {displayed.length !== 1 ? "gen" : "ag"}
                    </p>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {displayed.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => router.push(`/onderhoud/bekijken/${a.id}`)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${a.afgehandeld ? "bg-emerald-50" : "bg-p/10"}`}
                          >
                            {a.afgehandeld ? (
                              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {a.naam}
                            </p>
                            {a.beschrijving && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {a.beschrijving}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5">
                              <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
                              <p className="text-xs text-slate-400 truncate">
                                {a.locatie_naam}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {a.afgehandeld ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircleIcon className="w-3 h-3" />{" "}
                              Afgehandeld
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />{" "}
                              Open
                            </span>
                          )}
                          <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          <p className="text-xs text-slate-400">
                            {formatDate(a.aangemaakt_op)}
                          </p>
                        </div>
                        {a.profiel_naam && (
                          <>
                            <span className="text-slate-200">·</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-p/15 text-p text-[8px] font-bold flex items-center justify-center shrink-0">
                                {a.profiel_naam.charAt(0)}
                              </div>
                              <p className="text-xs text-slate-400 truncate">
                                {a.profiel_naam}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 text-center pt-1 pb-2">
                    {displayed.length} aanvra
                    {displayed.length !== 1 ? "gen" : "ag"}
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
