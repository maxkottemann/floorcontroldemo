"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

interface OnderhoudAanvraag {
  id: string;
  beschrijving: string;
  status: string;
  aangemaakt_op: string;
  geplande_datum: string | null;
  locatie_naam: string;
  locatie_plaats: string | null;
  aangevraagd_door_naam: string | null;
  vloeren_count: number;
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
    icon: <ClockIcon className="w-3.5 h-3.5 text-blue-500" />,
  },
  in_behandeling: {
    label: "In behandeling",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-400 animate-pulse",
    icon: <ArrowPathIcon className="w-3.5 h-3.5 text-amber-500" />,
  },
  ingepland: {
    label: "Ingepland",
    bg: "bg-p/10",
    text: "text-p",
    border: "border-p/20",
    dot: "bg-p",
    icon: <CalendarDaysIcon className="w-3.5 h-3.5 text-p" />,
  },
  afgerond: {
    label: "Afgerond",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
    icon: <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />,
  },
  afgewezen: {
    label: "Afgewezen",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
    dot: "bg-red-400",
    icon: <XCircleIcon className="w-3.5 h-3.5 text-red-500" />,
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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

const STATUS_TABS = [
  { key: "actief", label: "Actief", statuses: ["ingediend", "in_behandeling"] },
  { key: "ingepland", label: "Ingepland", statuses: ["ingepland"] },
  { key: "afgerond", label: "Afgerond", statuses: ["afgerond", "afgewezen"] },
  { key: "all", label: "Alle", statuses: [] },
];

export default function OnderhoudAanvragenAdminPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aanvragen, setAanvragen] = useState<OnderhoudAanvraag[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoekterm, setZoekterm] = useState("");
  const [tab, setTab] = useState<string>("actief");

  useEffect(() => {
    async function getAanvragen() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("onderhouds_aanvragen")
          .select(
            `
            id, beschrijving, status, aangemaakt_op, geplande_datum,
            locaties(naam, plaats),
            profielen!aangevraagd_door(naam),
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
            aangevraagd_door_naam: d.profielen?.naam ?? null,
            vloeren_count: d.onderhouds_aanvragen_vloeren?.[0]?.count ?? 0,
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

  const activeTab = STATUS_TABS.find((t) => t.key === tab)!;
  const filtered = aanvragen
    .filter(
      (a) =>
        activeTab.statuses.length === 0 ||
        activeTab.statuses.includes(a.status),
    )
    .filter((a) =>
      [
        a.locatie_naam,
        a.locatie_plaats,
        a.beschrijving,
        a.aangevraagd_door_naam,
      ].some((f) => f?.toLowerCase().includes(zoekterm.toLowerCase())),
    );

  const countForTab = (statuses: string[]) =>
    statuses.length === 0
      ? aanvragen.length
      : aanvragen.filter((a) => statuses.includes(a.status)).length;

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <CalendarDaysIcon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm text-slate-400 font-medium">
        {zoekterm
          ? "Geen resultaten gevonden"
          : "Geen aanvragen in deze categorie"}
      </p>
      <p className="text-xs text-slate-300 mt-0.5">
        {zoekterm
          ? "Probeer een andere zoekterm"
          : "Aanvragen verschijnen hier zodra ze zijn ingediend"}
      </p>
    </div>
  );

  const tabs = STATUS_TABS.map((t) => ({
    ...t,
    count: countForTab(t.statuses),
  }));

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
          {/* ── Desktop ── */}
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
                  Beheer en verwerk binnenkomende onderhoudaanvragen
                </p>
              </div>
              <div className="flex items-center gap-2">
                {[
                  {
                    label: "Actief",
                    count: countForTab(["ingediend", "in_behandeling"]),
                    bg: "bg-amber-50",
                    text: "text-amber-600",
                    border: "border-amber-100",
                    dot: "bg-amber-400",
                  },
                  {
                    label: "Ingepland",
                    count: countForTab(["ingepland"]),
                    bg: "bg-p/10",
                    text: "text-p",
                    border: "border-p/20",
                    dot: "bg-p",
                  },
                ].map(({ label, count, bg, text, border, dot }) =>
                  count > 0 ? (
                    <div
                      key={label}
                      className={`flex items-center gap-2 px-4 py-2.5 ${bg} border ${border} rounded-2xl`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <p className={`text-sm font-bold ${text}`}>
                        {count} {label.toLowerCase()}
                      </p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {tabs.map(({ key, label, count }) => {
                    const isActive = tab === key;
                    const hasAlert = key === "actief" && count > 0;
                    return (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${isActive ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                      >
                        {label}
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${isActive ? (hasAlert ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500") : "bg-slate-200 text-slate-400"}`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    value={zoekterm}
                    onChange={(e) => setZoekterm(e.target.value)}
                    placeholder="Zoek op locatie, beschrijving..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_140px_100px_120px_80px_40px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                {[
                  "Locatie",
                  "Status",
                  "Vloeren",
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
                  emptyState
                ) : (
                  filtered.map((a) => (
                    <div
                      key={a.id}
                      onClick={() =>
                        router.push(`/meldingen/onderhoud/${a.id}`)
                      }
                      className="grid grid-cols-[1fr_140px_100px_120px_80px_40px] items-center px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-p transition-colors">
                            {a.locatie_naam}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5 pl-5">
                          {a.beschrijving}
                        </p>
                      </div>
                      <div>
                        <StatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <SwatchIcon className="w-3.5 h-3.5 text-slate-300" />
                        <p className="text-sm text-slate-500">
                          {a.vloeren_count}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {a.aangevraagd_door_naam ?? "—"}
                      </p>
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

          {/* ── Mobile ── */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Onderhoud aanvragen
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alle binnenkomende aanvragen
                </p>
              </div>
              {countForTab(["ingediend", "in_behandeling"]) > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <p className="text-xs font-bold text-amber-600">
                    {countForTab(["ingediend", "in_behandeling"])}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {tabs.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                >
                  {label}
                  <span
                    className={`text-[10px] font-bold px-1 py-0.5 rounded-full ${tab === key ? (key === "actief" && count > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500") : "bg-slate-200 text-slate-400"}`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Zoek op locatie..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all shadow-sm"
              />
            </div>

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
                    onClick={() => router.push(`/meldingen/onderhoud/${a.id}`)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${statusConfig[a.status]?.bg ?? "bg-slate-100"}`}
                      >
                        {statusConfig[a.status]?.icon ?? (
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {a.locatie_naam}
                            </p>
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {a.beschrijving}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <SwatchIcon className="w-3.5 h-3.5 text-slate-300" />
                            <p className="text-xs text-slate-400">
                              {a.vloeren_count} vloeren
                            </p>
                          </div>
                          {a.aangevraagd_door_naam && (
                            <p className="text-xs text-slate-400">
                              {a.aangevraagd_door_naam}
                            </p>
                          )}
                          {a.geplande_datum && (
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-p" />
                              <p className="text-xs text-p font-semibold">
                                {formatDate(a.geplande_datum)}
                              </p>
                            </div>
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
