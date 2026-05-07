"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { gewassenvloer } from "@/types/gewassenvloer";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { formatNumber } from "@/lib/utils";
import {
  MapPinIcon,
  BuildingOfficeIcon,
  Square3Stack3DIcon,
  HomeModernIcon,
  SwatchIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { melding } from "@/types/melding";
import MainButton from "@/components/layout/mainbutton";
import { vloerType } from "@/types/vloertype";

interface VloerInfo {
  vloertype_naam: string;
  vierkante_meter: number;
  status: string;
  kamer_naam: string;
  verdieping_naam: string;
  bouwdeel_naam: string;
  vloertype_id?: string;
  locatie_naam: string;
}
interface Opmerking {
  id: string;
  opmerking: string;
  project_naam: string;
  aangemaakt_op: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Goed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700 w-fit",
      border: "border-emerald-100",
    },
    Matig: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    Slecht: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
  };
  const s = config[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border  ${s.bg} ${s.text} ${s.border}`}
    >
      {status}
    </span>
  );
}

export default function VloerPaspoortBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [allVloerTypes, setAllvloerTypes] = useState<vloerType[]>([]);
  const [vloerInfo, setVloerInfo] = useState<VloerInfo>();
  const [wasbeurten, setWasbeurten] = useState<gewassenvloer[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [alleOpmerkingen, setAlleOpmerkingen] = useState<Opmerking[]>([]);
  const [meldingen, setMeldingen] = useState<melding[]>([]);
  const [nextOnderhound, setNextOnderhoud] = useState("");
  const router = useRouter();

  const [updatedVloertypeId, setUpdatedVloertypeId] = useState("");
  const [updatedM2, setUpdatedM2] = useState<number>(0);
  const [updatedStatus, setUpdatedStatus] = useState("Goed");

  const [showAddOpmerking, setShowAddOpmerking] = useState(false);
  const [newOpmerking, setNewOpmerking] = useState("");
  const [savingOpmerking, setSavingOpmerking] = useState(false);

  const [showEditFloorDetails, setShowEditFloorDetails] = useState(false);

  async function getOpmerkingen() {
    if (!id) return;
    const { data } = await supabase
      .from("gewassen_vloeren")
      .select("id,opmerking,aangemaakt_op,projecten(naam)")
      .eq("kamervloer_id", id)
      .not("opmerking", "is", null)
      .neq("opmerking", "");
    setAlleOpmerkingen(
      (data ?? []).map((d: any) => ({
        id: d.id,
        opmerking: d.opmerking,
        project_naam: d.projecten?.naam ?? "—",
        aangemaakt_op: d.aangemaakt_op,
      })),
    );
  }

  useEffect(() => {
    getOpmerkingen();
  }, [id]);

  useEffect(() => {
    async function getNextOnderhoud() {
      if (!id) return;
      const { data, error } = await supabase
        .from("project_vloeren")
        .select("projecten(start_datum)")
        .eq("kamervloer_id", id)
        .neq("projecten.status", "afgerond");

      if (error) {
        console.log(error);
        return;
      }
      if (!data) return;

      const startDatums = data
        .map((d) => (d.projecten as any)?.start_datum)
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      setNextOnderhoud(startDatums[0] ?? null);
    }
    getNextOnderhoud();
  }, [id]);

  async function getVloerInfo() {
    if (!id) return;
    setLoadingInfo(true);
    const { data } = await supabase
      .from("kamer_vloeren")
      .select(
        "vierkante_meter,status,vloer_types(naam,id),kamers(naam,verdiepingen(naam,bouwdeel(naam,locaties(naam))))",
      )
      .eq("id", id)
      .single();
    if (data) {
      const kamer = data.kamers as any;
      const verdieping = kamer?.verdiepingen;
      const bouwdeel = verdieping?.bouwdeel;
      const locatie = bouwdeel?.locaties;
      setVloerInfo({
        vloertype_naam: (data.vloer_types as any)?.naam ?? "Onbekend",
        vloertype_id: (data.vloer_types as any)?.id,
        vierkante_meter: data.vierkante_meter,
        status: data.status,
        kamer_naam: kamer?.naam ?? "—",
        verdieping_naam: verdieping?.naam ?? "—",
        bouwdeel_naam: bouwdeel?.naam ?? "—",
        locatie_naam: locatie?.naam ?? "—",
      });
    }
    setLoadingInfo(false);
  }

  useEffect(() => {
    getVloerInfo();
  }, [id]);
  useEffect(() => {
    async function getVloerHistory() {
      if (!id) return;
      setLoadingHistory(true);
      const { data } = await supabase
        .from("gewassen_vloeren")
        .select(
          "id,project_id,vierkante_meter,opmerking,aangemaakt_op,projecten(naam),kamer_vloeren(status,vloer_types(naam)),reinigings_methodes(id,naam)",
        )
        .eq("kamervloer_id", id)
        .order("aangemaakt_op", { ascending: false });
      if (data) {
        setWasbeurten(
          data.map((d: any) => ({
            id: d.id,
            kamervloernaam: (d.kamer_vloeren?.vloer_types as any)?.naam ?? "—",
            kamervloer_status: d.kamer_vloeren?.status ?? "—",
            project_id: d.project_id,
            project_naam: d.projecten?.naam ?? "—",
            reinigMethode_id: d.reinigings_methodes?.id ?? "",
            reinigMethode_naam: d.reinigings_methodes?.naam ?? "—",
            vierkante_meter: d.vierkante_meter,
            opmerking: d.opmerking ?? "",
            aangemaakt_op: d.aangemaakt_op,
          })),
        );
      }
      setLoadingHistory(false);
    }
    getVloerHistory();
  }, [id]);

  useEffect(() => {
    async function getMeldingen() {
      if (!id) return;
      const { data, error } = await supabase
        .from("meldingen")
        .select(
          "id,profielen(naam),kamervloer_id,titel,beschrijving,afgehandeld,aangemaakt_op",
        )
        .eq("kamervloer_id", id)
        .order("aangemaakt_op", { ascending: false });
      if (!data || error) {
        setMeldingen([]);
        return;
      }

      setMeldingen(
        (data || []).map((d: any) => ({
          id: d.id,
          profielnaam: d.profielen.naam,
          kamervloer_id: d.kamervloer_id,
          titel: d.titel,
          beschrijving: d.beschrijving,
          aangemaakt_op: d.aangemaakt_op,
          afgehandeld: d.afgehandeld,
        })),
      );
    }
    getMeldingen();
  }, [id]);

  useEffect(() => {
    async function getAllVloertypes() {
      const { data, error } = await supabase
        .from("vloer_types")
        .select("id,naam");

      if (!data || error) {
        showToast("Kon vloertypes niet laden", "error");
        return;
      }

      setAllvloerTypes(
        (data || []).map((d) => ({
          id: d.id,
          naam: d.naam,
        })),
      );
    }
    getAllVloertypes();
  }, []);

  async function handleUpdate() {
    const { error } = await supabase
      .from("kamer_vloeren")
      .update({
        vierkante_meter: updatedM2,
        status: updatedStatus,
        vloertype_id: updatedVloertypeId,
      })
      .eq("id", id);

    if (error) {
      showToast("Kon vloergegevens niet wijzigen", "error");
      return;
    }
    showToast("Vloer bijgewerkt", "success");
    await getVloerInfo();
  }

  async function handleAddOpmerking() {
    if (!newOpmerking.trim()) return;
    setSavingOpmerking(true);
    try {
      const { data } = await supabase
        .from("kamer_vloeren")
        .select("opmerkingen")
        .eq("id", id)
        .single();

      const current = (data?.opmerkingen as string[]) ?? [];

      await supabase
        .from("kamer_vloeren")
        .update({ opmerkingen: [...current, newOpmerking.trim()] })
        .eq("id", id);

      showToast("Opmerking toegevoegd", "success");
      setNewOpmerking("");
      setSavingOpmerking(false);
      setShowAddOpmerking(false);
      await getVloerOpmerkingen();
    } catch {
      showToast("Kon melding niet opslaan", "error");
    }
  }

  const [vloerOpmerkingen, setVloerOpmerkingen] = useState<string[]>([]);

  async function getVloerOpmerkingen() {
    if (!id) return;
    const { data } = await supabase
      .from("kamer_vloeren")
      .select("opmerkingen")
      .eq("id", id)
      .single();
    setVloerOpmerkingen((data?.opmerkingen as string[]) ?? []);
  }

  useEffect(() => {
    getVloerOpmerkingen();
  }, [id]);
  const lastWasbeurt = wasbeurten[0];
  const opmerkingen = alleOpmerkingen;

  const sidebarContent = (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 md:py-5 border-b border-slate-50">
          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
            <MapPinIcon className="w-5 h-5 text-p" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Locatie</h2>
            <p className="text-sm text-slate-400">
              Waar bevindt deze vloer zich
            </p>
          </div>
        </div>
        {loadingInfo ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        ) : vloerInfo ? (
          <div className="p-4 md:p-5 space-y-3">
            {[
              {
                icon: <MapPinIcon className="w-4 h-4" />,
                label: "Locatie",
                value: vloerInfo.locatie_naam,
              },
              {
                icon: <BuildingOfficeIcon className="w-4 h-4" />,
                label: "Gebouw",
                value: vloerInfo.bouwdeel_naam,
              },
              {
                icon: <Square3Stack3DIcon className="w-4 h-4" />,
                label: "Verdieping",
                value: vloerInfo.verdieping_naam,
              },
              {
                icon: <HomeModernIcon className="w-4 h-4" />,
                label: "Kamer",
                value: vloerInfo.kamer_naam,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 md:py-5 border-b border-slate-50">
          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
            <SwatchIcon className="w-5 h-5 text-p" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Vloerdetails</h2>
        </div>
        <div className="p-4 md:p-5 space-y-4">
          {[
            { label: "Vloertype", value: vloerInfo?.vloertype_naam },
            {
              label: "Oppervlak",
              value: vloerInfo?.vierkante_meter
                ? `${formatNumber(vloerInfo.vierkante_meter)}m²`
                : "—",
            },
            { label: "Status", value: vloerInfo?.status },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-center gap-4"
            >
              <p className="text-sm font-semibold text-slate-400">{label}</p>
              {label === "Status" && value ? (
                <StatusBadge status={value} />
              ) : (
                <p className="text-sm font-bold text-slate-800">
                  {value ?? "—"}
                </p>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-slate-50">
            <button
              onClick={() => {
                setUpdatedVloertypeId(vloerInfo?.vloertype_id ?? "");
                setUpdatedM2(vloerInfo?.vierkante_meter ?? 0);
                setUpdatedStatus(vloerInfo?.status ?? "Goed");
                setShowEditFloorDetails(true);
              }}
              className="w-full flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-semibold text-p bg-p/5 hover:bg-p/10 rounded-xl transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Bewerken
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-4 md:py-5 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Opmerkingen
              </h2>
              <p className="text-sm text-slate-400">Notities bij deze vloer</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddOpmerking(true)}
            className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <PlusIcon className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {vloerOpmerkingen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-slate-200 mb-2" />
            <p className="text-xs text-slate-300">Geen opmerkingen</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {vloerOpmerkingen.map((o, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-4 md:px-5 py-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <p className="text-sm text-slate-600 leading-snug">{o}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-5 py-4 md:py-5 border-b border-slate-50">
          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
            <CalendarDaysIcon className="w-5 h-5 text-p" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Volgend onderhoud
          </h2>
        </div>
        <div className="p-4 md:p-5">
          {nextOnderhound ? (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="w-4 h-4 text-p" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {formatDate(nextOnderhound)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gepland onderhoud
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">
                  Geen onderhoud gepland
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  Nog niet ingepland
                </p>
              </div>
            </div>
          )}
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

      {showAddOpmerking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Opmerking toevoegen
                </p>
                <h2 className="text-lg font-bold text-slate-800 mt-0.5">
                  {vloerInfo?.vloertype_naam}
                </h2>
              </div>
              <button
                onClick={() => setShowAddOpmerking(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Opmerking
              </label>
              <textarea
                value={newOpmerking}
                onChange={(e) => setNewOpmerking(e.target.value)}
                rows={4}
                placeholder="Typ hier je opmerking..."
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all resize-none placeholder:text-slate-300"
              />
              <p className="text-[11px] text-slate-300 text-right">
                {newOpmerking.length} tekens
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => {
                  setNewOpmerking("");
                  setShowAddOpmerking(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddOpmerking}
                disabled={!newOpmerking.trim() || savingOpmerking}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-p hover:bg-p/90 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingOpmerking ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditFloorDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Vloer bewerken
                </p>
                <h2 className="text-lg font-bold text-slate-800 mt-0.5">
                  {vloerInfo?.vloertype_naam}
                </h2>
              </div>
              <button
                onClick={() => setShowEditFloorDetails(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Vloertype
                </label>
                <select
                  value={updatedVloertypeId}
                  onChange={(e) => setUpdatedVloertypeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all"
                >
                  {allVloerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.naam}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Oppervlak (m²)
                </label>
                <input
                  type="number"
                  value={updatedM2}
                  onChange={(e) => setUpdatedM2(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Status
                </label>
                <select
                  value={updatedStatus}
                  onChange={(e) => setUpdatedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all"
                >
                  <option value="Goed">Goed</option>
                  <option value="Matig">Matig</option>
                  <option value="Slecht">Slecht</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setShowEditFloorDetails(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-500 cursor-pointer bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  handleUpdate();
                  setShowEditFloorDetails(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-p cursor-pointer hover:bg-p/90 rounded-xl transition-colors"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Vloerpaspoort"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-row justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Vloerpaspoort
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {loadingInfo
                    ? "Laden..."
                    : (vloerInfo?.vloertype_naam ?? "Onbekend vloertype")}
                </h1>
                {vloerInfo && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <StatusBadge status={vloerInfo.status} />
                    <span className="text-sm text-slate-400 font-medium">
                      {formatNumber(vloerInfo.vierkante_meter)}m²
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden xl:grid xl:grid-cols-[1fr_320px] gap-6 items-start">
              <div className="space-y-4">
                {!loadingHistory && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Onderhoudsbeurten
                      </p>
                      <p className="text-3xl font-bold text-p">
                        {wasbeurten.length}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        totaal geregistreerd
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Laatste onderhoud
                      </p>
                      <p className="text-2xl font-bold text-p mt-1 mb-1">
                        {lastWasbeurt
                          ? formatDate(lastWasbeurt.aangemaakt_op)
                          : "—"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lastWasbeurt?.reinigMethode_naam ?? "Geen data"}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Totaal onderhouden
                      </p>
                      <p className="text-3xl font-bold text-p">
                        {formatNumber(
                          wasbeurten.reduce(
                            (sum, w) => sum + (w.vierkante_meter ?? 0),
                            0,
                          ),
                        )}
                        m²
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        gecumuleerd oppervlak
                      </p>
                    </div>
                  </div>
                )}
                {historyCard()}
                {opmerkingenCard()}
              </div>
              {sidebarContent}
            </div>

            <div className="xl:hidden space-y-4">
              {!loadingHistory && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Onderhoudsbeurten
                    </p>
                    <p className="text-3xl font-bold text-p">
                      {wasbeurten.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      totaal geregistreerd
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Laatste onderhoud
                    </p>
                    <p className="text-lg font-bold text-p mt-1 mb-1">
                      {lastWasbeurt
                        ? formatDate(lastWasbeurt.aangemaakt_op)
                        : "—"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {lastWasbeurt?.reinigMethode_naam ?? "Geen data"}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Totaal onderhouden
                    </p>
                    <p className="text-3xl font-bold text-p">
                      {formatNumber(
                        wasbeurten.reduce(
                          (sum, w) => sum + (w.vierkante_meter ?? 0),
                          0,
                        ),
                      )}
                      m²
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      gecumuleerd oppervlak
                    </p>
                  </div>
                </div>
              )}
              {sidebarContent}
              {historyCard()}
              {opmerkingenCard()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  function historyCard() {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 md:px-6 py-4 md:py-5 border-b border-slate-50">
          <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-p" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Onderhoudsgeschiedenis
            </h2>
            <p className="text-sm text-slate-400">
              {wasbeurten.length} sessie{wasbeurten.length !== 1 ? "s" : ""}{" "}
              geregistreerd
            </p>
          </div>
        </div>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        ) : wasbeurten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <SparklesIcon className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-base font-semibold text-slate-400">
              Nog geen onderhoud uitgevoerd
            </p>
            <p className="text-sm text-slate-300 mt-1">
              Er zijn nog geen schoonmaaksessies geregistreerd voor deze vloer
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[2.375rem] top-0 bottom-0 w-px bg-slate-100" />
            <div className="divide-y divide-slate-50">
              {wasbeurten.map((w, i) => (
                <div
                  key={w.id}
                  className="flex gap-4 px-4 md:px-6 py-4 md:py-5"
                >
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 relative ${i === 0 ? "border-p bg-p" : "border-slate-200 bg-white"}`}
                    >
                      {i === 0 && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {w.project_naam}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDateTime(w.aangemaakt_op)}
                        </p>
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] font-bold text-p bg-p/10 px-2 py-0.5 rounded-full shrink-0">
                          Meest recent
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {w.reinigMethode_naam && w.reinigMethode_naam !== "—" && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <SparklesIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-600">
                            {w.reinigMethode_naam}
                          </span>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <SwatchIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">
                          {formatNumber(w.vierkante_meter)}m² onderhouden
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function opmerkingenCard() {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-start gap-3 px-4 md:px-6 py-4 md:py-5 border-b border-slate-50">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800">
              Project Opmerkingen
            </h2>
            <p className="text-sm text-slate-400">
              {opmerkingen.length} opmerking
              {opmerkingen.length !== 1 ? "en" : ""} geregistreerd
            </p>
          </div>
          {opmerkingen.length > 0 && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full shrink-0">
              {opmerkingen.length}
            </span>
          )}
        </div>
        {opmerkingen.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircleIcon className="w-7 h-7 text-slate-200 mb-2" />
            <p className="text-sm text-slate-300">
              Geen opmerkingen geregistreerd
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
            {opmerkingen.map((o) => (
              <div
                key={o.id}
                className="flex items-start gap-3 px-4 md:px-6 py-3.5"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-amber-500 text-xs font-bold">!</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-semibold text-p truncate">
                      {o.project_naam}
                    </p>
                    <p className="text-[10px] text-slate-500 shrink-0">
                      {formatDate(o.aangemaakt_op)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 leading-snug">
                    {o.opmerking}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
