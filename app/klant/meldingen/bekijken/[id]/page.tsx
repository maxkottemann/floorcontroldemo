"use client";
import Toast from "@/components/layout/toast";
import { useToast } from "@/components/hooks/usetoasts";
import SidebarClient from "@/components/layout/sidebarclient";
import Topbar from "@/components/layout/topbar";
import { supabase } from "@/lib/supabase";
import { melding } from "@/types/melding";
import { bericht } from "@/types/berichten";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  SwatchIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
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

export default function MeldingBekijkenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [melding, setMelding] = useState<melding | undefined>();
  const [loading, setLoading] = useState(true);
  const [alleBerichten, setAlleBerichten] = useState<bericht[]>([]);
  const [currentProfielId, setCurrentProfielId] = useState<string | null>(null);
  const [bericht, setBericht] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [alleBerichten]);

  // Fetch current user's profiel id
  useEffect(() => {
    async function getCurrentProfiel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profiel } = await supabase
        .from("profielen")
        .select("id")
        .eq("gebruiker_id", user.id)
        .single();
      if (profiel) setCurrentProfielId(profiel.id);
    }
    getCurrentProfiel();
  }, []);

  // Fetch melding
  useEffect(() => {
    async function getMelding() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("meldingen")
        .select(
          "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam)),titel,beschrijving,afgehandeld,aangemaakt_op,uitleg",
        )
        .eq("id", id)
        .single();
      if (error || !data) {
        showToast("Melding kon niet geladen worden", "error");
        setLoading(false);
        return;
      }
      setMelding({
        id: data.id,
        profielnaam: (data.profielen as any)?.naam,
        kamervloer_id: data.kamervloer_id,
        kamervloer_naam: (data.kamer_vloeren as any)?.vloer_types?.naam,
        titel: data.titel,
        beschrijving: data.beschrijving,
        afgehandeld: data.afgehandeld,
        aangemaakt_op: data.aangemaakt_op,
        uitleg: data.uitleg,
      });
      setLoading(false);
    }
    getMelding();
  }, [id]);

  // Berichten: initial load + realtime subscription
  useEffect(() => {
    if (!id) return;

    async function loadBerichten() {
      const { data: berichten, error } = await supabase
        .from("melding_berichten")
        .select("id,profiel_id,bericht,aangemaakt_op,profielen(naam)")
        .eq("melding_id", id)
        .order("aangemaakt_op", { ascending: true });

      if (error) {
        showToast("Kon berichten niet laden", "error");
        return;
      }
      setAlleBerichten(
        (berichten || []).map((d: any) => ({
          id: d.id,
          profiel_id: d.profiel_id,
          profiel_naam: d.profielen?.naam,
          bericht: d.bericht,
          aangemaakt_op: d.aangemaakt_op,
        })),
      );
    }

    loadBerichten();

    const channel = supabase
      .channel(`melding_berichten:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "melding_berichten",
          filter: `melding_id=eq.${id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("melding_berichten")
            .select("id,profiel_id,bericht,aangemaakt_op,profielen(naam)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setAlleBerichten((prev) => [
              ...prev,
              {
                id: data.id,
                profiel_id: data.profiel_id,
                profiel_naam: (data.profielen as any)?.naam,
                bericht: data.bericht,
                aangemaakt_op: data.aangemaakt_op,
              },
            ]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function handleSendMessage() {
    if (!bericht.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profiel } = await supabase
      .from("profielen")
      .select("id")
      .eq("gebruiker_id", user?.id ?? "")
      .single();

    const { error } = await supabase.from("melding_berichten").insert({
      melding_id: id,
      profiel_id: profiel?.id,
      bericht: bericht,
    });
    if (error) {
      showToast("Bericht kon niet worden verzonden", "error");
      return;
    }
    setBericht("");
  }

  const timelineSteps = melding
    ? [
        {
          label: "Melding ingediend",
          sub: formatDate(melding.aangemaakt_op),
          done: true,
          active: false,
        },
        {
          label: "Ontvangen bij Duofort",
          sub: "Wordt bekeken door ons team",
          done: true,
          active: !melding.afgehandeld,
        },
        {
          label: "In behandeling",
          sub: melding.afgehandeld ? "Actie ondernomen" : "Wachten op actie",
          done: melding.afgehandeld,
          active: false,
        },
        {
          label: "Afgehandeld",
          sub: melding.afgehandeld
            ? (melding.uitleg ?? "Gereed")
            : "Nog niet afgehandeld",
          done: melding.afgehandeld,
          active: false,
        },
      ]
    : [];

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
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : !melding ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-slate-400 font-medium">
                Melding niet gevonden
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
                  Terug naar meldingen
                </button>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                      Melding
                    </p>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
                      {melding.titel}
                    </h1>
                  </div>
                  {melding.afgehandeld ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Afgehandeld</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Openstaand</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status banner */}
              {!melding.afgehandeld && (
                <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 bg-p/5 border border-p/15 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-p animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-p">
                      Melding is binnengekomen bij Duofort
                    </p>
                    <p className="text-xs text-p/70 mt-0.5">
                      Uw melding wordt zo snel mogelijk bekeken. U hoeft verder
                      niets te doen.
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop — two column */}
              <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="space-y-5">
                  {beschrijvingCard(melding)}
                  {uitlegCard(melding)}
                  {chatSection()}
                </div>
                {timelineCard(timelineSteps)}
              </div>

              {/* Mobile — single column */}
              <div className="xl:hidden space-y-4">
                {timelineCard(timelineSteps)}
                {beschrijvingCard(melding)}
                {uitlegCard(melding)}
                {chatSection()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  function chatSection() {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-p" />
          </div>
          <p className="text-sm font-bold text-slate-700">Berichten</p>
          {alleBerichten.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {alleBerichten.length}
            </span>
          )}
        </div>

        {/* Message history */}
        <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
          {alleBerichten.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ChatBubbleBottomCenterTextIcon className="w-7 h-7 text-slate-200 mb-2" />
              <p className="text-sm text-slate-300 font-medium">
                Nog geen berichten
              </p>
            </div>
          ) : (
            alleBerichten.map((b) => {
              const isOwn = b.profiel_id === currentProfielId;
              return (
                <div
                  key={b.id}
                  className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isOwn ? "bg-p" : "bg-slate-100"
                    }`}
                  >
                    <UserIcon
                      className={`w-3.5 h-3.5 ${isOwn ? "text-white" : "text-slate-400"}`}
                    />
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
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOwn
                          ? "bg-p text-white rounded-tr-sm"
                          : "bg-slate-50 border border-slate-100 text-slate-600 rounded-tl-sm"
                      }`}
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
        <div className="px-5 pb-5 pt-3 border-t border-slate-50">
          <div className="flex gap-3 items-end">
            <div className="w-7 h-7 rounded-full bg-p flex items-center justify-center shrink-0 mb-0.5">
              <UserIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 relative">
              <textarea
                value={bericht}
                placeholder="Schrijf een bericht…"
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-28 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-p/20 focus:border-p/40 transition-all leading-relaxed"
                onChange={(e) => setBericht(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    (e.metaKey || e.ctrlKey) &&
                    bericht.trim()
                  ) {
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!bericht.trim()}
                className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-p hover:bg-p/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
              >
                Verstuur
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 ml-10">
            ⌘ + Enter om te versturen
          </p>
        </div>
      </div>
    );
  }

  function beschrijvingCard(m: melding) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center">
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-p" />
            </div>
            <p className="text-sm font-bold text-slate-700">Beschrijving</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {m.beschrijving}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-50">
          {[
            {
              icon: <SwatchIcon className="w-3.5 h-3.5 text-slate-400" />,
              label: "Vloertype",
              value: m.kamervloer_naam ?? "—",
              sub: null,
            },
            {
              icon: <UserIcon className="w-3.5 h-3.5 text-slate-400" />,
              label: "Ingediend door",
              value: m.profielnaam ?? "—",
              sub: null,
            },
            {
              icon: <ClockIcon className="w-3.5 h-3.5 text-slate-400" />,
              label: "Datum",
              value: formatDate(m.aangemaakt_op),
              sub: formatTime(m.aangemaakt_op),
            },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className="px-4 md:px-6 py-3 md:py-4">
              <div className="flex items-center gap-2 mb-1.5">
                {icon}
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
              {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function uitlegCard(m: melding) {
    if (!m.afgehandeld) return null;
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              Toelichting afhandeling
            </p>
          </div>
          {m.uitleg ? (
            <p className="text-sm text-slate-600 leading-relaxed">{m.uitleg}</p>
          ) : (
            <p className="text-sm text-slate-300 italic">
              Geen toelichting opgegeven
            </p>
          )}
        </div>
      </div>
    );
  }

  function timelineCard(steps: typeof timelineSteps) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-50">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Voortgang
          </p>
        </div>
        <div className="p-4 md:p-5">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 transition-all ${step.active ? "bg-p animate-pulse" : step.done ? "bg-emerald-500" : "bg-slate-200"}`}
                />
                {i < steps.length - 1 && (
                  <div
                    className={`w-px my-1 ${step.done ? "bg-emerald-200" : "bg-slate-100"}`}
                    style={{ minHeight: "28px" }}
                  />
                )}
              </div>
              <div className="pb-4 min-w-0">
                <p
                  className={`text-sm font-semibold ${step.done || step.active ? "text-slate-800" : "text-slate-300"}`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 leading-snug ${step.done || step.active ? "text-slate-400" : "text-slate-200"}`}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
