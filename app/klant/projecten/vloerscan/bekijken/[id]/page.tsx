"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  MapPinIcon,
  CalendarDaysIcon,
  TruckIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

interface Vloerscan {
  id: string;
  naam: string;
  beschrijving: string | null;
  status: string;
  start_datum: string | null;
  eind_datum: string | null;
  extra_checkin: boolean;
  aangemaakt_op: string;
  locatie_id: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  locatie_adres: string | null;
  medewerker_id: string | null;
  medewerker_naam: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  gepland: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
    dot: "bg-blue-400",
    label: "Gepland",
  },
  bezig: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-100",
    dot: "bg-amber-400 animate-pulse",
    label: "Bezig",
  },
  afgerond: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
    label: "Afgerond",
  },
  geannuleerd: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
    dot: "bg-red-400",
    label: "Geannuleerd",
  },
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIMELINE_STEPS = [
  {
    key: "gepland",
    label: "Ingepland",
    sub: (s: Vloerscan) => formatDate(s.aangemaakt_op),
  },
  { key: "bezig", label: "Gestart", sub: () => "Scan is begonnen" },
  {
    key: "afgerond",
    label: "Afgerond",
    sub: (s: Vloerscan) => (s.eind_datum ? formatDate(s.eind_datum) : "Gereed"),
  },
];

export default function VloerscanBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scan, setScan] = useState<Vloerscan | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function getScan() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("vloerscans")
        .select(
          "id, naam, beschrijving, status, start_datum, eind_datum, extra_checkin, aangemaakt_op, locatie_id, locaties(naam, plaats, adres), medewerker_id, medewerkers(voornaam, achternaam)",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        showToast("Scan kon niet worden geladen", "error");
        setLoading(false);
        return;
      }

      setScan({
        id: data.id,
        naam: data.naam ?? "Naamloos",
        beschrijving: data.beschrijving ?? null,
        status: data.status,
        start_datum: data.start_datum,
        eind_datum: data.eind_datum,
        extra_checkin: data.extra_checkin ?? false,
        aangemaakt_op: data.aangemaakt_op,
        locatie_id: data.locatie_id,
        locatie_naam: (data.locaties as any)?.naam ?? "—",
        locatie_plaats: (data.locaties as any)?.plaats ?? null,
        locatie_adres: (data.locaties as any)?.adres ?? null,
        medewerker_id: data.medewerker_id,
        medewerker_naam: data.medewerkers
          ? `${(data.medewerkers as any).voornaam} ${(data.medewerkers as any).achternaam}`
          : null,
      });
      setLoading(false);
    }
    getScan();
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!scan) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("vloerscans")
      .update({ status: newStatus })
      .eq("id", scan.id);
    if (error) {
      showToast("Status kon niet worden bijgewerkt", "error");
      setUpdatingStatus(false);
      return;
    }
    setScan((prev) => (prev ? { ...prev, status: newStatus } : null));
    showToast("Status bijgewerkt", "success");
    setUpdatingStatus(false);
  }

  const statusConfig = scan
    ? (STATUS_CONFIG[scan.status] ?? STATUS_CONFIG.gepland)
    : STATUS_CONFIG.gepland;

  const currentStepIndex = TIMELINE_STEPS.findIndex(
    (s) => s.key === scan?.status,
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
          title="Vloerscan"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : !scan ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-slate-400 font-medium">
                Vloerscan niet gevonden
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Terug naar vloerscans
                </button>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex flex-row">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60">
                          Vloerscan
                        </p>
                      </div>
                      <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
                        {scan.naam}
                      </h1>
                      {scan.beschrijving && (
                        <p className="text-sm text-slate-400 mt-1">
                          {scan.beschrijving}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2  ml-3  flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`}
                        />
                        {statusConfig.label}
                      </span>
                      {scan.extra_checkin && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          Aanmeldprocedure vereist
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 md:gap-6 items-start">
                {/* Left — main content */}
                <div className="space-y-4 md:space-y-5">
                  {/* Info cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {/* Locatie */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                          <MapPinIcon className="w-4 h-4 text-p" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Locatie
                        </h2>
                      </div>
                      <div className="p-4 md:p-5 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Naam
                          </p>
                          <p className="text-sm font-semibold text-slate-800">
                            {scan.locatie_naam}
                          </p>
                        </div>
                        {scan.locatie_plaats && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              Plaats
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {scan.locatie_plaats}
                            </p>
                          </div>
                        )}
                        {scan.locatie_adres && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              Adres
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {scan.locatie_adres}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() =>
                            router.push(
                              `/klant/locaties/bekijken/${scan.locatie_id}`,
                            )
                          }
                          className="text-xs font-semibold text-p hover:text-p/70 transition-colors cursor-pointer"
                        >
                          Locatie bekijken →
                        </button>
                      </div>
                    </div>

                    {/* Datum */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                          <CalendarDaysIcon className="w-4 h-4 text-p" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Planning
                        </h2>
                      </div>
                      <div className="p-4 md:p-5 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Startdatum
                          </p>
                          <p className="text-sm font-semibold text-slate-800">
                            {formatDate(scan.start_datum)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Einddatum
                          </p>
                          <p className="text-sm font-semibold text-slate-800">
                            {formatDate(scan.eind_datum)}
                          </p>
                        </div>
                        {scan.start_datum &&
                          scan.eind_datum &&
                          scan.start_datum !== scan.eind_datum && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                Duur
                              </p>
                              <p className="text-sm font-semibold text-slate-800">
                                {Math.ceil(
                                  (new Date(scan.eind_datum).getTime() -
                                    new Date(scan.start_datum).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ) + 1}{" "}
                                dagen
                              </p>
                            </div>
                          )}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Aangemaakt op
                          </p>
                          <p className="text-sm font-semibold text-slate-800">
                            {formatDateTime(scan.aangemaakt_op)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medewerker */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-p" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">
                        Medewerker
                      </h2>
                    </div>
                    <div className="p-4 md:p-5">
                      {scan.medewerker_naam ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-p/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-p">
                              {scan.medewerker_naam.charAt(0)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800">
                            {scan.medewerker_naam}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <UserGroupIcon className="w-4 h-4 text-slate-300" />
                          </div>
                          <p className="text-sm text-slate-300 italic">
                            Geen medewerker toegewezen
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extra check-in info */}
                  {scan.extra_checkin && (
                    <div className="flex items-start gap-3 px-4 py-4 bg-amber-50 border border-amber-100 rounded-2xl">
                      <ShieldCheckIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-700 mb-0.5">
                          Aanmeldprocedure vereist
                        </p>
                        <p className="text-xs text-amber-600 leading-relaxed">
                          Medewerkers dienen zich bij aankomst eerst te melden
                          bij de receptie of beveiligingsdienst voordat zij de
                          locatie betreden.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Status actions */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-p" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">
                        Status bijwerken
                      </h2>
                    </div>
                    <div className="p-4 md:p-5">
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            status: "gepland",
                            label: "Markeer als gepland",
                            color:
                              "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
                          },
                          {
                            status: "bezig",
                            label: "Markeer als bezig",
                            color:
                              "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
                          },
                          {
                            status: "afgerond",
                            label: "Markeer als afgerond",
                            color:
                              "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
                          },
                          {
                            status: "geannuleerd",
                            label: "Markeer als geannuleerd",
                            color:
                              "bg-red-50 text-red-700 border-red-100 hover:bg-red-100",
                          },
                        ]
                          .filter((s) => s.status !== scan.status)
                          .map((s) => (
                            <button
                              key={s.status}
                              onClick={() => updateStatus(s.status)}
                              disabled={updatingStatus}
                              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${s.color}`}
                            >
                              {s.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — timeline + summary */}
                <div className="space-y-4">
                  {/* Timeline */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 md:px-5 py-4 border-b border-slate-50">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Voortgang
                      </p>
                    </div>
                    <div className="p-4 md:p-5">
                      {TIMELINE_STEPS.map((step, i) => {
                        const isDone =
                          currentStepIndex > i || scan.status === step.key;
                        const isActive = scan.status === step.key;
                        return (
                          <div key={step.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 transition-all ${isActive ? "bg-p animate-pulse" : isDone ? "bg-emerald-500" : "bg-slate-200"}`}
                              />
                              {i < TIMELINE_STEPS.length - 1 && (
                                <div
                                  className={`w-px my-1 ${isDone ? "bg-emerald-200" : "bg-slate-100"}`}
                                  style={{ minHeight: "28px" }}
                                />
                              )}
                            </div>
                            <div className="pb-4 min-w-0">
                              <p
                                className={`text-sm font-semibold ${isDone || isActive ? "text-slate-800" : "text-slate-300"}`}
                              >
                                {step.label}
                              </p>
                              <p
                                className={`text-xs mt-0.5 leading-snug ${isDone || isActive ? "text-slate-400" : "text-slate-200"}`}
                              >
                                {step.sub(scan)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Samenvatting */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-4 md:px-5 py-4 border-b border-slate-50">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Samenvatting
                      </p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {[
                        { label: "Naam", value: scan.naam },
                        { label: "Locatie", value: scan.locatie_naam },
                        {
                          label: "Startdatum",
                          value: formatDate(scan.start_datum),
                        },
                        {
                          label: "Einddatum",
                          value: formatDate(scan.eind_datum),
                        },
                        {
                          label: "Medewerker",
                          value: scan.medewerker_naam ?? "—",
                        },
                        { label: "Status", value: statusConfig.label },
                        {
                          label: "Check-in",
                          value: scan.extra_checkin
                            ? "Vereist"
                            : "Niet vereist",
                        },
                        {
                          label: "Aangemaakt",
                          value: formatDateTime(scan.aangemaakt_op),
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between px-4 md:px-5 py-3"
                        >
                          <p className="text-xs font-semibold text-slate-400">
                            {label}
                          </p>
                          <p className="text-xs font-bold text-slate-800 text-right max-w-[60%] truncate">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
