"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Inputfield from "@/components/layout/inputfield";
import Datepicker from "@/components/layout/datepicker";
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
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Router } from "next/router";

interface OnderhoudAanvraag {
  id: string;
  naam: string;
  beschrijving: string | null;
  opmerkingen: string | null;
  uitleg: string | null;
  afgehandeld: boolean;
  aangemaakt_op: string;
  locatie_id: string;
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

function PlanProjectPopup({
  locatie_id,
  locatie_naam,
  onClose,
  onSuccess,
}: {
  locatie_id: string;
  locatie_naam: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [naam, setNaam] = useState("");
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function dagenTotStart(startDatum: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDatum);
    start.setHours(0, 0, 0, 0);
    return Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-visible"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Project aanmaken</p>
            <p className="text-xs text-slate-400 mt-0.5">{locatie_naam}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg cursor-pointer hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Inputfield
            title="Projectnaam"
            value={naam}
            onChange={setNaam}
            placeholder="Bijv. Onderhoud locatie A"
          />
          <div className="grid grid-cols-2 gap-3">
            <Datepicker
              title="Startdatum"
              value={startDatum}
              onChange={setStartDatum}
            />
            <Datepicker
              title="Einddatum"
              value={eindDatum}
              onChange={setEindDatum}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-p/5 border border-p/15 rounded-xl">
            <MapPinIcon className="w-4 h-4 text-p shrink-0" />
            <p className="text-xs text-p font-semibold">
              {locatie_naam} wordt automatisch gekoppeld
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={() => router.push("/projecten/aanmaken")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-p hover:bg-p/90 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            {saving ? "Bezig..." : "Project aanmaken"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnderhoudBekijkenAdminPage() {
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
  const [handling, setHandling] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [planPopupOpen, setPlanPopupOpen] = useState(false);
  const [confirm, setConfirm] = useState<"afhandelen" | "afwijzen" | null>(
    null,
  );
  const [uitleg, setUitleg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for realtime
  const currentProfielIdRef = useRef<string | null>(null);
  const currentProfielNaamRef = useRef<string | null>(null);

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

  // Load aanvraag
  useEffect(() => {
    async function getAanvraag() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("onderhoud_aanvragen")
        .select(
          "id, naam, beschrijving, opmerkingen, uitleg, afgehandeld, aangemaakt_op, locatie_id, locaties(naam, plaats, adres), profielen(naam)",
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
        locatie_id: data.locatie_id,
        locatie_naam: (data.locaties as any)?.naam ?? "—",
        locatie_plaats: (data.locaties as any)?.plaats ?? null,
        locatie_adres: (data.locaties as any)?.adres ?? null,
        profiel_naam: (data.profielen as any)?.naam ?? null,
      });
      setLoading(false);
    }
    getAanvraag();
  }, [id]);

  // Load berichten + realtime
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
      .channel(`onderhoud_admin_berichten_${aanvraagId}`)
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
      .subscribe((status) => console.log("Onderhoud admin realtime:", status));

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

  async function markAfgehandeld() {
    if (!aanvraag || !uitleg.trim()) {
      showToast("Vul een uitleg in", "error");
      return;
    }
    setHandling(true);
    const { error } = await supabase
      .from("onderhoud_aanvragen")
      .update({ afgehandeld: true, uitleg: uitleg.trim() })
      .eq("id", aanvraag.id);
    if (error) {
      showToast("Kon niet afhandelen", "error");
      setHandling(false);
      return;
    }
    setAanvraag((prev) =>
      prev ? { ...prev, afgehandeld: true, uitleg: uitleg.trim() } : null,
    );
    setUitleg("");
    setConfirm(null);
    showToast("Aanvraag afgehandeld", "success");
    setHandling(false);
  }

  async function markAfgewezen() {
    if (!aanvraag || !uitleg.trim()) {
      showToast("Vul een uitleg in", "error");
      return;
    }
    setRejecting(true);
    const { error } = await supabase
      .from("onderhoud_aanvragen")
      .update({ afgehandeld: true, uitleg: uitleg.trim() })
      .eq("id", aanvraag.id);
    if (error) {
      showToast("Kon niet afwijzen", "error");
      setRejecting(false);
      return;
    }
    setAanvraag((prev) =>
      prev ? { ...prev, afgehandeld: true, uitleg: uitleg.trim() } : null,
    );
    setUitleg("");
    setConfirm(null);
    showToast("Aanvraag afgewezen", "success");
    setRejecting(false);
  }

  const actionPanel = aanvraag && (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Acties
        </p>
      </div>
      <div className="p-5 space-y-3">
        {aanvraag.afgehandeld ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircleIcon className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-500">
              Aanvraag is afgehandeld
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Er zijn geen acties meer beschikbaar
            </p>
            {aanvraag.uitleg && (
              <div className="mt-3 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-left w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Uitleg
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {aanvraag.uitleg}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Plan project */}
            <button
              onClick={() => router.push("/projecten/aanmaken")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-p text-white hover:bg-p/90 transition-all cursor-pointer"
            >
              <CalendarDaysIcon className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">Project aanmaken</p>
                <p className="text-xs text-white/70">Plan een project</p>
              </div>
            </button>

            {/* Afhandelen */}
            {confirm === "afhandelen" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 text-center">
                  Aanvraag afhandelen?
                </p>
                <textarea
                  value={uitleg}
                  onChange={(e) => setUitleg(e.target.value)}
                  placeholder="Uitleg verplicht..."
                  rows={3}
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-300 placeholder:text-slate-300 resize-none transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setConfirm(null);
                      setUitleg("");
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold cursor-pointer text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={markAfgehandeld}
                    disabled={handling || !uitleg.trim()}
                    className="flex-1 py-1.5 text-xs font-bold text-white cursor-pointer bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {handling ? "Bezig..." : "Bevestigen"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirm("afhandelen")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-all cursor-pointer"
              >
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-700">
                    Afhandelen
                  </p>
                  <p className="text-xs text-emerald-600/70">
                    Markeer als afgehandeld
                  </p>
                </div>
              </button>
            )}

            {/* Afwijzen */}
            {confirm === "afwijzen" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600 text-center">
                  Aanvraag afwijzen?
                </p>
                <textarea
                  value={uitleg}
                  onChange={(e) => setUitleg(e.target.value)}
                  placeholder="Uitleg verplicht..."
                  rows={3}
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-300 placeholder:text-slate-300 resize-none transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setConfirm(null);
                      setUitleg("");
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={markAfgewezen}
                    disabled={rejecting || !uitleg.trim()}
                    className="flex-1 py-1.5 text-xs font-bold text-white cursor-pointer bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {rejecting ? "Bezig..." : "Bevestigen"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirm("afwijzen")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-600">Afwijzen</p>
                  <p className="text-xs text-slate-400">
                    Aanvraag niet relevant
                  </p>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const mainContent = aanvraag && (
    <>
      {/* Aanvraagdetails */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
            <ClipboardDocumentListIcon className="w-4 h-4 text-p" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Aanvraagdetails</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 border-b border-slate-50">
          {[
            {
              icon: <UserIcon className="w-3.5 h-3.5 text-slate-300" />,
              label: "Ingediend door",
              value: aanvraag.profiel_naam ?? "—",
            },
            {
              icon: <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-300" />,
              label: "Ingediend op",
              value: formatDate(aanvraag.aangemaakt_op),
            },
            {
              icon: <ClockIcon className="w-3.5 h-3.5 text-slate-300" />,
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
                <p className="text-sm font-semibold text-slate-800">{value}</p>
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
              Opmerkingen
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
          <h2 className="text-sm font-bold text-slate-800">Locatie</h2>
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
              icon: <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />,
              label: "Plaats",
              value: aanvraag.locatie_plaats ?? "—",
            },
            {
              icon: <MapPinIcon className="w-3.5 h-3.5 text-slate-300" />,
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
                <p className="text-sm font-semibold text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 md:px-5 py-3 border-t border-slate-50">
          <button
            onClick={() =>
              router.push(`/locaties/bekijken/${aanvraag.locatie_id}`)
            }
            className="text-xs font-semibold text-p hover:text-p/70 transition-colors cursor-pointer"
          >
            Locatie bekijken →
          </button>
        </div>
      </div>

      {/* Afhandeling card if done */}
      {aanvraag.afgehandeld && aanvraag.uitleg && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-emerald-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-800">
                Afhandeling
              </h2>
              <p className="text-xs text-emerald-600">
                Aanvraag is afgehandeld
              </p>
            </div>
          </div>
          <div className="p-4 md:p-5">
            <div className="flex items-start gap-3 px-4 py-3.5 bg-white border border-emerald-100 rounded-xl">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                  Uitleg
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {aanvraag.uitleg}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const messageArea = aanvraag && (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center">
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-p" />
        </div>
        <p className="text-sm font-bold text-slate-700">Berichten</p>
        {berichten.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {berichten.length}
          </span>
        )}
      </div>

      <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
        {berichten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ChatBubbleLeftEllipsisIcon className="w-7 h-7 text-slate-200 mb-2" />
            <p className="text-sm text-slate-300 font-medium">
              Nog geen berichten
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
                  {(b.profiel_naam ?? "?").charAt(0).toUpperCase()}
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

      <div className="px-5 pb-5 pt-3 border-t border-slate-50">
        <div className="flex gap-3 items-end">
          <div className="w-7 h-7 rounded-full bg-p flex items-center justify-center shrink-0 mb-0.5 text-[10px] font-bold text-white">
            {currentProfielNaam?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={nieuwBericht}
              onChange={(e) => setNieuwBericht(e.target.value)}
              rows={2}
              placeholder="Schrijf een bericht aan de klant..."
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
      </div>
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

      {planPopupOpen && aanvraag && (
        <PlanProjectPopup
          locatie_id={aanvraag.locatie_id}
          locatie_naam={aanvraag.locatie_naam}
          onClose={() => setPlanPopupOpen(false)}
          onSuccess={() => setConfirm("afhandelen")}
        />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Onderhoud aanvragen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : !aanvraag ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-slate-400 font-medium">
                Aanvraag niet gevonden
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Header */}
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Terug naar aanvragen
                </button>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                      Onderhoud aanvraag
                    </p>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight truncate">
                      {aanvraag.naam}
                    </h1>
                    {aanvraag.beschrijving && (
                      <p className="text-sm text-slate-400 mt-1">
                        {aanvraag.beschrijving}
                      </p>
                    )}
                  </div>
                  {aanvraag.afgehandeld ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Afgehandeld</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                      <ClockIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Openstaand</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Desktop */}
              <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="space-y-5">
                  {mainContent}
                  {messageArea}
                </div>
                {actionPanel}
              </div>

              {/* Mobile */}
              <div className="xl:hidden space-y-4">
                {actionPanel}
                {mainContent}
                {messageArea}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
