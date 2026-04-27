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
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

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
function formatTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OnderhoudAanvragenAdminPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aanvragen, setAanvragen] = useState<OnderhoudAanvraag[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [tab, setTab] = useState<"open" | "afgehandeld">("open");

  function mapAanvraag(d: any): OnderhoudAanvraag {
    return {
      id: d.id,
      naam: d.naam,
      beschrijving: d.beschrijving ?? null,
      opmerkingen: d.opmerkingen ?? null,
      afgehandeld: d.afgehandeld ?? false,
      aangemaakt_op: d.aangemaakt_op,
      locatie_naam: d.locaties?.naam ?? "—",
      locatie_plaats: d.locaties?.plaats ?? null,
      profiel_naam: d.profielen?.naam ?? null,
    };
  }

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
      setAanvragen((data ?? []).map(mapAanvraag));
      setLoading(false);
    }
    getAanvragen();
  }, []);

  const open = aanvragen.filter((a) => !a.afgehandeld);
  const afgehandeld = aanvragen.filter((a) => a.afgehandeld);
  const active = tab === "open" ? open : afgehandeld;
  const filtered = active.filter((a) =>
    [a.naam, a.beschrijving, a.locatie_naam, a.profiel_naam].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

  const tabs = [
    { key: "open", label: "Openstaand", count: open.length },
    { key: "afgehandeld", label: "Afgehandeld", count: afgehandeld.length },
  ];

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <ClipboardDocumentListIcon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400 font-medium">
        {tab === "open"
          ? "Geen openstaande aanvragen"
          : "Geen afgehandelde aanvragen"}
      </p>
      <p className="text-xs text-slate-300 mt-0.5">
        {zoekterm
          ? "Probeer een andere zoekterm"
          : tab === "open"
            ? "Alles is afgehandeld"
            : "Er zijn nog geen afgehandelde aanvragen"}
      </p>
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
          title="Onderhoud aanvragen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          {/* Desktop */}
          <div className="hidden md:block space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Onderhoud aanvragen
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Beheer en verwerk alle ingediende onderhoudsverzoeken
                </p>
              </div>
              {open.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <ClockIcon className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-amber-600">
                    {open.length} openstaand
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {tabs.map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key as "open" | "afgehandeld")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {label}
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? (key === "open" && count > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500") : "bg-slate-200 text-slate-400"}`}
                      >
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    value={zoekterm}
                    onChange={(e) => setZoekterm(e.target.value)}
                    placeholder="Zoek op naam, locatie..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                  />
                </div>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[24px_1fr_180px_140px_120px_40px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                {["", "Aanvraag", "Locatie", "Aanvrager", "Datum", ""].map(
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

              {/* Rows */}
              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  emptyState
                ) : (
                  filtered.map((a) => (
                    <div
                      key={a.id}
                      onClick={() =>
                        router.push(`/meldingen/onderhoud/bekijken/${a.id}`)
                      }
                      className="grid grid-cols-[24px_1fr_180px_140px_120px_40px] items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        {a.afgehandeld ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-p transition-colors">
                          {a.naam}
                        </p>
                        {a.beschrijving && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {a.beschrijving}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        {a.profiel_naam ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                              {a.profiel_naam.charAt(0)}
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {a.profiel_naam}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-300">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600">
                          {formatDate(a.aangemaakt_op)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(a.aangemaakt_op)}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p transition-colors" />
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                <p className="text-xs text-slate-400">
                  {filtered.length} aanvra{filtered.length !== 1 ? "gen" : "ag"}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Onderhoud aanvragen
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alle ingediende onderhoudsverzoeken
                </p>
              </div>
              {open.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <ClockIcon className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs font-bold text-amber-600">
                    {open.length}
                  </p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {tabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "open" | "afgehandeld")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex-1 justify-center cursor-pointer ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                >
                  {label}
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === key ? (key === "open" && count > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500") : "bg-slate-200 text-slate-400"}`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Zoek op naam, locatie..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all shadow-sm"
              />
            </div>

            {/* Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              emptyState
            ) : (
              <div className="space-y-2">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    onClick={() =>
                      router.push(`/meldingen/onderhoud/bekijken/${a.id}`)
                    }
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0">
                        {a.afgehandeld ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {a.naam}
                        </p>
                        {a.beschrijving && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {a.beschrijving}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3 text-slate-300 shrink-0" />
                            <p className="text-xs text-slate-400 truncate">
                              {a.locatie_naam}
                            </p>
                          </div>
                          {a.profiel_naam && (
                            <>
                              <span className="text-slate-200">·</span>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-full bg-p/15 text-p text-[8px] font-bold flex items-center justify-center shrink-0">
                                  {a.profiel_naam.charAt(0)}
                                </div>
                                <p className="text-xs text-slate-400">
                                  {a.profiel_naam}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right flex flex-col items-end gap-1">
                        <p className="text-[11px] font-semibold text-slate-600">
                          {formatDate(a.aangemaakt_op)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(a.aangemaakt_op)}
                        </p>
                        <ChevronRightIcon className="w-4 h-4 text-slate-200 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400 text-center pt-1">
                  {filtered.length} aanvra{filtered.length !== 1 ? "gen" : "ag"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
