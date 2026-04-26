"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentCheckIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface Vloerscan {
  id: string;
  naam: string;
  beschrijving: string | null;
  status: string;
  start_datum: string | null;
  eind_datum: string | null;
  extra_checkin: boolean;
  locatie_naam: string;
  locatie_plaats: string | null;
  medewerker_naam: string | null;
  aangemaakt_op: string;
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
  { bg: string; text: string; border: string; dot: string }
> = {
  gepland: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  bezig: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
  afgerond: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
  },
  geannuleerd: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
    dot: "bg-red-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function VloerscansPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scans, setScans] = useState<Vloerscan[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [activeTab, setActiveTab] = useState<"actief" | "afgerond">("actief");

  useEffect(() => {
    async function getScans() {
      setLoading(true);
      const { data, error } = await supabase
        .from("vloerscans")
        .select(
          "id, naam, beschrijving, status, start_datum, eind_datum, aangemaakt_op, locaties(naam, plaats), medewerkers(voornaam, achternaam)",
        )
        .order("start_datum", { ascending: false });

      if (error) {
        showToast("Scans konden niet worden geladen", "error");
        setLoading(false);
        return;
      }

      setScans(
        (data ?? []).map((d: any) => ({
          id: d.id,
          naam: d.naam ?? "Naamloos",
          beschrijving: d.beschrijving ?? null,
          status: d.status,
          start_datum: d.start_datum,
          eind_datum: d.eind_datum,
          extra_checkin: d.extra_checkin ?? false,
          aangemaakt_op: d.aangemaakt_op,
          locatie_naam: d.locaties?.naam ?? "—",
          locatie_plaats: d.locaties?.plaats ?? null,
          medewerker_naam: d.medewerkers
            ? `${d.medewerkers.voornaam} ${d.medewerkers.achternaam}`
            : null,
        })),
      );
      setLoading(false);
    }
    getScans();
  }, []);

  const actief = scans.filter((s) => ["gepland", "bezig"].includes(s.status));
  const afgerond = scans.filter((s) =>
    ["afgerond", "geannuleerd"].includes(s.status),
  );
  const displayed = (activeTab === "actief" ? actief : afgerond).filter((s) =>
    [s.naam, s.locatie_naam, s.beschrijving].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
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

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar
          title="Vloerscans"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Vloerscans
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {actief.length} actief · {afgerond.length} afgerond
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push("/projecten/agenda")}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CalendarDaysIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Agenda</span>
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 shrink-0" />

                <button
                  onClick={() => router.push("/projecten")}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ClipboardDocumentCheckIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Projecten</span>
                </button>
                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 shrink-0" />
                <button
                  onClick={() => router.push("/projecten/vloerscans/aanmaken")}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-p text-white text-sm font-bold rounded-xl shadow-sm hover:bg-p/90 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4 shrink-0" />
                  <span>Scan inplannen</span>
                </button>
              </div>
            </div>

            {/* Search + tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm p-1 shrink-0">
                {(["actief", "afgerond"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${activeTab === tab ? "bg-p text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {tab === "actief"
                      ? `Actief (${actief.length})`
                      : `Afgerond (${afgerond.length})`}
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
                  <ClipboardDocumentCheckIcon className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-400">
                  {zoekterm
                    ? "Geen scans gevonden"
                    : activeTab === "actief"
                      ? "Geen actieve scans"
                      : "Geen afgeronde scans"}
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  {zoekterm
                    ? "Probeer een andere zoekterm"
                    : "Plan een nieuwe vloerscan in"}
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
                          Scan
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-48">
                          Locatie
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-36">
                          Startdatum
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-36">
                          Einddatum
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-32">
                          Medewerker
                        </th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                          Status
                        </th>
                        <th className="w-8 px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {displayed.map((s) => (
                        <tr
                          key={s.id}
                          onClick={() =>
                            router.push(`/projecten/vloerscan/bekijken/${s.id}`)
                          }
                          className="cursor-pointer transition-colors group hover:bg-blue-50/40 bg-white"
                        >
                          <td className="pl-5 py-4">
                            <div className="w-8 h-8 ml-3 rounded-xl bg-p/10 group-hover:bg-p/20 flex items-center justify-center transition-colors shrink-0">
                              <ClipboardDocumentCheckIcon className="w-4 h-4 text-p" />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-p transition-colors">
                                {s.naam}
                              </p>
                              {s.extra_checkin && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-600 shrink-0">
                                  <ShieldCheckIcon className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            {s.beschrijving && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                {s.beschrijving}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
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
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-500">
                              {formatDate(s.start_datum)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-500">
                              {formatDate(s.eind_datum)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {s.medewerker_naam ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {s.medewerker_naam.charAt(0)}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  {s.medewerker_naam}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300">—</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={s.status} />
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
                      {displayed.length} scan{displayed.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="md:hidden space-y-2">
                  {displayed.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => router.push(`/vloerscan/afgerond/${s.id}`)}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ClipboardDocumentCheckIcon className="w-4 h-4 text-p" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {s.naam}
                              </p>
                              {s.extra_checkin && (
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                            </div>
                            {s.beschrijving && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {s.beschrijving}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5">
                              <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
                              <p className="text-xs text-slate-400 truncate">
                                {s.locatie_naam}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <StatusBadge status={s.status} />
                          <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                        <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <p className="text-xs text-slate-400">
                          {formatDate(s.start_datum)}
                          {s.eind_datum ? ` — ${formatDate(s.eind_datum)}` : ""}
                        </p>
                        {s.medewerker_naam && (
                          <>
                            <span className="text-slate-200">·</span>
                            <TruckIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <p className="text-xs text-slate-400 truncate">
                              {s.medewerker_naam}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-slate-400 text-center pt-1">
                    {displayed.length} scan{displayed.length !== 1 ? "s" : ""}
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
