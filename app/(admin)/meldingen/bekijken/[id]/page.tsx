"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useRef, useState } from "react";
import { melding } from "@/types/melding";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Inputfield from "@/components/layout/inputfield";
import Datepicker from "@/components/layout/datepicker";
import {
  CheckCircleIcon,
  SwatchIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  CalendarDaysIcon,
  PlusIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  Square3Stack3DIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import MainButton from "@/components/layout/mainbutton";
import { bericht } from "@/types/berichten";

interface VloerLocatieInfo {
  locatie_naam: string;
  bouwdeel_naam: string;
  verdieping_naam: string;
  kamer_naam: string;
  vierkante_meter: number | null;
}

interface LocatieInfo {
  locatie_naam: string;
  bouwdeel_naam: string;
  verdieping_naam: string;
  kamer_naam: string;
}

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

function PlanOnderhoudsPopup({
  kamervloer_id,
  kamervloer_naam,
  vierkante_meter,
  onClose,
  onSuccess,
}: {
  kamervloer_id: string;
  kamervloer_naam?: string;
  vierkante_meter: number;
  onClose: () => void;
  onSuccess: (uitleg: string) => void;
}) {
  const { showToast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [naam, setNaam] = useState("");
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleSubmit() {
    if (!naam) return showToast("Vul een projectnaam in", "error");
    if (!startDatum || !eindDatum)
      return showToast("Vul start- en einddatum in", "error");
    setSaving(true);
    try {
      const { data: vloer } = await supabase
        .from("kamer_vloeren")
        .select("kamers(verdiepingen(bouwdeel(locatie_id)))")
        .eq("id", kamervloer_id)
        .single();
      const locatie_id = (vloer?.kamers as any)?.verdiepingen?.bouwdeel
        ?.locatie_id;

      console.log(vloer);

      if (!locatie_id) {
        showToast("Kon locatie niet bepalen", "error");
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from("projecten")
        .insert({
          naam,
          locatie_id,
          start_datum: startDatum,
          eind_datum: eindDatum,
        })
        .select("id")
        .single();
      if (projectError || !project) {
        showToast("Project kon niet worden aangemaakt", "error");
        return;
      }

      const { error: vloerError } = await supabase
        .from("project_vloeren")
        .insert({ project_id: project.id, kamervloer_id });
      if (vloerError) {
        await supabase.from("projecten").delete().eq("id", project.id);
        showToast("Vloer kon niet worden gekoppeld", "error");
        return;
      }
      showToast("Project aangemaakt", "success");
      onSuccess("Onderhoud ingepland");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-visible"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Onderhoud plannen
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {kamervloer_naam ?? "Vloer"} - {vierkante_meter} m2
            </p>
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
            placeholder="Bijv. Onderhoud tapijt A"
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
            <SwatchIcon className="w-4 h-4 text-p shrink-0" />
            <p className="text-xs text-p font-semibold">
              {kamervloer_naam ?? "Vloer"} wordt automatisch gekoppeld
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
            onClick={handleSubmit}
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

export default function MeldingBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [melding, setMelding] = useState<melding>();
  const [locatieInfo, setLocatieInfo] = useState<LocatieInfo>();
  const [loading, setLoading] = useState(true);
  const [handling, setHandling] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [planPopupOpen, setPlanPopupOpen] = useState(false);
  const [confirm, setConfirm] = useState<"afhandelen" | "afwijzen" | null>(
    null,
  );
  const [uitleg, setUitleg] = useState("");
  const [vloerLocatie, setVloerLocatie] = useState<VloerLocatieInfo | null>(
    null,
  );
  const [bericht, setBericht] = useState("");
  const [alleBerichten, setAlleBerichten] = useState<bericht[]>([]);
  const [currentProfielId, setCurrentProfielId] = useState<string | null>(null);
  const [currentRol, setCurrentRol] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      console.log(error);
      showToast("Bericht kon niet worden verzonden", "error");
      return;
    }
    setBericht("");
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [alleBerichten]);

  useEffect(() => {
    async function getCurrentProfiel() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profiel } = await supabase
        .from("profielen")
        .select("id, rol")
        .eq("gebruiker_id", user.id)
        .single();
      if (profiel) {
        setCurrentProfielId(profiel.id);
        setCurrentRol(profiel.rol);
      }
    }
    getCurrentProfiel();
  }, []);

  useEffect(() => {
    async function getMelding() {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("meldingen")
          .select(
            "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam),vierkante_meter),titel,beschrijving,afgehandeld,aangemaakt_op",
          )
          .eq("id", id)
          .single();
        if (!data || error) {
          showToast("Kon melding niet laden", "error");
          return;
        }
        setMelding({
          id: data.id,
          profielnaam: (data.profielen as any)?.naam,
          kamervloer_id: data.kamervloer_id,
          kamervloer_naam: (data.kamer_vloeren as any)?.vloer_types?.naam,
          vierkante_meter: (data.kamer_vloeren as any)?.vierkante_meter,
          titel: data.titel,
          beschrijving: data.beschrijving,
          afgehandeld: data.afgehandeld,
          aangemaakt_op: data.aangemaakt_op,
        });
      } finally {
        setLoading(false);
      }
    }
    getMelding();
  }, [id]);

  // Berichten: initial load + realtime subscription
  useEffect(() => {
    if (!id) return;

    async function loadBerichten() {
      const { data: berichten, error: berichtenError } = await supabase
        .from("melding_berichten")
        .select("id,profiel_id,bericht,aangemaakt_op,profielen(naam)")
        .eq("melding_id", id)
        .order("aangemaakt_op", { ascending: true });

      if (berichtenError) {
        console.log(berichtenError);
        showToast("Kon berichten niet laden", "error");
        return;
      }
      setAlleBerichten(
        (berichten || []).map((d: any) => ({
          id: d.id,
          profiel_id: d.profiel_id,
          profiel_naam: d.profielen.naam,
          bericht: d.bericht,
          aangemaakt_op: d.aangemaakt_op,
        })),
      );
    }

    loadBerichten();

    // Realtime: listen for new messages on this melding
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
          // Fetch the full row including the joined profiel naam
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

  useEffect(() => {
    async function getVloerLocatie() {
      if (!melding?.kamervloer_id) return;
      const { data } = await supabase
        .from("kamer_vloeren")
        .select(
          "vierkante_meter, kamers(naam, verdiepingen(naam, bouwdeel(naam, locaties(naam))))",
        )
        .eq("id", melding.kamervloer_id)
        .single();
      if (data) {
        const kamer = data.kamers as any;
        const verdieping = kamer?.verdiepingen;
        const bouwdeel = verdieping?.bouwdeel;
        const locatie = bouwdeel?.locaties;
        setVloerLocatie({
          locatie_naam: locatie?.naam ?? "—",
          bouwdeel_naam: bouwdeel?.naam ?? "—",
          verdieping_naam: verdieping?.naam ?? "—",
          kamer_naam: kamer?.naam ?? "—",
          vierkante_meter: data.vierkante_meter ?? null,
        });
      }
    }
    getVloerLocatie();
  }, [melding?.kamervloer_id]);

  useEffect(() => {
    async function getLocatieInfo() {
      if (!melding?.kamervloer_id) return;
      const { data } = await supabase
        .from("kamer_vloeren")
        .select(
          `kamers(naam, verdiepingen(naam, bouwdeel(naam, locaties(naam))))`,
        )
        .eq("id", melding.kamervloer_id)
        .single();
      if (data) {
        const kamer = data.kamers as any;
        const verdieping = kamer?.verdiepingen;
        const bouwdeel = verdieping?.bouwdeel;
        const locatie = bouwdeel?.locaties;
        setLocatieInfo({
          locatie_naam: locatie?.naam ?? "—",
          bouwdeel_naam: bouwdeel?.naam ?? "—",
          verdieping_naam: verdieping?.naam ?? "—",
          kamer_naam: kamer?.naam ?? "—",
        });
      }
    }
    getLocatieInfo();
  }, [melding?.kamervloer_id]);

  async function markAfgehandeld(uitlegOverride?: string) {
    if (!id) return;
    const finalUitleg = uitlegOverride ?? uitleg;
    if (!finalUitleg.trim()) {
      showToast("Vul een uitleg in", "error");
      return;
    }
    setHandling(true);
    const { error } = await supabase
      .from("meldingen")
      .update({ afgehandeld: true, uitleg: finalUitleg })
      .eq("id", id);
    if (error) {
      showToast("Kon melding niet afhandelen", "error");
      setHandling(false);
      return;
    }
    setMelding((prev) => (prev ? { ...prev, afgehandeld: true } : prev));
    setUitleg("");
    showToast("Melding afgehandeld", "success");
    setHandling(false);
  }

  async function markRejected() {
    if (!id) return;
    if (!uitleg.trim()) {
      showToast("Vul een uitleg in", "error");
      return;
    }
    setRejecting(true);
    const { error } = await supabase
      .from("meldingen")
      .update({ afgehandeld: true, uitleg })
      .eq("id", id);
    if (error) {
      showToast("Kon melding niet afwijzen", "error");
      setRejecting(false);
      return;
    }
    setMelding((prev) => (prev ? { ...prev, afgehandeld: true } : prev));
    setUitleg("");
    showToast("Melding afgewezen", "success");
    setRejecting(false);
  }

  const actionPanel = melding && (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Acties
        </p>
      </div>
      <div className="p-5 space-y-3">
        {melding.afgehandeld ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircleIcon className="w-8 h-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-slate-500">
              Melding is afgehandeld
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Er zijn geen acties meer beschikbaar
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setPlanPopupOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-p text-white hover:bg-p/90 transition-all cursor-pointer"
            >
              <CalendarDaysIcon className="w-4 h-4 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-bold">Plan onderhoud</p>
                <p className="text-xs text-white/70">
                  Maak een project aan voor deze vloer
                </p>
              </div>
            </button>

            {confirm === "afhandelen" ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 text-center">
                  Melding afhandelen?
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
                    onClick={() => {
                      setConfirm(null);
                      markAfgehandeld();
                    }}
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
                    Markeer als opgelost
                  </p>
                </div>
              </button>
            )}

            {confirm === "afwijzen" ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600 text-center">
                  Melding afwijzen?
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
                    onClick={() => {
                      setConfirm(null);
                      markRejected();
                    }}
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
                    Melding niet relevant
                  </p>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const mainContent = melding && (
    <>
      {/* Beschrijving */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-5 md:py-6 border-b border-slate-50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center">
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-p" />
            </div>
            <p className="text-sm font-bold text-slate-700">Beschrijving</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {melding.beschrijving}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-50">
          {[
            {
              icon: <SwatchIcon className="w-4 h-4 text-slate-400" />,
              label: "Vloertype",
              value: melding.kamervloer_naam ?? "—",
            },
            {
              icon: <UserIcon className="w-4 h-4 text-slate-400" />,
              label: "Ingediend door",
              value: melding.profielnaam ?? "—",
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center gap-2 mb-2">
                {icon}
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
            </div>
          ))}
          <div className="px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Aangemaakt op
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {formatDate(melding.aangemaakt_op)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatTime(melding.aangemaakt_op)}
            </p>
          </div>
        </div>
      </div>

      {/* Locatie */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center">
              <MapPinIcon className="w-4 h-4 text-p" />
            </div>
            <p className="text-sm font-bold text-slate-700">Locatie</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-50">
          {[
            {
              icon: <MapPinIcon className="w-4 h-4 text-slate-400" />,
              label: "Locatie",
              value: locatieInfo?.locatie_naam,
            },
            {
              icon: <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />,
              label: "Gebouw",
              value: locatieInfo?.bouwdeel_naam,
            },
            {
              icon: <Square3Stack3DIcon className="w-4 h-4 text-slate-400" />,
              label: "Verdieping",
              value: locatieInfo?.verdieping_naam,
            },
            {
              icon: <HomeModernIcon className="w-4 h-4 text-slate-400" />,
              label: "Kamer",
              value: locatieInfo?.kamer_naam,
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="px-4 md:px-6 py-4 md:py-5">
              <div className="flex items-center gap-2 mb-2">
                {icon}
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {label}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const messageArea = melding && (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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
            const isOwn =
              b.profiel_id === currentProfielId && currentRol === "admin";
            return (
              <div
                key={b.id}
                className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isOwn ? "bg-p" : "bg-slate-100"
                  }`}
                >
                  <UserIcon
                    className={`w-3.5 h-3.5 ${isOwn ? "text-white" : "text-slate-400"}`}
                  />
                </div>

                {/* Bubble + meta */}
                <div
                  className={`max-w-[72%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col`}
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

      {/* Compose area */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-50">
        <div className="flex gap-3 items-end">
          <div className="w-7 h-7 rounded-full bg-p/10 flex items-center justify-center shrink-0 mb-0.5">
            <UserIcon className="w-3.5 h-3.5 text-p" />
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
      {planPopupOpen && melding && (
        <PlanOnderhoudsPopup
          kamervloer_id={melding.kamervloer_id}
          kamervloer_naam={melding.kamervloer_naam}
          onClose={() => setPlanPopupOpen(false)}
          vierkante_meter={melding.vierkante_meter ?? 0}
          onSuccess={(uitleg) => markAfgehandeld(uitleg)}
        />
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
              {/* Page heading */}
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-3 md:mb-4 cursor-pointer"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Terug naar meldingen
                </button>
                <div className="flex items-start justify-between gap-4">
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

              {/* Desktop: sidebar layout for main + actions */}
              <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="space-y-5">
                  {mainContent} {messageArea}
                </div>
                {actionPanel}
              </div>

              {/* Mobile: stacked */}
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
