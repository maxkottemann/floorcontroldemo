"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { melding } from "@/types/melding";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  BellAlertIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeldingenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "all">("open");
  const [notHandledMeldingen, setNotHandledMeldingen] = useState<melding[]>([]);
  const [allMeldingen, setAllMeldingen] = useState<melding[]>([]);
  const [zoekterm, setZoekterm] = useState("");
  const [loading, setLoading] = useState(true);

  function mapMelding(d: any): melding {
    return {
      id: d.id,
      profielnaam: (d.profielen as any)?.naam,
      kamervloer_id: d.kamervloer_id,
      kamervloer_naam: (d.kamer_vloeren as any)?.vloer_types?.naam,
      titel: d.titel,
      beschrijving: d.beschrijving,
      afgehandeld: d.afgehandeld,
      aangemaakt_op: d.aangemaakt_op,
    };
  }

  useEffect(() => {
    async function getMeldingen() {
      setLoading(true);
      try {
        const [{ data: open }, { data: all }] = await Promise.all([
          supabase
            .from("meldingen")
            .select(
              "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam)),titel,beschrijving,afgehandeld,aangemaakt_op",
            )
            .eq("afgehandeld", false)
            .order("aangemaakt_op", { ascending: false }),
          supabase
            .from("meldingen")
            .select(
              "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam)),titel,beschrijving,afgehandeld,aangemaakt_op",
            )
            .order("aangemaakt_op", { ascending: false }),
        ]);

        setNotHandledMeldingen((open ?? []).map(mapMelding));
        setAllMeldingen((all ?? []).map(mapMelding));
      } catch (err) {
        showToast("Kon meldingen niet laden", "error");
      } finally {
        setLoading(false);
      }
    }
    getMeldingen();
  }, []);

  const active = tab === "open" ? notHandledMeldingen : allMeldingen;
  const filtered = active.filter((m) =>
    [m.titel, m.beschrijving, m.kamervloer_naam, m.profielnaam].some((f) =>
      f?.toLowerCase().includes(zoekterm.toLowerCase()),
    ),
  );

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Meldingen" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Meldingen
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Beheer en bekijk alle ingediende meldingen
                </p>
              </div>
              {notHandledMeldingen.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <BellAlertIcon className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-amber-600">
                    {notHandledMeldingen.length} openstaand
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {[
                    {
                      key: "open",
                      label: "Openstaand",
                      count: notHandledMeldingen.length,
                    },
                    { key: "all", label: "Alle", count: allMeldingen.length },
                  ].map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key as "open" | "all")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        tab === key
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          tab === key
                            ? key === "open" && count > 0
                              ? "bg-amber-100 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                            : "bg-slate-200 text-slate-400"
                        }`}
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
                    placeholder="Zoek op titel, vloer..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[24px_1fr_160px_120px_100px_40px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                {[
                  "",
                  "Melding",
                  "Vloertype",
                  "Ingediend door",
                  "Datum",
                  "",
                ].map((h, i) => (
                  <p
                    key={i}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {h}
                  </p>
                ))}
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <BellAlertIcon className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      {tab === "open"
                        ? "Geen openstaande meldingen"
                        : "Geen meldingen gevonden"}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {zoekterm
                        ? "Probeer een andere zoekterm"
                        : tab === "open"
                          ? "Alles is afgehandeld"
                          : "Er zijn nog geen meldingen"}
                    </p>
                  </div>
                ) : (
                  filtered.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => router.push(`/meldingen/bekijken/${m.id}`)}
                      className="grid grid-cols-[24px_1fr_160px_120px_100px_40px] items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        {m.afgehandeld ? (
                          <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-p transition-colors">
                          {m.titel}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {m.beschrijving}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-p/10 flex items-center justify-center shrink-0">
                          <ExclamationTriangleIcon className="w-3 h-3 text-p" />
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {m.kamervloer_naam ?? "—"}
                        </p>
                      </div>

                      <p className="text-sm text-slate-400 truncate">
                        {m.profielnaam ?? "—"}
                      </p>

                      <div>
                        <p className="text-xs font-semibold text-slate-600">
                          {formatDate(m.aangemaakt_op)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(m.aangemaakt_op)}
                        </p>
                      </div>

                      <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p transition-colors" />
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                <p className="text-xs text-slate-400">
                  {filtered.length} melding{filtered.length !== 1 ? "en" : ""}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
