"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { melding } from "@/types/melding";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  BellAlertIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  SwatchIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MeldingenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMeldingen, setOpenMeldingen] = useState<melding[]>([]);
  const [afgehandeldMeldingen, setAfgehandeldMeldingen] = useState<melding[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  function mapMelding(d: any): melding {
    return {
      id: d.id,
      profielnaam: d.profielen?.naam,
      kamervloer_id: d.kamervloer_id,
      kamervloer_naam: (d.kamer_vloeren as any)?.vloer_types?.naam,
      titel: d.titel,
      beschrijving: d.beschrijving,
      afgehandeld: d.afgehandeld,
      aangemaakt_op: d.aangemaakt_op,
      uitleg: d.uitleg,
    };
  }

  useEffect(() => {
    async function getMeldingen() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("meldingen")
          .select(
            "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam)),titel,beschrijving,afgehandeld,aangemaakt_op,uitleg",
          )
          .order("aangemaakt_op", { ascending: false });
        const all = (data ?? []).map(mapMelding);
        setOpenMeldingen(all.filter((m) => !m.afgehandeld));
        setAfgehandeldMeldingen(all.filter((m) => m.afgehandeld));
      } catch {
        showToast("Kon meldingen niet laden", "error");
      } finally {
        setLoading(false);
      }
    }
    getMeldingen();
  }, []);

  function MeldingCard({ m, open }: { m: melding; open: boolean }) {
    return (
      <div
        onClick={() => router.push(`/klant/meldingen/bekijken/${m.id}`)}
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden active:bg-slate-50 ${
          open
            ? "border-slate-100 hover:border-p/20"
            : "border-slate-100 hover:border-p/20 opacity-80 hover:opacity-100"
        }`}
      >
        <div className="flex items-start gap-3 md:gap-4 px-4 md:px-5 py-4">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${open ? "bg-amber-50" : "bg-emerald-50"}`}
          >
            {open ? (
              <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <p
                className={`text-sm font-bold truncate ${open ? "text-slate-800" : "text-slate-600"}`}
              >
                {m.titel}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 border ${
                  open
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}
              >
                {open ? "Openstaand" : "Afgehandeld"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {m.beschrijving}
            </p>
            {m.uitleg && (
              <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                    Toelichting
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {m.uitleg}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              {m.kamervloer_naam && (
                <div className="flex items-center gap-1.5">
                  <SwatchIcon className="w-3.5 h-3.5 text-slate-300" />
                  <p className="text-xs text-slate-400">{m.kamervloer_naam}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-slate-300" />
                <p className="text-xs text-slate-400">
                  {formatDate(m.aangemaakt_op)}
                </p>
              </div>
            </div>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-slate-200 shrink-0 mt-1" />
        </div>
      </div>
    );
  }

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
          title="Meldingen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-6 md:space-y-8 ">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Meldingen
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Bekijk en volg uw ingediende meldingen
                </p>
              </div>
              <div className="flex flex-row gap-2 md:gap-3">
                <button
                  onClick={() => router.push("/klant/meldingen/maken")}
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Melding maken</span>
                  <span className="sm:hidden">Melding</span>
                </button>
                <button
                  onClick={() => router.push("/klant/meldingen/onderhoud")}
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white hover:bg-slate-50 text-p text-sm font-bold rounded-xl border border-p/20 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Onderhoud aanvragen</span>
                  <span className="sm:hidden">Onderhoud</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* Openstaand */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <h2 className="text-sm font-bold text-slate-700">
                      Openstaand
                    </h2>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {openMeldingen.length}
                    </span>
                  </div>
                  {openMeldingen.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 bg-white rounded-2xl border border-slate-100 text-center">
                      <CheckCircleIcon className="w-8 h-8 text-emerald-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-400">
                        Geen openstaande meldingen
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Alles is afgehandeld
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {openMeldingen.map((m) => (
                        <MeldingCard key={m.id} m={m} open={true} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Afgehandeld */}
                {afgehandeldMeldingen.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h2 className="text-sm font-bold text-slate-700">
                        Afgehandeld
                      </h2>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {afgehandeldMeldingen.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {afgehandeldMeldingen.map((m) => (
                        <MeldingCard key={m.id} m={m} open={false} />
                      ))}
                    </div>
                  </div>
                )}

                {openMeldingen.length === 0 &&
                  afgehandeldMeldingen.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                        <BellAlertIcon className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-400">
                        Nog geen meldingen
                      </p>
                      <p className="text-sm text-slate-300 mt-1 mb-5">
                        Maak uw eerste melding aan
                      </p>
                      <button
                        onClick={() => router.push("/klant/meldingen/maken")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Melding maken
                      </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
