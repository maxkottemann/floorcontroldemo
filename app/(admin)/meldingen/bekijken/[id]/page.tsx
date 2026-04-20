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
  onClose,
  onSuccess,
}: {
  kamervloer_id: string;
  kamervloer_naam?: string;
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
              {kamervloer_naam ?? "Vloer"}
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

  useEffect(() => {
    async function getMelding() {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("meldingen")
          .select(
            "id,profielen(naam),kamervloer_id,kamer_vloeren(vloer_types(naam)),titel,beschrijving,afgehandeld,aangemaakt_op",
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

  // ── Shared action panel content ─────────────────────────────────────
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
              {/* Back + header */}
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

              {/* Desktop — two column (xl+) */}
              <div className="hidden xl:grid xl:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="space-y-5">{mainContent}</div>
                {actionPanel}
              </div>

              {/* Mobile/tablet — single column */}
              <div className="xl:hidden space-y-4">
                {actionPanel}
                {mainContent}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
