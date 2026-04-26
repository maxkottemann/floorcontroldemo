"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  MapPinIcon,
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  CalendarDaysIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

interface OnderhoudAanvraag {
  id: string;
  naam: string;
  beschrijving: string | null;
  opmerkingen: string | null;
  uitleg: string | null;
  afgehandeld: boolean;
  aangemaakt_op: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  locatie_adres: string | null;
  profiel_naam: string | null;
}

interface Bericht {
  id: string;
  profiel_id: string | null;
  profiel_naam: string | null;
  bericht: string;
  aangemaakt_op: string;
}

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
function formatTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIMELINE_STEPS = [
  {
    label: "Aanvraag ingediend",
    sub: (a: OnderhoudAanvraag) => formatDateTime(a.aangemaakt_op),
  },
  {
    label: "Ontvangen bij Duofort",
    sub: () => "Uw aanvraag is in goede orde ontvangen",
  },
  { label: "In behandeling", sub: () => "Wordt bekeken door ons team" },
  { label: "Afgehandeld", sub: (a: OnderhoudAanvraag) => a.uitleg ?? "Gereed" },
];

export default function OnderhoudBekijkenClientPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aanvraag, setAanvraag] = useState<OnderhoudAanvraag | null>(null);
  const [loading, setLoading] = useState(true);
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [nieuwBericht, setNieuwBericht] = useState("");
  const [currentProfielId, setCurrentProfielId] = useState<string | null>(null);
  const [currentProfielNaam, setCurrentProfielNaam] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [berichten]);

  // Get current profiel
  useEffect(() => {
    async function getProfiel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profielen")
        .select("id, naam")
        .eq("gebruiker_id", user.id)
        .single();
      if (data) {
        setCurrentProfielId(data.id);
        setCurrentProfielNaam(data.naam);
        currentProfielIdRef.current = data.id;
        currentProfielNaamRef.current = data.naam;
      }
    }
    getProfiel();
  }, []);

  useEffect(() => {
    async function getAanvraag() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("onderhoud_aanvragen")
        .select(
          "id, naam, beschrijving, opmerkingen, uitleg, afgehandeld, aangemaakt_op, locaties(naam, plaats, adres), profielen(naam)",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        showToast("Aanvraag kon niet worden geladen", "error");
        setLoading(false);
        return;
      }

      setAanvraag({
        id: data.id,
        naam: data.naam,
        beschrijving: data.beschrijving ?? null,
        opmerkingen: data.opmerkingen ?? null,
        uitleg: data.uitleg ?? null,
        afgehandeld: data.afgehandeld ?? false,
        aangemaakt_op: data.aangemaakt_op,
        locatie_naam: (data.locaties as any)?.naam ?? "—",
        locatie_plaats: (data.locaties as any)?.plaats ?? null,
        locatie_adres: (data.locaties as any)?.adres ?? null,
        profiel_naam: (data.profielen as any)?.naam,
      });
      setLoading(false);
    }
    getAanvraag();
  }, [id]);

  const currentProfielIdRef = useRef<string | null>(null);
  const currentProfielNaamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const aanvraagId = Array.isArray(id) ? id[0] : id;

    async function loadBerichten() {
      const { data, error } = await supabase
        .from("onderhoud_aanvraag_berichten")
        .select("id, profiel_id, bericht, aangemaakt_op, profielen(naam)")
        .eq("aanvraag_id", aanvraagId)
        .order("aangemaakt_op", { ascending: true });

      if (error) {
        showToast("Berichten konden niet worden geladen", "error");
        return;
      }

      setBerichten(
        (data ?? []).map((d: any) => ({
          id: d.id,
          profiel_id: d.profiel_id,
          bericht: d.bericht,
          aangemaakt_op: d.aangemaakt_op,
          profiel_naam: d.profielen?.naam ?? null,
        })),
      );
    }

    loadBerichten();

    const channel = supabase
      .channel(`onderhoud_berichten_${aanvraagId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "onderhoud_aanvraag_berichten",
          filter: `aanvraag_id=eq.${aanvraagId}`,
        },
        (payload) => {
          const row = payload.new as any;

          // Immediately add the message using refs for current user info
          setBerichten((prev) => {
            if (prev.find((b) => b.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                profiel_id: row.profiel_id,
                bericht: row.bericht,
                aangemaakt_op: row.aangemaakt_op,
                profiel_naam:
                  row.profiel_id === currentProfielIdRef.current
                    ? currentProfielNaamRef.current
                    : null,
              },
            ];
          });

          if (row.profiel_id !== currentProfielIdRef.current) {
            supabase
              .from("profielen")
              .select("naam")
              .eq("id", row.profiel_id)
              .single()
              .then(({ data }) => {
                if (!data) return;
                setBerichten((prev) =>
                  prev.map((b) =>
                    b.id === row.id ? { ...b, profiel_naam: data.naam } : b,
                  ),
                );
              });
          }
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function handleSendBericht() {
    if (!nieuwBericht.trim() || !currentProfielId) return;
    const aanvraagId = Array.isArray(id) ? id[0] : id;
    setSending(true);
    const { error } = await supabase
      .from("onderhoud_aanvraag_berichten")
      .insert({
        aanvraag_id: aanvraagId,
        profiel_id: currentProfielId,
        bericht: nieuwBericht.trim(),
      });
    if (error) {
      showToast("Bericht kon niet worden verzonden", "error");
      setSending(false);
      return;
    }
    setNieuwBericht("");
    setSending(false);
  }

  const currentStep = aanvraag?.afgehandeld ? 3 : 2;

  const timelineCard = (a: OnderhoudAanvraag) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 md:px-5 py-4 border-b border-slate-50">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Voortgang
        </p>
      </div>
      <div className="p-4 md:p-5">
        {TIMELINE_STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 transition-all
                  ${isActive ? "bg-p animate-pulse" : isDone ? "bg-emerald-500" : "bg-slate-200"}`}
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
                  {step.sub(a)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-50">
        {[
          {
            label: "Status",
            value: a.afgehandeld ? "Afgehandeld" : "In behandeling",
          },
          { label: "Locatie", value: a.locatie_naam },
          { label: "Ingediend", value: formatDate(a.aangemaakt_op) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-50 last:border-0"
          >
            <p className="text-xs font-semibold text-slate-400">{label}</p>
            <p className="text-xs font-bold text-slate-800 text-right max-w-[60%] truncate">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
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
          title="Aanvraag bekijken"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : !aanvraag ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-slate-400 font-medium">
                Aanvraag niet gevonden
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Back + header */}
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Terug naar aanvragen
                </button>

                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-0.5">
                      Uw aanvraag
                    </p>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                      {aanvraag.naam}
                    </h1>
                    {aanvraag.beschrijving && (
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                        {aanvraag.beschrijving}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {aanvraag.afgehandeld ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircleIcon className="w-3.5 h-3.5" />{" "}
                          Afgehandeld
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-p/8 text-p border border-p/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-p animate-pulse shrink-0" />
                          In behandeling
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatDateTime(aanvraag.aangemaakt_op)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two column */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 md:gap-6 items-start">
                {/* Left */}
                <div className="space-y-4 md:space-y-5">
                  {/* Status banner / afhandeling */}
                  {!aanvraag.afgehandeld ? (
                    <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 bg-p/5 border border-p/15 rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-p animate-pulse" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-p">
                          Aanvraag wordt behandeld
                        </p>
                        <p className="text-xs text-p/70 mt-0.5 leading-relaxed">
                          Uw aanvraag is ontvangen en wordt zo spoedig mogelijk
                          behandeld. U hoeft verder niets te doen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-emerald-100">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-emerald-800">
                            Aanvraag afgehandeld
                          </h2>
                          <p className="text-xs text-emerald-600">
                            Uw aanvraag is succesvol verwerkt
                          </p>
                        </div>
                      </div>
                      <div className="p-4 md:p-5">
                        {aanvraag.uitleg ? (
                          <div className="flex items-start gap-3 px-4 py-3.5 bg-white border border-emerald-100 rounded-xl">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                                Toelichting
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {aanvraag.uitleg}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-600 italic">
                            Geen toelichting opgegeven.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aanvraagdetails */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                        <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">
                        Aanvraagdetails
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 border-b border-slate-50">
                      {[
                        {
                          icon: (
                            <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Ingediend door",
                          value: aanvraag.profiel_naam ?? "—",
                        },
                        {
                          icon: (
                            <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Ingediend op",
                          value: formatDate(aanvraag.aangemaakt_op),
                        },
                        {
                          icon: (
                            <ClockIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Tijd",
                          value: formatTime(aanvraag.aangemaakt_op),
                        },
                      ].map(({ icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-start gap-2.5 px-4 md:px-5 py-3.5"
                        >
                          <div className="mt-0.5">{icon}</div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                              {label}
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {aanvraag.beschrijving && (
                      <div className="px-4 md:px-5 py-4 border-b border-slate-50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Beschrijving
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {aanvraag.beschrijving}
                        </p>
                      </div>
                    )}
                    {aanvraag.opmerkingen && (
                      <div className="px-4 md:px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                          Uw opmerkingen
                        </p>
                        <div className="flex items-start gap-2.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {aanvraag.opmerkingen}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
                      {[
                        {
                          icon: (
                            <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Naam",
                          value: aanvraag.locatie_naam,
                        },
                        {
                          icon: (
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Plaats",
                          value: aanvraag.locatie_plaats ?? "—",
                        },
                        {
                          icon: (
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />
                          ),
                          label: "Adres",
                          value: aanvraag.locatie_adres ?? "—",
                        },
                      ].map(({ icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-start gap-2.5 px-4 md:px-5 py-3.5"
                        >
                          <div className="mt-0.5">{icon}</div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                              {label}
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-p" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-sm font-bold text-slate-800">
                          Berichten
                        </h2>
                        <p className="text-xs text-slate-400">
                          Communiceer direct met ons team
                        </p>
                      </div>
                      {berichten.length > 0 && (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          {berichten.length}
                        </span>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="px-4 md:px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
                      {berichten.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-slate-200 mb-2" />
                          <p className="text-sm text-slate-300 font-medium">
                            Nog geen berichten
                          </p>
                          <p className="text-xs text-slate-200 mt-0.5">
                            Stuur een bericht naar ons team
                          </p>
                        </div>
                      ) : (
                        berichten.map((b) => {
                          const isOwn = b.profiel_id === currentProfielId;
                          return (
                            <div
                              key={b.id}
                              className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${isOwn ? "bg-p text-white" : "bg-slate-100 text-slate-500"}`}
                              >
                                {(b.profiel_naam ?? "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div
                                className={`max-w-[72%] min-w-0 flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                              >
                                <div
                                  className={`flex items-baseline gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                                >
                                  <p className="text-xs font-bold text-slate-700">
                                    {isOwn ? "Jij" : b.profiel_naam}
                                  </p>
                                  <p className="text-xs text-slate-300">
                                    {formatTime(b.aangemaakt_op)}
                                  </p>
                                </div>
                                <div
                                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isOwn ? "bg-p text-white rounded-tr-sm" : "bg-slate-50 border border-slate-100 text-slate-600 rounded-tl-sm"}`}
                                >
                                  {b.bericht}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Compose */}
                    <div className="px-4 md:px-5 pb-4 md:pb-5 pt-3 border-t border-slate-50">
                      <div className="flex gap-3 items-end">
                        <div className="w-7 h-7 rounded-full bg-p flex items-center justify-center shrink-0 mb-0.5 text-[10px] font-bold text-white">
                          {currentProfielNaam?.charAt(0).toUpperCase() ?? "J"}
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            value={nieuwBericht}
                            onChange={(e) => setNieuwBericht(e.target.value)}
                            rows={2}
                            placeholder="Schrijf een bericht aan ons team..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-28 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-p/20 focus:border-p/40 transition-all leading-relaxed"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey) &&
                                nieuwBericht.trim()
                              )
                                handleSendBericht();
                            }}
                          />
                          <button
                            onClick={handleSendBericht}
                            disabled={!nieuwBericht.trim() || sending}
                            className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-p hover:bg-p/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                          >
                            {sending ? (
                              <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                              "Verstuur"
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-2 ml-10">
                        ⌘+Enter om te versturen
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right — timeline */}
                {timelineCard(aanvraag)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
