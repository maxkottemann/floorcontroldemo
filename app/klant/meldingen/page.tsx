"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  SwatchIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface OnderhoudAanvraag {
  id: string;
  beschrijving: string;
  status: string;
  aangemaakt_op: string;
  geplande_datum: string | null;
  locatie_naam: string;
  locatie_plaats: string | null;
  aanvraag_vloeren_count: number;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
  }
> = {
  ingediend: {
    label: "Ingediend",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
    dot: "bg-blue-400",
    icon: <ClockIcon className="w-4 h-4 text-blue-500" />,
  },
  in_behandeling: {
    label: "In behandeling",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-400 animate-pulse",
    icon: <ArrowPathIcon className="w-4 h-4 text-amber-500" />,
  },
  ingepland: {
    label: "Ingepland",
    bg: "bg-p/10",
    text: "text-p",
    border: "border-p/20",
    dot: "bg-p",
    icon: <CalendarDaysIcon className="w-4 h-4 text-p" />,
  },
  afgerond: {
    label: "Afgerond",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
    icon: <CheckCircleIcon className="w-4 h-4 text-emerald-500" />,
  },
  afgewezen: {
    label: "Afgewezen",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
    dot: "bg-red-400",
    icon: <XCircleIcon className="w-4 h-4 text-red-500" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function AanvraagCard({ a }: { a: OnderhoudAanvraag }) {
  const router = useRouter();
  const s = statusConfig[a.status];
  const isAfgerond = a.status === "afgerond" || a.status === "afgewezen";

  return (
    <div
      onClick={() => router.push(`/klant/meldingen/bekijken/${a.id}`)}
      className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden active:bg-slate-50
        ${isAfgerond ? "border-slate-100 opacity-80 hover:opacity-100 hover:border-p/20" : "border-slate-100 hover:border-p/20"}`}
    >
      <div className="flex items-start gap-3 md:gap-4 px-4 md:px-5 py-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${s?.bg ?? "bg-slate-100"}`}
        >
          {s?.icon ?? <CalendarDaysIcon className="w-4 h-4 text-slate-400" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <p className="text-sm font-bold text-slate-800 truncate">
                {a.locatie_naam}
              </p>
              {a.locatie_plaats && (
                <span className="text-sm text-slate-400 shrink-0">
                  · {a.locatie_plaats}
                </span>
              )}
            </div>
            <StatusBadge status={a.status} />
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {a.beschrijving}
          </p>

          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <SwatchIcon className="w-3.5 h-3.5 text-slate-300" />
              <p className="text-xs text-slate-400">
                {a.aanvraag_vloeren_count} vloer
                {a.aanvraag_vloeren_count !== 1 ? "en" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-slate-300" />
              <p className="text-xs text-slate-400">
                Ingediend {formatDate(a.aangemaakt_op)}
              </p>
            </div>
            {a.geplande_datum && (
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-p" />
                <p className="text-xs text-p font-semibold">
                  Gepland {formatDate(a.geplande_datum)}
                </p>
              </div>
            )}
          </div>
        </div>

        <ChevronRightIcon className="w-4 h-4 text-slate-200 shrink-0 mt-1" />
      </div>
    </div>
  );
}

const STATUS_GROUPS = [
  {
    key: "actief",
    label: "Lopende aanvragen",
    dot: "bg-amber-400",
    statuses: ["ingediend", "in_behandeling"],
  },
  {
    key: "ingepland",
    label: "Onderhoud ingepland",
    dot: "bg-p",
    statuses: ["ingepland"],
  },
  {
    key: "afgerond",
    label: "Onderhoud afgerond",
    dot: "bg-emerald-400",
    statuses: ["afgerond", "afgewezen"],
  },
];

export default function OnderhoudOverzichtPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aanvragen, setAanvragen] = useState<OnderhoudAanvraag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAanvragen() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("onderhouds_aanvragen")
          .select(
            `
            id,
            beschrijving,
            status,
            aangemaakt_op,
            geplande_datum,
            locaties(naam, plaats),
            onderhouds_aanvragen_vloeren(count)
          `,
          )
          .order("aangemaakt_op", { ascending: false });

        if (error) throw error;

        setAanvragen(
          (data ?? []).map((d: any) => ({
            id: d.id,
            beschrijving: d.beschrijving,
            status: d.status,
            aangemaakt_op: d.aangemaakt_op,
            geplande_datum: d.geplande_datum ?? null,
            locatie_naam: d.locaties?.naam ?? "—",
            locatie_plaats: d.locaties?.plaats ?? null,
            aanvraag_vloeren_count:
              d.onderhouds_aanvragen_vloeren?.[0]?.count ?? 0,
          })),
        );
      } catch {
        showToast("Kon aanvragen niet laden", "error");
      } finally {
        setLoading(false);
      }
    }
    getAanvragen();
  }, []);

  const totaalActief = aanvragen.filter((a) =>
    ["ingediend", "in_behandeling"].includes(a.status),
  ).length;
  const totaalIngepland = aanvragen.filter(
    (a) => a.status === "ingepland",
  ).length;
  const totaalAfgerond = aanvragen.filter((a) =>
    ["afgerond", "afgewezen"].includes(a.status),
  ).length;

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
          title="Onderhoud aanvragen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Onderhoud aanvragen
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Volg de status van uw onderhoudaanvragen
                </p>
              </div>
              <button
                onClick={() => router.push("/klant/meldingen/maken")}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Aanvraag indienen</span>
                <span className="sm:hidden">Aanvraag</span>
              </button>
            </div>

            {/* Stat cards */}
            {!loading && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Lopende aanvragen",
                    count: totaalActief,
                    bg: "bg-amber-50",
                    text: "text-amber-600",
                    border: "border-amber-100",
                    dot: "bg-amber-400",
                  },
                  {
                    label: "Onderhoud ingepland",
                    count: totaalIngepland,
                    bg: "bg-p/10",
                    text: "text-p",
                    border: "border-p/20",
                    dot: "bg-p",
                  },
                  {
                    label: "Onderhoud afgerond",
                    count: totaalAfgerond,
                    bg: "bg-emerald-50",
                    text: "text-emerald-600",
                    border: "border-emerald-100",
                    dot: "bg-emerald-400",
                  },
                ].map(({ label, count, bg, text, border, dot }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${bg} ${border} border`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{count}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : aanvragen.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-4">
                  <CalendarDaysIcon className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-base font-semibold text-slate-400">
                  Nog geen aanvragen
                </p>
                <p className="text-sm text-slate-300 mt-1 mb-5">
                  Dien uw eerste onderhoudaanvraag in
                </p>
                <button
                  onClick={() => router.push("/klant/meldingen/maken")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4" />
                  Aanvraag indienen
                </button>
              </div>
            ) : (
              <>
                {STATUS_GROUPS.map(({ key, label, dot, statuses }) => {
                  const groep = aanvragen.filter((a) =>
                    statuses.includes(a.status),
                  );
                  if (groep.length === 0) return null;
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <h2 className="text-sm font-bold text-slate-700">
                          {label}
                        </h2>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border
                          ${
                            key === "actief"
                              ? "text-amber-600 bg-amber-50 border-amber-100"
                              : key === "ingepland"
                                ? "text-p bg-p/10 border-p/20"
                                : "text-emerald-600 bg-emerald-50 border-emerald-100"
                          }`}
                        >
                          {groep.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groep.map((a) => (
                          <AanvraagCard key={a.id} a={a} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
