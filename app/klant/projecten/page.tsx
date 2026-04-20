"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useState, useEffect } from "react";
import { project } from "@/types/project";
import { supabase } from "@/lib/supabase";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  ChevronRightIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectenOverzichtPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projecten, setProjecten] = useState<project[]>([]);
  const [zoekterm, setZoekterm] = useState("");

  useEffect(() => {
    async function getProjecten() {
      const { error, data } = await supabase
        .from("projecten")
        .select("id, naam, locaties!projecten_locatie_id_fkey(naam, plaats)")
        .in("status", ["gepland", "bezig"])
        .order("aangemaakt_op", { ascending: false })
        .limit(20);
      if (error || !data) {
        console.log(error);
        showToast("Projecten niet geladen, probeer het opnieuw", "error");
        return;
      }
      setProjecten(
        data.map((d: any) => ({
          id: d.id,
          locatie_naam: (d.locaties as any)?.naam,
          naam: d.naam,
          beschrijving: d.beschrijving,
          opmerkingen: d.opmerkingen,
          aangemaakt_op: d.aangemaakt_op,
        })),
      );
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
                  Projecten
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {projecten.length} projecten gevonden
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-5 shrink-0">
                <button
                  onClick={() => router.push("/klant/projecten/afgerond")}
                  className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-white text-slate-600 text-sm font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Afgerond</span>
                </button>
                <button
                  onClick={() => router.push("/klant/projecten/agenda")}
                  className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <CalendarDaysIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Agenda bekijken</span>
                  <span className="sm:hidden">Agenda</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <ClipboardDocumentListIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Zoek op projectnaam of locatie"
                className="w-full pl-11 pr-4 py-3 text-sm text-p bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:border-p/30 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
              />
            </div>

            {/* Cards — 1 col mobile, 2 col md, 3 col xl */}
            {filtered.length === 0 ? (
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
                    : "Maak een nieuw project aan"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {filtered.map((p) => (
                  <a
                    key={p.id}
                    href={`/klant/projecten/bekijken/${p.id}`}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-p/20 active:bg-slate-50 transition-all duration-200 overflow-hidden"
                  >
                    <div className="h-1 bg-p/20 group-hover:bg-p transition-colors duration-300" />
                    <div className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0 group-hover:bg-p/15 transition-colors">
                          <ClipboardDocumentListIcon className="w-5 h-5 text-p" />
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p shrink-0 mt-1 transition-colors" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight mb-1 group-hover:text-p transition-colors">
                        {p.naam}
                      </h3>
                      {p.beschrijving && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {p.beschrijving}
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-50">
                        {p.locatie_naam && (
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="text-xs text-slate-500 font-medium truncate">
                              {p.locatie_naam}
                            </span>
                          </div>
                        )}
                        {p.opmerkingen && (
                          <div className="flex items-center gap-1.5">
                            <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="text-xs text-slate-400 truncate">
                              {p.opmerkingen}
                            </span>
                          </div>
                        )}
                        {p.aangemaakt_op && (
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            {formatDate(p.aangemaakt_op)}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
