"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  MapPinIcon,
  SwatchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface AanvraagVloer {
  id: string;
  vloertype_naam: string;
  vierkante_meter: number | null;
  kamer_naam: string;
  verdieping_naam: string;
  bouwdeel_naam: string;
}

interface OnderhoudAanvraag {
  id: string;
  beschrijving: string;
  status: string;
  aangemaakt_op: string;
  geplande_datum: string | null;
  behandeld_op: string | null;
  notitie: string | null;
  locatie_naam: string;
  locatie_id: string;
  locatie_plaats: string | null;
  aangevraagd_door_naam: string | null;
  behandeld_door_naam: string | null;
  vloeren: AanvraagVloer[];
}

interface Bericht {
  id: string;
  bericht: string;
  aangemaakt_op: string;
  verstuurd_door: string;
  verstuurd_door_naam: string;
  is_eigen: boolean;
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
  if (!d) return "";
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const steps = ["ingediend", "in_behandeling", "ingepland", "afgerond"];
  const currentIdx = steps.indexOf(status);
  const isAfgewezen = status === "afgewezen";
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const s = statusConfig[step];
        const done = isAfgewezen ? false : currentIdx > i;
        const active = !isAfgewezen && currentIdx === i;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? "bg-emerald-500 border-emerald-500" : active ? `${s.bg} border-current ${s.text}` : "bg-white border-slate-200"}`}
              >
                {done ? (
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${active ? s.dot : "bg-slate-200"}`}
                  />
                )}
              </div>
              <p
                className={`text-[10px] font-semibold text-center w-16 leading-tight ${done ? "text-emerald-600" : active ? s.text : "text-slate-300"}`}
              >
                {s.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mb-5 mx-1 transition-colors ${done ? "bg-emerald-400" : "bg-slate-100"}`}
              />
            )}
          </div>
        );
      })}
      {isAfgewezen && (
        <div className="flex flex-col items-center gap-1.5 ml-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-red-50 border-red-300">
            <XCircleIcon className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-[10px] font-semibold text-red-500 text-center w-16 leading-tight">
            Afgewezen
          </p>
        </div>
      )}
    </div>
  );
}

function CollapsibleGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/80 cursor-pointer hover:bg-slate-100/60 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400">{count}</span>
          {open ? (
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>
      {open && children}
    </div>
  );
}

function CollapsibleSubGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className="flex items-center justify-between gap-2 px-8 py-2 bg-white cursor-pointer hover:bg-slate-50/60 transition-colors border-t border-slate-50"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <Square3Stack3DIcon className="w-3 h-3 text-slate-300" />
          <span className="text-[11px] font-semibold text-slate-400">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-300">{count}</span>
          {open ? (
            <ChevronDownIcon className="w-3 h-3 text-slate-300" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-slate-300" />
          )}
        </div>
      </div>
      {open && children}
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
  const [sendingBericht, setSendingBericht] = useState(false);
  const [profielId, setProfielId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [confirm, setConfirm] = useState<"afwijzen" | null>(null);
  const [notitie, setNotitie] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function getProfiel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profielen")
        .select("id")
        .eq("gebruiker_id", user.id)
        .single();
      if (data) setProfielId(data.id);
    }
    getProfiel();
  }, []);

  useEffect(() => {
    async function getAanvraag() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("onderhouds_aanvragen")
        .select(
          `
          id, beschrijving, status, aangemaakt_op, geplande_datum, behandeld_op, notitie,
          locaties(id, naam, plaats),
          profielen!aangevraagd_door(naam),
          behandeld_door_profiel:profielen!behandeld_door(naam),
          onderhouds_aanvragen_vloeren(
            kamervloer_id,
            kamer_vloeren(
              vierkante_meter,
              vloer_types(naam),
              kamers(naam, verdiepingen(naam, bouwdeel(naam)))
            )
          )
        `,
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
        beschrijving: data.beschrijving,
        status: data.status,
        aangemaakt_op: data.aangemaakt_op,
        geplande_datum: data.geplande_datum ?? null,
        behandeld_op: data.behandeld_op ?? null,
        notitie: data.notitie ?? null,
        locatie_naam: (data.locaties as any)?.naam ?? "—",
        locatie_id: (data.locaties as any)?.id ?? "",
        locatie_plaats: (data.locaties as any)?.plaats ?? null,
        aangevraagd_door_naam: (data.profielen as any)?.naam ?? null,
        behandeld_door_naam: (data.behandeld_door_profiel as any)?.naam ?? null,
        vloeren: ((data.onderhouds_aanvragen_vloeren as any[]) ?? []).map(
          (v: any) => {
            const kv = v.kamer_vloeren;
            const kamer = kv?.kamers;
            const verdieping = kamer?.verdiepingen;
            const bouwdeel = verdieping?.bouwdeel;
            return {
              id: v.kamervloer_id,
              vloertype_naam: kv?.vloer_types?.naam ?? "Onbekend",
              vierkante_meter: kv?.vierkante_meter ?? null,
              kamer_naam: kamer?.naam ?? "—",
              verdieping_naam: verdieping?.naam ?? "—",
              bouwdeel_naam: bouwdeel?.naam ?? "—",
            };
          },
        ),
      });
      setLoading(false);
    }
    getAanvraag();
  }, [id]);

  async function getBerichten() {
    if (!id) return;
    const { data } = await supabase
      .from("onderhouds_aanvragen_berichten")
      .select("id, bericht, aangemaakt_op, verstuurd_door, profielen(naam)")
      .eq("aanvraag_id", id)
      .order("aangemaakt_op", { ascending: true });

    setBerichten(
      (data ?? []).map((d: any) => ({
        id: d.id,
        bericht: d.bericht,
        aangemaakt_op: d.aangemaakt_op,
        verstuurd_door: d.verstuurd_door,
        verstuurd_door_naam: d.profielen?.naam ?? "—",
        is_eigen: d.verstuurd_door === profielId,
      })),
    );
  }

  // Add these two states alongside your other states
  const [gelinktProject, setGelinktProject] = useState<{
    id: string;
    naam: string;
    start_datum: string | null;
  } | null>(null);

  useEffect(() => {
    async function getGelinktProject() {
      if (!aanvraag?.id || aanvraag.status !== "ingepland") return;
      const { data } = await supabase
        .from("projecten")
        .select("id, naam, start_datum")
        .eq("aanvraag_id", aanvraag.id)
        .single();
      if (data) setGelinktProject(data);
    }
    getGelinktProject();
  }, [aanvraag?.id, aanvraag?.status]);
  useEffect(() => {
    getBerichten();
  }, [id, profielId]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`berichten_admin:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "onderhouds_aanvragen_berichten",
          filter: `onderhouds_aanvraag_id=eq.${id}`,
        },
        async (payload) => {
          const nieuw = payload.new as any;
          const { data: profiel } = await supabase
            .from("profielen")
            .select("naam")
            .eq("id", nieuw.verstuurd_door)
            .single();
          setBerichten((prev) => [
            ...prev,
            {
              id: nieuw.id,
              bericht: nieuw.bericht,
              aangemaakt_op: nieuw.aangemaakt_op,
              verstuurd_door: nieuw.verstuurd_door,
              verstuurd_door_naam: profiel?.naam ?? "—",
              is_eigen: nieuw.verstuurd_door === profielId,
            },
          ]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, profielId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [berichten]);

  async function handleSendBericht() {
    if (!nieuwBericht.trim() || !profielId || !id) return;
    setSendingBericht(true);
    const { error } = await supabase
      .from("onderhouds_aanvragen_berichten")
      .insert({
        bericht: nieuwBericht.trim(),
        verstuurd_door: profielId,
        aanvraag_id: id,
      });
    if (error) showToast("Kon bericht niet versturen", "error");
    else setNieuwBericht("");
    setSendingBericht(false);
    getBerichten();
  }

  async function handleStatusUpdate(
    newStatus: string,
    extraFields?: Record<string, any>,
  ) {
    if (!id || !profielId) return;
    setSaving(true);
    const { error } = await supabase
      .from("onderhouds_aanvragen")
      .update({
        status: newStatus,
        behandeld_door: profielId,
        behandeld_op: new Date().toISOString(),
        ...extraFields,
      })
      .eq("id", id);
    if (error) {
      showToast("Kon status niet bijwerken", "error");
      setSaving(false);
      return;
    }
    setAanvraag((prev) =>
      prev ? { ...prev, status: newStatus, ...extraFields } : prev,
    );
    showToast("Status bijgewerkt", "success");
    setSaving(false);
    setConfirm(null);
    setNotitie("");
  }

  if (loading)
    return (
      <div className="min-h-screen flex bg-[#F5F6FA]">
        <Sidebar
          className="fixed top-0 left-0 h-screen"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-col flex-1 h-screen">
          <Topbar
            title="Onderhoud aanvraag"
            onMenuToggle={() => setSidebarOpen((p) => !p)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );

  if (!aanvraag) return null;

  const grouped: Record<string, Record<string, AanvraagVloer[]>> = {};
  for (const v of aanvraag.vloeren) {
    if (!grouped[v.bouwdeel_naam]) grouped[v.bouwdeel_naam] = {};
    if (!grouped[v.bouwdeel_naam][v.verdieping_naam])
      grouped[v.bouwdeel_naam][v.verdieping_naam] = [];
    grouped[v.bouwdeel_naam][v.verdieping_naam].push(v);
  }

  const totalM2 = aanvraag.vloeren.reduce(
    (s, v) => s + (v.vierkante_meter ?? 0),
    0,
  );
  const s = statusConfig[aanvraag.status];
  const isAfgerond = ["afgerond", "afgewezen"].includes(aanvraag.status);

  const actionPanel = (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Acties
        </p>
      </div>
      <div className="p-5 space-y-3">
        {isAfgerond ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {aanvraag.status === "afgerond" ? (
              <CheckCircleIcon className="w-8 h-8 text-emerald-400 mb-2" />
            ) : (
              <XCircleIcon className="w-8 h-8 text-red-400 mb-2" />
            )}
            <p className="text-sm font-semibold text-slate-500">
              {aanvraag.status === "afgerond"
                ? "Aanvraag afgerond"
                : "Aanvraag afgewezen"}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Er zijn geen acties meer beschikbaar
            </p>
          </div>
        ) : aanvraag.status === "ingepland" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-p/10 flex items-center justify-center mb-3">
                <CalendarDaysIcon className="w-6 h-6 text-p" />
              </div>
              <p className="text-sm font-bold text-slate-700">Ingepland</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Gekoppeld aan een project
              </p>
            </div>
            {gelinktProject ? (
              <div
                onClick={() =>
                  router.push(`/projecten/bekijken/${gelinktProject.id}`)
                }
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-p/10 hover:bg-ph/22  transition-all cursor-pointer"
              >
                <CalendarDaysIcon className="w-4 h-4 text-p shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-p truncate">
                    {gelinktProject.naam}
                  </p>
                  {gelinktProject.start_datum && (
                    <p className="text-xs text-p/70">
                      {formatDate(gelinktProject.start_datum)}
                    </p>
                  )}
                </div>
                <ChevronRightIcon className="w-4 h-4 text-p-400 shrink-0" />
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 rounded-full border-2 border-p-300 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <>
            {aanvraag.status === "ingediend" && (
              <button
                onClick={() => handleStatusUpdate("in_behandeling")}
                disabled={saving}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-all cursor-pointer"
              >
                <ArrowPathIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-700">
                    In behandeling nemen
                  </p>
                  <p className="text-xs text-amber-600/70">Aanvraag oppakken</p>
                </div>
              </button>
            )}

            <button
              onClick={() => {
                router.push(`/projecten/aanmaken?aanvraag_id=${aanvraag.id}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-p text-white hover:bg-p/90 transition-all cursor-pointer"
            >
              <CalendarDaysIcon className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">Inplannen</p>
                <p className="text-xs text-white/70">Koppel aan een project</p>
              </div>
            </button>

            {confirm === "afwijzen" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600 text-center">
                  Aanvraag afwijzen?
                </p>
                <textarea
                  value={notitie}
                  onChange={(e) => setNotitie(e.target.value)}
                  placeholder="Reden voor afwijzing (verplicht)..."
                  rows={3}
                  className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-300 placeholder:text-slate-300 resize-none transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setConfirm(null);
                      setNotitie("");
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("afgewezen", { notitie })}
                    disabled={saving || !notitie.trim()}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? "Bezig..." : "Afwijzen"}
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
                    Aanvraag niet inwilligen
                  </p>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Meta */}
      <div className="border-t border-slate-50 divide-y divide-slate-50">
        {[
          {
            label: "Ingediend op",
            value: formatDateTime(aanvraag.aangemaakt_op),
          },
          {
            label: "Ingediend door",
            value: aanvraag.aangevraagd_door_naam ?? "—",
          },
          {
            label: "Behandeld door",
            value: aanvraag.behandeld_door_naam ?? "—",
          },
          {
            label: "Behandeld op",
            value: formatDateTime(aanvraag.behandeld_op),
          },
          {
            label: "Geplande datum",
            value: formatDate(aanvraag.geplande_datum),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-2.5"
          >
            <p className="text-xs font-semibold text-slate-400">{label}</p>
            <p className="text-xs font-bold text-slate-700 text-right max-w-[55%] truncate">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const mainContent = (
    <>
      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
          Status
        </p>
        <StatusTimeline status={aanvraag.status} />
      </div>

      {/* Notitie */}
      {aanvraag.notitie && (
        <div
          className={`flex items-start gap-3 px-4 py-4 rounded-2xl border ${s?.bg ?? "bg-slate-50"} ${s?.border ?? "border-slate-100"}`}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/60">
            <ChatBubbleBottomCenterTextIcon
              className={`w-4 h-4 ${s?.text ?? "text-slate-500"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm font-bold ${s?.text ?? "text-slate-700"} mb-0.5`}
            >
              Toelichting
            </p>
            <p
              className={`text-sm leading-relaxed ${s?.text ?? "text-slate-600"}`}
            >
              {aanvraag.notitie}
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center mb-2">
            <SwatchIcon className="w-4 h-4 text-p" />
          </div>
          <p className="text-2xl font-bold text-p">{aanvraag.vloeren.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Vloeren</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center mb-2">
            <Square3Stack3DIcon className="w-4 h-4 text-p" />
          </div>
          <p className="text-2xl font-bold text-p">{totalM2}m²</p>
          <p className="text-xs text-slate-400 mt-0.5">Totaal oppervlak</p>
        </div>
        {aanvraag.geplande_datum ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 col-span-2 md:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center mb-2">
              <CalendarDaysIcon className="w-4 h-4 text-p" />
            </div>
            <p className="text-base font-bold text-p">
              {formatDate(aanvraag.geplande_datum)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Geplande datum</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 col-span-2 md:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
              <CalendarDaysIcon className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-300">
              Nog niet gepland
            </p>
            <p className="text-xs text-slate-300 mt-0.5">Geplande datum</p>
          </div>
        )}
      </div>

      {/* Beschrijving */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-p" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Beschrijving</h2>
        </div>
        <div className="px-4 md:px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            {aanvraag.beschrijving}
          </p>
        </div>
      </div>

      {/* Vloeren */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
            <SwatchIcon className="w-4 h-4 text-p" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Aangevraagde vloeren
            </h2>
            <p className="text-xs text-slate-400">
              {aanvraag.vloeren.length} vloeren · {totalM2}m²
            </p>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.entries(grouped).map(([bouwdeel, verdiepingen]) => (
            <CollapsibleGroup
              key={bouwdeel}
              title={bouwdeel}
              count={Object.values(verdiepingen).flat().length}
            >
              {Object.entries(verdiepingen).map(([verdieping, vloeren]) => (
                <CollapsibleSubGroup
                  key={verdieping}
                  title={verdieping}
                  count={vloeren.length}
                >
                  {vloeren.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-4 py-3 border-t border-slate-50 bg-white hover:bg-slate-50/40 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0 ml-6">
                        <SwatchIcon className="w-3.5 h-3.5 text-p" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">
                          {v.vloertype_naam}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <HomeModernIcon className="w-3 h-3 text-slate-300" />
                          <p className="text-xs text-slate-400">
                            {v.kamer_naam}
                          </p>
                          {v.vierkante_meter && (
                            <span className="text-xs text-slate-300">
                              · {v.vierkante_meter}m²
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CollapsibleSubGroup>
              ))}
            </CollapsibleGroup>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-p" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-800">Berichten</h2>
            <p className="text-xs text-slate-400">
              {berichten.length} bericht{berichten.length !== 1 ? "en" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600">Live</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 md:px-5 py-4 max-h-96 overflow-y-auto">
          {berichten.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ChatBubbleBottomCenterTextIcon className="w-7 h-7 text-slate-200 mb-2" />
              <p className="text-sm text-slate-300">Nog geen berichten</p>
            </div>
          ) : (
            berichten.map((b, i) => {
              const prevBericht = berichten[i - 1];
              const showName =
                !prevBericht || prevBericht.verstuurd_door !== b.verstuurd_door;
              return (
                <div
                  key={b.id}
                  className={`flex flex-col ${b.is_eigen ? "items-end" : "items-start"}`}
                >
                  {showName && (
                    <p className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                      {b.is_eigen ? "Jij" : b.verstuurd_door_naam}
                    </p>
                  )}
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${b.is_eigen ? "bg-p text-white rounded-tr-sm" : "bg-slate-100 text-slate-700 rounded-tl-sm"}`}
                  >
                    {b.bericht}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 px-1">
                    {formatTime(b.aangemaakt_op)}
                  </p>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="px-4 md:px-5 py-3 border-t border-slate-50 flex items-end gap-2">
          <textarea
            value={nieuwBericht}
            onChange={(e) => setNieuwBericht(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendBericht();
              }
            }}
            placeholder="Typ een bericht..."
            rows={1}
            className="flex-1 px-3.5 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 resize-none placeholder:text-slate-300 transition-all"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSendBericht}
            disabled={!nieuwBericht.trim() || sendingBericht}
            className="w-10 h-10 flex items-center justify-center bg-p hover:bg-p/90 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
          >
            {sendingBericht ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
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
          title="Onderhoud aanvraag"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug naar overzicht
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                    Onderhoud aanvraag
                  </p>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {aanvraag.locatie_naam}
                  </h1>
                  {aanvraag.locatie_plaats && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {aanvraag.locatie_plaats}
                      </span>
                    </div>
                  )}
                </div>
                <StatusBadge status={aanvraag.status} />
              </div>
            </div>

            {/* Desktop two-column */}
            <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-6 items-start">
              <div className="space-y-4 md:space-y-5">{mainContent}</div>
              {actionPanel}
            </div>

            {/* Mobile stacked */}
            <div className="xl:hidden space-y-4">
              {actionPanel}
              {mainContent}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
