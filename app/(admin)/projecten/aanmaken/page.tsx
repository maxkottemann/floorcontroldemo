"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Inputfield from "@/components/layout/inputfield";
import Datepicker from "@/components/layout/datepicker";
import { useEffect, useRef, useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-4 overflow-hidden"
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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                  ${isSelected ? "bg-p text-white" : "bg-slate-100 text-slate-500"}`}
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
            Bewerk bezetting
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
      className={`flex items-center gap-2.5 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-35"}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
        ${done ? "bg-emerald-500 text-white" : active ? "bg-p text-white shadow-[0_0_0_4px_rgba(21,66,115,0.15)]" : "bg-slate-200 text-slate-400"}`}
      >
        {done ? <CheckCircleIcon className="w-4 h-4" /> : number}
      </div>
      <span
        className={`text-sm font-semibold tracking-tight ${active ? "text-slate-800" : done ? "text-emerald-600" : "text-slate-400"}`}
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
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
        <div className="w-9 h-9 rounded-xl bg-p/8 flex items-center justify-center text-p shrink-0">
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
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProjectenAanmakenPage() {
  const { toast, showToast, hideToast } = useToast();

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

  const router = useRouter();
  // Step 4 — reinigmethodes per categorie
  interface CategorieReinig {
    categorie: string;
    vloerIds: string[];
    reinigmethodeId: string;
    totalM2: number;
  }
  const [alleReinigmethodes, setAlleReinigmethodes] = useState<
    { id: string; naam: string }[]
  >([]);
  const [categorieReinig, setCategorieReinig] = useState<CategorieReinig[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);

  const step1Done = !!(projectnaam && beschrijving);
  const step2Done = !!selectedLocatie;
  const step3Done = selected.bouwdeelIds.length > 0;
  const step4Done =
    categorieReinig.length > 0 &&
    categorieReinig.every((c) => c.reinigmethodeId);
  const step5Done = projectBussen.length > 0;

  useEffect(() => {
    async function loadBussenEnMedewerkers() {
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
    loadBussenEnMedewerkers();
  }, []);

  async function addBus(bus: Bus) {
    if (projectBussen.find((pb) => pb.bus.id === bus.id)) return;
    const { data: defaultCrew } = await supabase
      .from("bus_medewerkers")
      .select("medewerker_id")
      .eq("bus_id", bus.id);
    const medewerkerIds = defaultCrew?.map((d) => d.medewerker_id) ?? [];
    setProjectBussen((prev) => [...prev, { bus, medewerkerIds }]);
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

  // Load categories + standard methodes when floors change
  useEffect(() => {
    async function loadCategorieën() {
      if (!step3Done) return;

      const geselecteerd = [
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
      ];

      if (geselecteerd.length === 0) return;

      setLoadingCat(true);

      // Load reinigmethodes
      const { data: methodes } = await supabase
        .from("reinigings_methodes")
        .select("id,naam")
        .order("naam");
      setAlleReinigmethodes(methodes ?? []);

      // Load vloer_types with categorie and standaard reinigmethode for selected floors
      const { data: vloerTypes } = await supabase
        .from("kamer_vloeren")
        .select(
          "id, vierkante_meter, vloer_types(id, naam, catogorie, reinigmethode_id)",
        )
        .in("id", geselecteerd);

      if (!vloerTypes) {
        setLoadingCat(false);
        return;
      }

      // Group by categorie
      const catMap: Record<
        string,
        { vloerIds: string[]; standaardMethodeId: string; totalM2: number }
      > = {};
      for (const v of vloerTypes) {
        const vt = v.vloer_types as any;
        const cat = vt?.catogorie ?? "Overig";
        const standaard = vt?.reinigmethode_id ?? "";
        if (!catMap[cat])
          catMap[cat] = {
            vloerIds: [],
            standaardMethodeId: standaard,
            totalM2: 0,
          };
        catMap[cat].vloerIds.push(v.id);
        catMap[cat].totalM2 += v.vierkante_meter ?? 0;
      }

      setCategorieReinig(
        Object.entries(catMap).map(([categorie, val]) => ({
          categorie,
          vloerIds: val.vloerIds,
          reinigmethodeId: val.standaardMethodeId,
          totalM2: val.totalM2,
        })),
      );
      setLoadingCat(false);
    }
    loadCategorieën();
  }, [selected, alleKamersvloeren]);

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

  async function handleSubmit() {
    if (!step1Done || !step2Done || !step3Done || !step4Done) return;

    const geselecteerdeVloerIds = [
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
    ];

    if (geselecteerdeVloerIds.length === 0) {
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
      .select("id")
      .single();

    if (projectError || !project) {
      showToast("Project kon niet worden aangemaakt", "error");
      return;
    }

    const vloerMethodeMap: Record<string, string> = {};
    for (const cat of categorieReinig) {
      for (const vid of cat.vloerIds) {
        vloerMethodeMap[vid] = cat.reinigmethodeId;
      }
    }

    const { error: vloerError } = await supabase.from("project_vloeren").insert(
      geselecteerdeVloerIds.map((kamer_vloer_id) => ({
        project_id: project.id,
        kamervloer_id: kamer_vloer_id,
        reinigmethode_id: vloerMethodeMap[kamer_vloer_id] || null,
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

      if (pb.medewerkerIds.length > 0) {
        await supabase.from("project_bus_medewerkers").insert(
          pb.medewerkerIds.map((medewerker_id) => ({
            project_bus_id: projectBus.id,
            medewerker_id,
          })),
        );
      }
    }
console.log("projectId being sent:", project.id)

    await fetch("/api/email-project-aangemaakt",{
      method:"POST",
      headers: {"Content-Type":"applications/json"},
      body:JSON.stringify({projectId:project.id})
    })

    showToast("Project aangemaakt", "success");
    setTimeout(() => router.back(), 1000);
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Projecten plannen" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Nieuw project
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
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

              <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
                <StepBadge
                  number={1}
                  label="Details"
                  active={!step1Done}
                  done={step1Done}
                />
                <div className="w-5 h-px bg-slate-200" />
                <StepBadge
                  number={2}
                  label="Locatie"
                  active={step1Done && !step2Done}
                  done={step2Done}
                />
                <div className="w-5 h-px bg-slate-200" />
                <StepBadge
                  number={3}
                  label="Ruimtes"
                  active={step2Done && !step3Done}
                  done={step3Done}
                />
                <div className="w-5 h-px bg-slate-200" />
                <StepBadge
                  number={4}
                  label="Methodes"
                  active={step3Done && !step4Done}
                  done={step4Done}
                />
                <div className="w-5 h-px bg-slate-200" />
                <StepBadge
                  number={5}
                  label="Wagens"
                  active={step4Done && !step5Done}
                  done={step5Done}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
              <div className="space-y-5">
                <SectionCard
                  step={1}
                  icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
                  title="Projectgegevens"
                  subtitle="Geef het project een naam en beschrijving"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="md:col-span-2">
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
                    subtitle="Kies per vloercategorie de reinigingsmethode"
                  >
                    {loadingCat ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categorieReinig.map((cat, i) => (
                          <div
                            key={cat.categorie}
                            className="flex items-center gap-4 px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">
                                {cat.categorie}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {cat.vloerIds.length} vloer
                                {cat.vloerIds.length !== 1 ? "en" : ""} ·{" "}
                                <span className="font-semibold text-slate-500">
                                  {cat.totalM2}m²
                                </span>
                              </p>
                            </div>
                            <select
                              value={cat.reinigmethodeId}
                              onChange={(e) =>
                                setCategorieReinig((prev) =>
                                  prev.map((c, idx) =>
                                    idx === i
                                      ? {
                                          ...c,
                                          reinigmethodeId: e.target.value,
                                        }
                                      : c,
                                  ),
                                )
                              }
                              className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-p focus:ring-2 focus:ring-p/10 transition-all cursor-pointer"
                            >
                              <option value="">Kies methode...</option>
                              {alleReinigmethodes.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.naam}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
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
                    {/* Bus picker */}
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

                    {/* Assigned bussen */}
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
                            onMedewerkersSave={(ids) =>
                              updateMedewerkers(pb.bus.id, ids)
                            }
                          />
                        ))}
                      </div>
                    ) : beschikbareBussen.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UserGroupIcon className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-sm text-slate-300">
                          Geen wagens beschikbaar
                        </p>
                      </div>
                    ) : null}
                  </SectionCard>
                )}
              </div>

              {/* Summary sidebar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>

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
                      <p className="text-xs text-slate-400 mt-0.5">
                        {beschrijving}
                      </p>
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
                        {
                          label: "Bouwdelen",
                          count: selected.bouwdeelIds.length,
                        },
                        {
                          label: "Verdiepingen",
                          count: selected.verdiepingIds.length,
                        },
                        { label: "Vloeren", count: selected.vloerIds.length },
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
                    disabled={
                      !step1Done || !step2Done || !step3Done || !step4Done
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                      bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md
                      disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
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
                            ? "Selecteer minimaal één bouwdeel"
                            : "Kies een reinigingsmethode per categorie"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
