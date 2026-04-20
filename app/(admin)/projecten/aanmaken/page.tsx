"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Inputfield from "@/components/layout/inputfield";
import Datepicker from "@/components/layout/datepicker";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Locatie } from "@/types/locatie";
import { supabase } from "@/lib/supabase";
import { bouwdeel } from "@/types/bouwdeel";
import { verdieping } from "@/types/verdieping";
import { kamer } from "@/types/kamer";
import { kamervloer } from "@/types/kamervloer";
import LocatieSelector from "@/components/layout/locatieselector";
import BouwdeelTree from "@/components/layout/bouwdeeltree";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  PlusIcon,
  CheckCircleIcon,
  TruckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  UserGroupIcon,
  PencilSquareIcon,
  SparklesIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface SelectedState {
  bouwdeelIds: string[];
  alleKamersPerBouwdeel: Record<string, boolean>;
  verdiepingIds: string[];
  alleKamersPerVerdieping: Record<string, boolean>;
  vloerIds: string[];
}

interface Bus {
  id: string;
  naam: string;
  type: string;
  kenteken: string;
}

interface Medewerker {
  id: string;
  voornaam: string;
  achternaam: string;
}

interface ProjectBus {
  bus: Bus;
  medewerkerIds: string[];
}

interface VloerReinig {
  id: string;
  kamerNaam: string;
  verdiepingNaam: string;
  bouwdeelNaam: string;
  vloertypeNaam: string;
  m2: number;
  overrideMethodeId: string;
}

interface CategorieReinig {
  categorie: string;
  defaultMethodeId: string;
  totalM2: number;
  vloeren: VloerReinig[];
  expanded: boolean;
  // Track which bouwdelen/verdiepingen are expanded
  expandedBouwdelen: Record<string, boolean>;
  expandedVerdiepingen: Record<string, boolean>;
}

function MedewerkerPopup({
  bus,
  alleMedewerkers,
  selectedIds,
  onClose,
  onSave,
}: {
  bus: Bus;
  alleMedewerkers: Medewerker[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [zoek, setZoek] = useState("");
  const [ids, setIds] = useState<string[]>(selectedIds);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filtered = alleMedewerkers.filter((m) =>
    `${m.voornaam} ${m.achternaam}`.toLowerCase().includes(zoek.toLowerCase()),
  );
  const toggle = (id: string) =>
    setIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Bezetting bewerken
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {bus.naam} · {bus.kenteken}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-slate-50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek medewerker..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
            />
          </div>
        </div>
        <ul className="max-h-64 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-300">
              Geen medewerkers gevonden
            </li>
          ) : (
            filtered.map((m) => {
              const isSelected = ids.includes(m.id);
              return (
                <li
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-p/5" : "hover:bg-slate-50"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isSelected ? "bg-p text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {m.voornaam[0]}
                    {m.achternaam[0]}
                  </div>
                  <p
                    className={`text-sm flex-1 font-medium ${isSelected ? "text-slate-800" : "text-slate-600"}`}
                  >
                    {m.voornaam} {m.achternaam}
                  </p>
                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-p shrink-0" />
                  )}
                </li>
              );
            })
          )}
        </ul>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">{ids.length} geselecteerd</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={() => {
                onSave(ids);
                onClose();
              }}
              className="px-4 py-2 text-sm font-bold text-white bg-p hover:bg-p/90 rounded-lg transition-colors"
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BusCard({
  bus,
  alleMedewerkers,
  medewerkerIds,
  onRemove,
  onMedewerkersSave,
}: {
  bus: Bus;
  alleMedewerkers: Medewerker[];
  medewerkerIds: string[];
  onRemove: () => void;
  onMedewerkersSave: (ids: string[]) => void;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const crew = alleMedewerkers.filter((m) => medewerkerIds.includes(m.id));

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-visible">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
          <div className="w-8 h-8 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
            <TruckIcon className="w-4 h-4 text-p" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800">{bus.naam}</p>
            <p className="text-xs text-slate-400">
              {bus.type} · {bus.kenteken}
            </p>
          </div>
          <button
            onClick={() => setPopupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-p bg-p/8 hover:bg-p/15 rounded-lg transition-colors"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bewerk bezetting</span>
          </button>
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-2.5">
          {crew.length === 0 ? (
            <p className="text-xs text-slate-300 italic">
              Geen medewerkers toegewezen
            </p>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {crew.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600"
                >
                  <span className="w-4 h-4 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                    {m.voornaam[0]}
                  </span>
                  {m.voornaam} {m.achternaam}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {popupOpen && (
        <MedewerkerPopup
          bus={bus}
          alleMedewerkers={alleMedewerkers}
          selectedIds={medewerkerIds}
          onClose={() => setPopupOpen(false)}
          onSave={onMedewerkersSave}
        />
      )}
    </>
  );
}

function StepBadge({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 md:gap-2.5 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-35"}`}
    >
      <div
        className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
        ${done ? "bg-emerald-500 text-white" : active ? "bg-p text-white shadow-[0_0_0_4px_rgba(21,66,115,0.15)]" : "bg-slate-200 text-slate-400"}`}
      >
        {done ? (
          <CheckCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs md:text-sm font-semibold tracking-tight hidden sm:inline ${active ? "text-slate-800" : done ? "text-emerald-600" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  step,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  step: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 border-b border-slate-50">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-p/8 flex items-center justify-center text-p shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-0.5">
            Stap {step}
          </p>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

export default function ProjectenAanmakenPage() {
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [projectnaam, setProjectnaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [opmerking, setOpmerking] = useState("");
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");

  const [alleLocaties, setAlleLocaties] = useState<Locatie[]>([]);
  const [alleBouwdelen, setAlleBouwdelen] = useState<bouwdeel[]>([]);
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<verdieping[]>([]);
  const [alleKamers, setAlleKamers] = useState<kamer[]>([]);
  const [alleKamersvloeren, setAlleKamersvloeren] = useState<kamervloer[]>([]);
  const [locatieZoekterm, setLocatieZoekterm] = useState("");
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie>();
  const [selected, setSelected] = useState<SelectedState>({
    bouwdeelIds: [],
    alleKamersPerBouwdeel: {},
    verdiepingIds: [],
    alleKamersPerVerdieping: {},
    vloerIds: [],
  });

  const [alleBussen, setAlleBussen] = useState<Bus[]>([]);
  const [alleMedewerkers, setAlleMedewerkers] = useState<Medewerker[]>([]);
  const [projectBussen, setProjectBussen] = useState<ProjectBus[]>([]);
  const [busZoek, setBusZoek] = useState("");

  const [alleReinigmethodes, setAlleReinigmethodes] = useState<
    { id: string; naam: string }[]
  >([]);
  const [categorieReinig, setCategorieReinig] = useState<CategorieReinig[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);

  const router = useRouter();

  // ── Resolve all selected vloer IDs including children ──────────────
  const alleGeselecteerdeVloerIds = useMemo(
    () => [
      ...new Set([
        ...selected.vloerIds,
        ...alleKamersvloeren
          .filter((v) =>
            alleKamers.find(
              (k) =>
                k.id === v.kamer_id &&
                alleVerdiepingen.find(
                  (verd) =>
                    verd.id === k.verdieping_id &&
                    selected.alleKamersPerBouwdeel[verd.bouwdeel_id],
                ),
            ),
          )
          .map((v) => v.id),
        ...alleKamersvloeren
          .filter((v) =>
            alleKamers.find(
              (k) =>
                k.id === v.kamer_id &&
                selected.alleKamersPerVerdieping[k.verdieping_id],
            ),
          )
          .map((v) => v.id),
      ]),
    ],
    [selected, alleKamersvloeren, alleKamers, alleVerdiepingen],
  );

  const step1Done = !!(projectnaam && beschrijving);
  const step2Done = !!selectedLocatie;
  const step3Done = alleGeselecteerdeVloerIds.length > 0;
  const step4Done =
    categorieReinig.length > 0 &&
    categorieReinig.every((c) => c.defaultMethodeId);
  const step5Done = projectBussen.length > 0;

  // ── Load bussen + medewerkers ───────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [{ data: bussen }, { data: medewerkers }] = await Promise.all([
        supabase.from("bussen").select("id,naam,type,kenteken").order("naam"),
        supabase
          .from("medewerkers")
          .select("id,voornaam,achternaam")
          .eq("actief", true)
          .order("achternaam"),
      ]);
      setAlleBussen(bussen ?? []);
      setAlleMedewerkers(medewerkers ?? []);
    }
    load();
  }, []);

  async function addBus(bus: Bus) {
    if (projectBussen.find((pb) => pb.bus.id === bus.id)) return;
    const { data: defaultCrew } = await supabase
      .from("bus_medewerkers")
      .select("medewerker_id")
      .eq("bus_id", bus.id);
    setProjectBussen((prev) => [
      ...prev,
      { bus, medewerkerIds: defaultCrew?.map((d) => d.medewerker_id) ?? [] },
    ]);
    setBusZoek("");
  }

  const removeBus = (busId: string) =>
    setProjectBussen((prev) => prev.filter((pb) => pb.bus.id !== busId));
  const updateMedewerkers = (busId: string, ids: string[]) =>
    setProjectBussen((prev) =>
      prev.map((pb) =>
        pb.bus.id === busId ? { ...pb, medewerkerIds: ids } : pb,
      ),
    );

  // ── Load categories ─────────────────────────────────────────────────
  useEffect(() => {
    async function loadCategories() {
      if (alleGeselecteerdeVloerIds.length === 0) {
        setCategorieReinig([]);
        return;
      }
      setLoadingCat(true);

      const [{ data: methodes }, { data: vloerData }] = await Promise.all([
        supabase.from("reinigings_methodes").select("id,naam").order("naam"),
        supabase
          .from("kamer_vloeren")
          .select(
            `id, vierkante_meter, vloer_types(id, naam, catogorie, reinigmethode_id), kamers(naam, verdiepingen(naam, bouwdeel(naam)))`,
          )
          .in("id", alleGeselecteerdeVloerIds),
      ]);

      setAlleReinigmethodes(methodes ?? []);
      if (!vloerData) {
        setLoadingCat(false);
        return;
      }

      const catMap: Record<
        string,
        { vloeren: VloerReinig[]; standaardMethodeId: string; totalM2: number }
      > = {};

      for (const v of vloerData) {
        const vt = v.vloer_types as any;
        const kamer = v.kamers as any;
        const verdieping = kamer?.verdiepingen as any;
        const bouwdeel = verdieping?.bouwdeel as any;

        const cat = vt?.catogorie ?? "Overig";
        const standaard = vt?.reinigmethode_id ?? "";

        if (!catMap[cat])
          catMap[cat] = {
            vloeren: [],
            standaardMethodeId: standaard,
            totalM2: 0,
          };

        const existing = categorieReinig
          .find((c) => c.categorie === cat)
          ?.vloeren.find((vl) => vl.id === v.id);

        catMap[cat].vloeren.push({
          id: v.id,
          kamerNaam: kamer?.naam ?? "—",
          verdiepingNaam: verdieping?.naam ?? "—",
          bouwdeelNaam: bouwdeel?.naam ?? "—",
          vloertypeNaam: vt?.naam ?? "Onbekend",
          m2: v.vierkante_meter ?? 0,
          overrideMethodeId: existing?.overrideMethodeId ?? "",
        });
        catMap[cat].totalM2 += v.vierkante_meter ?? 0;
      }

      setCategorieReinig((prev) =>
        Object.entries(catMap).map(([categorie, val]) => {
          const prevCat = prev.find((c) => c.categorie === categorie);
          return {
            categorie,
            defaultMethodeId:
              prevCat?.defaultMethodeId ?? val.standaardMethodeId,
            totalM2: val.totalM2,
            vloeren: val.vloeren,
            expanded: prevCat?.expanded ?? false,
            expandedBouwdelen: prevCat?.expandedBouwdelen ?? {},
            expandedVerdiepingen: prevCat?.expandedVerdiepingen ?? {},
          };
        }),
      );
      setLoadingCat(false);
    }
    loadCategories();
  }, [alleGeselecteerdeVloerIds]);

  // ── Load locatie data ───────────────────────────────────────────────
  useEffect(() => {
    async function loadLocatieData() {
      if (!selectedLocatie) return;
      setAlleBouwdelen([]);
      setAlleVerdiepingen([]);
      setAlleKamers([]);
      setAlleKamersvloeren([]);
      setSelected({
        bouwdeelIds: [],
        alleKamersPerBouwdeel: {},
        verdiepingIds: [],
        alleKamersPerVerdieping: {},
        vloerIds: [],
      });

      const { data: bouwdelen } = await supabase
        .from("bouwdeel")
        .select("id,locatie_id,naam")
        .eq("locatie_id", selectedLocatie.id);
      if (!bouwdelen) {
        showToast("Bouwdelen konden niet laden", "error");
        return;
      }
      setAlleBouwdelen(
        bouwdelen.map((b) => ({
          id: b.id,
          locatie_id: b.locatie_id,
          naam: b.naam,
        })),
      );

      const { data: verdiepingen } = await supabase
        .from("verdiepingen")
        .select("id,bouwdeel_id,naam")
        .in(
          "bouwdeel_id",
          bouwdelen.map((d) => d.id),
        );
      if (!verdiepingen) {
        showToast("Verdiepingen konden niet laden", "error");
        return;
      }
      setAlleVerdiepingen(
        verdiepingen.map((v) => ({
          id: v.id,
          bouwdeel_id: v.bouwdeel_id,
          naam: v.naam,
        })),
      );

      const { data: kamers } = await supabase
        .from("kamers")
        .select("id,verdieping_id,naam")
        .in(
          "verdieping_id",
          verdiepingen.map((v) => v.id),
        );
      if (!kamers) {
        showToast("Kamers konden niet laden", "error");
        return;
      }
      setAlleKamers(
        kamers.map((k) => ({
          id: k.id,
          verdieping_id: k.verdieping_id,
          naam: k.naam,
        })),
      );

      const { data: vloeren } = await supabase
        .from("kamer_vloeren")
        .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
        .in(
          "kamer_id",
          kamers.map((k) => k.id),
        );
      if (!vloeren) {
        showToast("Vloeren konden niet laden", "error");
        return;
      }
      setAlleKamersvloeren(
        vloeren.map((v) => ({
          id: v.id,
          kamer_id: v.kamer_id,
          vloertype_naam: (v.vloer_types as any)?.[0]?.naam,
          vierkante_meter: v.vierkante_meter,
          status: v.status,
        })),
      );
    }
    loadLocatieData();
  }, [selectedLocatie]);

  useEffect(() => {
    async function getAllLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,plaats,adres,extra_checkin,contact_persoon,telefoonnummer,percelen!inner(naam)",
        )
        .order("naam", { ascending: true });
      if (!data) {
        showToast("Locaties konden niet worden geladen", "error");
        return;
      }
      setAlleLocaties(
        data.map((d: any) => ({
          id: d.id,
          naam: d.naam,
          type: d.type,
          extra_checkin: d.extra_checkin,
          plaats: d.plaats,
          adres: d.adres,
          contact_persoon: d.contact_persoon,
          telefoonnummer: d.telefoonnummer,
          perceel: (d.percelen as any)?.naam,
        })),
      );
    }
    getAllLocaties();
  }, []);

  const filteredLocatie = alleLocaties.filter((l) =>
    l.naam.toLowerCase().includes(locatieZoekterm.toLowerCase()),
  );
  const beschikbareBussen = alleBussen.filter(
    (b) => !projectBussen.find((pb) => pb.bus.id === b.id),
  );
  const filteredBussen = beschikbareBussen.filter((b) =>
    `${b.naam} ${b.type} ${b.kenteken}`
      .toLowerCase()
      .includes(busZoek.toLowerCase()),
  );

  // ── Category helpers ────────────────────────────────────────────────
  const setDefaultMethode = (catIdx: number, methodeId: string) =>
    setCategorieReinig((prev) =>
      prev.map((c, i) =>
        i === catIdx ? { ...c, defaultMethodeId: methodeId } : c,
      ),
    );

  const setVloerOverride = (
    catIdx: number,
    vloerId: string,
    methodeId: string,
  ) =>
    setCategorieReinig((prev) =>
      prev.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              vloeren: c.vloeren.map((v) =>
                v.id === vloerId ? { ...v, overrideMethodeId: methodeId } : v,
              ),
            }
          : c,
      ),
    );

  const toggleCatExpanded = (catIdx: number) =>
    setCategorieReinig((prev) =>
      prev.map((c, i) => (i === catIdx ? { ...c, expanded: !c.expanded } : c)),
    );

  const toggleBouwdeel = (catIdx: number, bouwdeelNaam: string) =>
    setCategorieReinig((prev) =>
      prev.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              expandedBouwdelen: {
                ...c.expandedBouwdelen,
                [bouwdeelNaam]: !c.expandedBouwdelen[bouwdeelNaam],
              },
            }
          : c,
      ),
    );

  const toggleVerdieping = (catIdx: number, key: string) =>
    setCategorieReinig((prev) =>
      prev.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              expandedVerdiepingen: {
                ...c.expandedVerdiepingen,
                [key]: !c.expandedVerdiepingen[key],
              },
            }
          : c,
      ),
    );

  // ── Submit ──────────────────────────────────────────────────────────
  function dagenTotStart(startDatum: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDatum);
    start.setHours(0, 0, 0, 0);
    return Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  async function handleSubmit() {
    if (!step1Done || !step2Done || !step3Done || !step4Done) return;
    if (alleGeselecteerdeVloerIds.length === 0) {
      showToast("Selecteer minimaal één vloer", "error");
      return;
    }

    const { data: project, error: projectError } = await supabase
      .from("projecten")
      .insert({
        naam: projectnaam,
        beschrijving,
        locatie_id: selectedLocatie!.id,
        opmerkingen: opmerking,
        start_datum: startDatum || null,
        eind_datum: eindDatum || null,
      })
      .select("id,start_datum")
      .single();
    if (projectError || !project) {
      showToast("Project kon niet worden aangemaakt", "error");
      return;
    }

    const vloerMethodeMap: Record<string, string> = {};
    for (const cat of categorieReinig)
      for (const v of cat.vloeren)
        vloerMethodeMap[v.id] = v.overrideMethodeId || cat.defaultMethodeId;

    const { error: vloerError } = await supabase.from("project_vloeren").insert(
      alleGeselecteerdeVloerIds.map((id) => ({
        project_id: project.id,
        kamervloer_id: id,
        reinigmethode_id: vloerMethodeMap[id] || null,
      })),
    );
    if (vloerError) {
      await supabase.from("projecten").delete().eq("id", project.id);
      showToast(
        "Vloeren konden niet worden opgeslagen, project verwijderd",
        "error",
      );
      return;
    }

    for (const pb of projectBussen) {
      const { data: projectBus, error: busError } = await supabase
        .from("project_bussen")
        .insert({ project_id: project.id, bus_id: pb.bus.id })
        .select("id")
        .single();
      if (busError || !projectBus) {
        showToast(`Bus ${pb.bus.naam} kon niet worden opgeslagen`, "error");
        continue;
      }
      if (pb.medewerkerIds.length > 0)
        await supabase.from("project_bus_medewerkers").insert(
          pb.medewerkerIds.map((medewerker_id) => ({
            project_bus_id: projectBus.id,
            medewerker_id,
          })),
        );
    }

    await fetch("/api/email-project-aangemaakt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (
      dagenTotStart(project.start_datum) <= 5 &&
      dagenTotStart(project.start_datum) >= 0
    ) {
      await fetch("/api/email-project-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
    }
    showToast("Project aangemaakt", "success");
    setTimeout(() => router.back(), 1000);
  }

  // ── Steps JSX ───────────────────────────────────────────────────────
  const steps = (
    <div className="space-y-4 md:space-y-5">
      <SectionCard
        step={1}
        icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
        title="Projectgegevens"
        subtitle="Geef het project een naam en beschrijving"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Inputfield
            title="Projectnaam"
            value={projectnaam}
            onChange={setProjectnaam}
            placeholder="Bijv. Renovatie hal A"
          />
          <Inputfield
            title="Beschrijving"
            value={beschrijving}
            onChange={setBeschrijving}
            placeholder="Korte omschrijving"
          />
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
          <div className="sm:col-span-2">
            <Inputfield
              title="Opmerking"
              value={opmerking}
              onChange={setOpmerking}
              placeholder="Optionele opmerking"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        icon={<MapPinIcon className="w-5 h-5" />}
        title="Locatie kiezen"
        subtitle="Kies de locatie waar het project plaatsvindt"
      >
        <LocatieSelector
          locaties={filteredLocatie}
          value={selectedLocatie}
          onChange={(l) => setSelectedLocatie(l)}
        />
      </SectionCard>

      {selectedLocatie && (
        <SectionCard
          step={3}
          icon={<BuildingOffice2Icon className="w-5 h-5" />}
          title="Ruimtes selecteren"
          subtitle="Selecteer de bouwdelen, verdiepingen en vloeren"
        >
          <BouwdeelTree
            alleBouwdelen={alleBouwdelen}
            alleVerdiepingen={alleVerdiepingen}
            alleKamers={alleKamers}
            alleKamersvloeren={alleKamersvloeren}
            selected={selected}
            onChange={setSelected}
          />
        </SectionCard>
      )}

      {step3Done && (
        <SectionCard
          step={4}
          icon={<SparklesIcon className="w-5 h-5" />}
          title="Reinigingsmethodes"
          subtitle="Stel per categorie de standaardmethode in. Klap open voor afwijkingen per vloer."
        >
          {loadingCat ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {categorieReinig.map((cat, catIdx) => {
                const overrides = cat.vloeren.filter(
                  (v) => v.overrideMethodeId,
                ).length;

                // Group by bouwdeel → verdieping
                const bouwdeelMap: Record<
                  string,
                  Record<string, VloerReinig[]>
                > = {};
                for (const v of cat.vloeren) {
                  if (!bouwdeelMap[v.bouwdeelNaam])
                    bouwdeelMap[v.bouwdeelNaam] = {};
                  if (!bouwdeelMap[v.bouwdeelNaam][v.verdiepingNaam])
                    bouwdeelMap[v.bouwdeelNaam][v.verdiepingNaam] = [];
                  bouwdeelMap[v.bouwdeelNaam][v.verdiepingNaam].push(v);
                }

                return (
                  <div
                    key={cat.categorie}
                    className="border border-slate-100 rounded-xl overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">
                          {cat.categorie}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cat.vloeren.length} vloer
                          {cat.vloeren.length !== 1 ? "en" : ""} ·{" "}
                          <span className="font-semibold text-slate-500">
                            {cat.totalM2}m²
                          </span>
                          {overrides > 0 && (
                            <span className="ml-2 text-p font-semibold">
                              {overrides} afwijking{overrides !== 1 ? "en" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={cat.defaultMethodeId}
                          onChange={(e) =>
                            setDefaultMethode(catIdx, e.target.value)
                          }
                          className="w-full sm:w-auto text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-p focus:ring-2 focus:ring-p/10 transition-all cursor-pointer"
                        >
                          <option value="">Kies standaard methode...</option>
                          {alleReinigmethodes.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.naam}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => toggleCatExpanded(catIdx)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-p bg-white border border-slate-200 rounded-lg hover:border-p/30 transition-colors whitespace-nowrap"
                        >
                          <ChevronDownIcon
                            className={`w-3.5 h-3.5 transition-transform ${cat.expanded ? "rotate-180" : ""}`}
                          />
                          <span className="hidden sm:inline">Per vloer</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded: bouwdeel → verdieping → kamer_vloer */}
                    {cat.expanded && (
                      <div className="bg-white divide-y divide-slate-50">
                        {Object.entries(bouwdeelMap).map(
                          ([bouwdeelNaam, verdiepingen]) => {
                            const bouwdeelOpen =
                              (cat.expandedBouwdelen ?? {})[bouwdeelNaam] ??
                              false;
                            const bouwdeelCount =
                              Object.values(verdiepingen).flat().length;
                            const bouwdeelOverrides = Object.values(
                              verdiepingen,
                            )
                              .flat()
                              .filter((v) => v.overrideMethodeId).length;

                            return (
                              <div key={bouwdeelNaam}>
                                {/* Bouwdeel row — clickable */}
                                <button
                                  onClick={() =>
                                    toggleBouwdeel(catIdx, bouwdeelNaam)
                                  }
                                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left border-t border-slate-100"
                                >
                                  <BuildingOffice2Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <p className="text-xs font-bold text-slate-700 flex-1">
                                    {bouwdeelNaam}
                                  </p>
                                  <span className="text-[10px] text-slate-400">
                                    {bouwdeelCount} vloer
                                    {bouwdeelCount !== 1 ? "en" : ""}
                                  </span>
                                  {bouwdeelOverrides > 0 && (
                                    <span className="text-[10px] font-semibold text-p">
                                      {bouwdeelOverrides} afwijking
                                      {bouwdeelOverrides !== 1 ? "en" : ""}
                                    </span>
                                  )}
                                  <ChevronDownIcon
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${bouwdeelOpen ? "rotate-180" : ""}`}
                                  />
                                </button>

                                {bouwdeelOpen &&
                                  Object.entries(verdiepingen).map(
                                    ([verdiepingNaam, vloeren]) => {
                                      const vKey = `${bouwdeelNaam}__${verdiepingNaam}`;
                                      const verdOpen =
                                        (cat.expandedVerdiepingen ?? {})[
                                          vKey
                                        ] ?? false;
                                      const verdOverrides = vloeren.filter(
                                        (v) => v.overrideMethodeId,
                                      ).length;

                                      return (
                                        <div key={verdiepingNaam}>
                                          {/* Verdieping row — clickable */}
                                          <button
                                            onClick={() =>
                                              toggleVerdieping(catIdx, vKey)
                                            }
                                            className="w-full flex items-center gap-3 pl-8 pr-4 py-2 hover:bg-slate-50 transition-colors text-left border-t border-slate-50"
                                          >
                                            <div className="w-px h-3 bg-slate-200 shrink-0" />
                                            <p className="text-[11px] font-semibold text-slate-500 flex-1">
                                              {verdiepingNaam}
                                            </p>
                                            <span className="text-[10px] text-slate-400">
                                              {vloeren.length} vloer
                                              {vloeren.length !== 1 ? "en" : ""}
                                            </span>
                                            {verdOverrides > 0 && (
                                              <span className="text-[10px] font-semibold text-p">
                                                {verdOverrides} afwijking
                                                {verdOverrides !== 1
                                                  ? "en"
                                                  : ""}
                                              </span>
                                            )}
                                            <ChevronDownIcon
                                              className={`w-3 h-3 text-slate-300 transition-transform shrink-0 ${verdOpen ? "rotate-180" : ""}`}
                                            />
                                          </button>

                                          {/* Kamer vloeren */}
                                          {verdOpen &&
                                            vloeren.map((vloer) => (
                                              <div
                                                key={vloer.id}
                                                className="flex flex-col sm:flex-row sm:items-center gap-2 pl-12 pr-4 py-2.5 border-t border-slate-50 bg-white hover:bg-slate-50/40 transition-colors"
                                              >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <div className="w-px h-3 bg-slate-200 shrink-0" />
                                                  <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">
                                                      {vloer.kamerNaam}
                                                      <span className="text-slate-400 font-normal ml-1">
                                                        · {vloer.vloertypeNaam}
                                                      </span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                      {vloer.m2}m²
                                                    </p>
                                                  </div>
                                                </div>
                                                <select
                                                  value={
                                                    vloer.overrideMethodeId
                                                  }
                                                  onChange={(e) =>
                                                    setVloerOverride(
                                                      catIdx,
                                                      vloer.id,
                                                      e.target.value,
                                                    )
                                                  }
                                                  className={`w-full sm:w-auto text-xs font-medium bg-slate-50 border rounded-lg px-3 py-1.5 outline-none focus:border-p focus:ring-2 focus:ring-p/10 transition-all cursor-pointer
                                            ${vloer.overrideMethodeId ? "border-p/30 text-p" : "border-slate-100 text-slate-600"}`}
                                                >
                                                  <option value="">
                                                    Standaard (
                                                    {alleReinigmethodes.find(
                                                      (m) =>
                                                        m.id ===
                                                        cat.defaultMethodeId,
                                                    )?.naam ?? "—"}
                                                    )
                                                  </option>
                                                  {alleReinigmethodes.map(
                                                    (m) => (
                                                      <option
                                                        key={m.id}
                                                        value={m.id}
                                                      >
                                                        {m.naam}
                                                      </option>
                                                    ),
                                                  )}
                                                </select>
                                              </div>
                                            ))}
                                        </div>
                                      );
                                    },
                                  )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {categorieReinig.length === 0 && (
                <p className="text-sm text-slate-300 text-center py-4">
                  Selecteer eerst vloeren in stap 3
                </p>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {step4Done && (
        <SectionCard
          step={5}
          icon={<TruckIcon className="w-5 h-5" />}
          title="Wagens toewijzen"
          subtitle="Selecteer één of meerdere wagens en stel de bezetting in"
        >
          {beschikbareBussen.length > 0 && (
            <div className="mb-5">
              <div className="relative mb-2">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  value={busZoek}
                  onChange={(e) => setBusZoek(e.target.value)}
                  placeholder="Zoek wagen op naam, type of kenteken..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                />
              </div>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                {filteredBussen.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-300">
                    Geen wagens gevonden
                  </p>
                ) : (
                  filteredBussen.map((bus) => (
                    <div
                      key={bus.id}
                      onClick={() => addBus(bus)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 bg-white"
                    >
                      <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                        <TruckIcon className="w-3.5 h-3.5 text-p" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          {bus.naam}
                        </p>
                        <p className="text-xs text-slate-400">
                          {bus.type} · {bus.kenteken}
                        </p>
                      </div>
                      <PlusIcon className="w-4 h-4 text-slate-300" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {projectBussen.length > 0 ? (
            <div className="space-y-3">
              {beschikbareBussen.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Toegewezen wagens
                </p>
              )}
              {projectBussen.map((pb) => (
                <BusCard
                  key={pb.bus.id}
                  bus={pb.bus}
                  alleMedewerkers={alleMedewerkers}
                  medewerkerIds={pb.medewerkerIds}
                  onRemove={() => removeBus(pb.bus.id)}
                  onMedewerkersSave={(ids) => updateMedewerkers(pb.bus.id, ids)}
                />
              ))}
            </div>
          ) : beschikbareBussen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserGroupIcon className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-300">Geen wagens beschikbaar</p>
            </div>
          ) : null}
        </SectionCard>
      )}
    </div>
  );

  // ── Summary JSX ─────────────────────────────────────────────────────
  const totalM2 = categorieReinig.reduce((s, c) => s + c.totalM2, 0);

  const summarySidebar = (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Project
        </p>
        <p className="text-sm font-semibold text-slate-800">
          {projectnaam || (
            <span className="text-slate-300 font-normal italic">
              Nog niet ingevuld
            </span>
          )}
        </p>
        {beschrijving && (
          <p className="text-xs text-slate-400 mt-0.5">{beschrijving}</p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Locatie
        </p>
        {selectedLocatie ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-p/10 flex items-center justify-center">
              <MapPinIcon className="w-3.5 h-3.5 text-p" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedLocatie.naam}
              </p>
              {selectedLocatie.plaats && (
                <p className="text-xs text-slate-400">
                  {selectedLocatie.plaats}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 italic font-normal">
            Nog niet gekozen
          </p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-2">
          Selectie
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Vloeren", count: alleGeselecteerdeVloerIds.length },
            { label: "Wagens", count: projectBussen.length },
          ].map(({ label, count }) => (
            <div
              key={label}
              className={`rounded-xl px-3 py-2.5 text-center transition-colors ${count > 0 ? "bg-p/8 border border-p/15" : "bg-slate-50 border border-slate-100"}`}
            >
              <p
                className={`text-lg font-bold leading-tight ${count > 0 ? "text-p" : "text-slate-300"}`}
              >
                {count}
              </p>
              <p
                className={`text-[10px] font-medium ${count > 0 ? "text-p/70" : "text-slate-300"}`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
        {totalM2 > 0 && (
          <div className="mt-2 rounded-xl px-3 py-2.5 text-center bg-p/8 border border-p/15">
            <p className="text-lg font-bold leading-tight text-p">
              {totalM2}m²
            </p>
            <p className="text-[10px] font-medium text-p/70">
              Totaal oppervlak
            </p>
          </div>
        )}
      </div>

      {projectBussen.length > 0 && (
        <>
          <div className="h-px bg-slate-50" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-2">
              Wagens
            </p>
            <div className="space-y-1.5">
              {projectBussen.map((pb) => (
                <div
                  key={pb.bus.id}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {pb.bus.naam}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {pb.medewerkerIds.length} medewerker(s)
                    </p>
                  </div>
                  <TruckIcon className="w-3.5 h-3.5 text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-slate-50" />

      <button
        onClick={handleSubmit}
        disabled={!step1Done || !step2Done || !step3Done || !step4Done}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
          bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
      >
        <PlusIcon className="w-4 h-4" />
        Project aanmaken
      </button>

      {(!step1Done || !step2Done || !step3Done || !step4Done) && (
        <p className="text-center text-[11px] text-slate-300">
          {!step1Done
            ? "Vul een naam en beschrijving in"
            : !step2Done
              ? "Kies een locatie"
              : !step3Done
                ? "Selecteer minimaal één vloer"
                : "Kies een standaard methode per categorie"}
        </p>
      )}
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

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar
          title="Projecten plannen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6 mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Nieuw project
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {projectnaam || "Project plannen"}
                </h1>
                {selectedLocatie && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {selectedLocatie.naam}
                    </span>
                    {selectedLocatie.plaats && (
                      <span className="text-sm text-slate-300">
                        · {selectedLocatie.plaats}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 self-start overflow-x-auto">
                <StepBadge
                  number={1}
                  label="Details"
                  active={!step1Done}
                  done={step1Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={2}
                  label="Locatie"
                  active={step1Done && !step2Done}
                  done={step2Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={3}
                  label="Ruimtes"
                  active={step2Done && !step3Done}
                  done={step3Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={4}
                  label="Methodes"
                  active={step3Done && !step4Done}
                  done={step4Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={5}
                  label="Wagens"
                  active={step4Done && !step5Done}
                  done={step5Done}
                />
              </div>
            </div>

            {/* Desktop two-column */}
            <div className="hidden md:grid md:grid-cols-[1fr_340px] gap-6 items-start">
              {steps}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>
                {summarySidebar}
              </div>
            </div>

            {/* Mobile single column */}
            <div className="md:hidden space-y-4">
              {steps}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>
                {summarySidebar}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
