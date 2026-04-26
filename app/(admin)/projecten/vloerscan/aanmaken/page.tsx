"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Locatie } from "@/types/locatie";
import LocatieSelector from "@/components/layout/locatieselector";
import Datepicker from "@/components/layout/datepicker";
import Inputfield from "@/components/layout/inputfield";
import {
  MapPinIcon,
  CheckCircleIcon,
  TruckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  UserGroupIcon,
  PencilSquareIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

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

function Toggle({
  enabled,
  onChange,
  label,
  sub,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-p" : "bg-slate-200"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
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
              Medewerker toewijzen
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
            <span className="hidden sm:inline">Bezetting</span>
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

function formatDateNL(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VloerscanAanmaken() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [startDatum, setStartDatum] = useState("");
  const [eindDatum, setEindDatum] = useState("");
  const [extraCheckin, setExtraCheckin] = useState(false);

  const [alleLocaties, setAlleLocaties] = useState<Locatie[]>([]);
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie>();

  const [alleBussen, setAlleBussen] = useState<Bus[]>([]);
  const [alleMedewerkers, setAlleMedewerkers] = useState<Medewerker[]>([]);
  const [selectedBus, setSelectedBus] = useState<{
    bus: Bus;
    medewerkerIds: string[];
  } | null>(null);
  const [busZoek, setBusZoek] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step1Done = !!(naam && beschrijving);
  const step2Done = !!(startDatum && eindDatum);
  const step3Done = !!selectedLocatie;
  const step4Done = !!selectedBus;

  function handleStartDatum(val: string) {
    setStartDatum(val);
    if (!eindDatum) setEindDatum(val);
  }

  useEffect(() => {
    async function load() {
      const [{ data: locaties }, { data: bussen }, { data: medewerkers }] =
        await Promise.all([
          supabase
            .from("locaties")
            .select(
              "id,naam,type,plaats,adres,extra_checkin,contact_persoon,telefoonnummer,percelen!inner(naam)",
            )
            .order("naam"),
          supabase.from("bussen").select("id,naam,type,kenteken").order("naam"),
          supabase
            .from("medewerkers")
            .select("id,voornaam,achternaam")
            .eq("actief", true)
            .order("achternaam"),
        ]);
      setAlleLocaties(
        (locaties ?? []).map((d: any) => ({
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
      setAlleBussen(bussen ?? []);
      setAlleMedewerkers(medewerkers ?? []);
    }
    load();
  }, []);

  async function selectBus(bus: Bus) {
    if (selectedBus?.bus.id === bus.id) return;
    const { data: defaultCrew } = await supabase
      .from("bus_medewerkers")
      .select("medewerker_id")
      .eq("bus_id", bus.id);
    setSelectedBus({
      bus,
      medewerkerIds: defaultCrew?.map((d) => d.medewerker_id) ?? [],
    });
    setBusZoek("");
  }

  async function handleSubmit() {
    if (!step1Done || !step2Done || !step3Done) return;
    setSubmitting(true);
    const { data: scan, error } = await supabase
      .from("vloerscans")
      .insert({
        naam: naam.trim(),
        beschrijving: beschrijving.trim(),
        locatie_id: selectedLocatie!.id,
        medewerker_id: selectedBus?.medewerkerIds[0] ?? null,
        start_datum: startDatum || null,
        eind_datum: eindDatum || null,
        status: "gepland",
      })
      .select("id")
      .single();

    if (error || !scan) {
      showToast("Vloerscan kon niet worden aangemaakt", "error");
      setSubmitting(false);
      return;
    }
    showToast("Vloerscan ingepland", "success");
    setTimeout(() => router.push("/projecten/vloerscan"), 1000);
  }

  const filteredBussen = alleBussen
    .filter((b) => b.id !== selectedBus?.bus.id)
    .filter((b) =>
      `${b.naam} ${b.type} ${b.kenteken}`
        .toLowerCase()
        .includes(busZoek.toLowerCase()),
    );
  const steps = (
    <div className="space-y-4 md:space-y-5">
      {/* Step 1 — Gegevens + Datums combined */}
      <SectionCard
        step={1}
        icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
        title="Scangegevens"
        subtitle="Geef de scan een naam, beschrijving en datum"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Inputfield
            title="Naam"
            value={naam}
            onChange={setNaam}
            placeholder="Bijv. Jaarlijkse vloerscan gebouw A"
          />
          <Inputfield
            title="Beschrijving"
            value={beschrijving}
            onChange={setBeschrijving}
            placeholder="Korte omschrijving van de scan"
          />
          <Datepicker
            title="Startdatum"
            value={startDatum}
            onChange={handleStartDatum}
          />
          <Datepicker
            title="Einddatum"
            value={eindDatum}
            onChange={setEindDatum}
          />
        </div>
      </SectionCard>

      <SectionCard
        step={2}
        icon={<ShieldCheckIcon className="w-5 h-5" />}
        title="Aanmeldprocedure"
        subtitle="Is er een extra aanmeldprocedure vereist bij deze locatie?"
      >
        <div className="space-y-4">
          <Toggle
            enabled={extraCheckin}
            onChange={setExtraCheckin}
            label="Aanmeldprocedure vereist"
            sub="Schakel in als de locatie een speciale aanmeldprocedure heeft"
          />
        </div>
      </SectionCard>

      <SectionCard
        step={3}
        icon={<MapPinIcon className="w-5 h-5" />}
        title="Locatie kiezen"
        subtitle="Kies de locatie die gescand wordt"
      >
        <LocatieSelector
          locaties={alleLocaties}
          value={selectedLocatie}
          onChange={setSelectedLocatie}
        />
      </SectionCard>

      {/* Step 4 — Wagen */}
      <SectionCard
        step={4}
        icon={<TruckIcon className="w-5 h-5" />}
        title="Wagen toewijzen"
        subtitle="Selecteer de wagen en medewerker voor de scan"
      >
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={busZoek}
            onChange={(e) => setBusZoek(e.target.value)}
            placeholder="Zoek wagen op naam, type of kenteken..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
          />
        </div>

        {filteredBussen.length > 0 && (
          <div className="rounded-xl border border-slate-100 overflow-hidden mb-4">
            {filteredBussen.map((bus) => (
              <div
                key={bus.id}
                onClick={() => selectBus(bus)}
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
            ))}
          </div>
        )}

        {selectedBus ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Geselecteerde wagen
            </p>
            <BusCard
              bus={selectedBus.bus}
              alleMedewerkers={alleMedewerkers}
              medewerkerIds={selectedBus.medewerkerIds}
              onRemove={() => setSelectedBus(null)}
              onMedewerkersSave={(ids) =>
                setSelectedBus((prev) =>
                  prev ? { ...prev, medewerkerIds: ids } : null,
                )
              }
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserGroupIcon className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-300">
              Nog geen wagen geselecteerd
            </p>
            <p className="text-xs text-slate-200 mt-0.5">
              Optioneel — kan later worden toegevoegd
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );

  const summarySidebar = (
    <div className="p-5 space-y-4">
      {/* Naam + beschrijving */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Naam
        </p>
        <p className="text-sm font-semibold text-slate-800">
          {naam || (
            <span className="text-slate-300 italic font-normal">
              Nog niet ingevuld
            </span>
          )}
        </p>
        {beschrijving && (
          <p className="text-xs text-slate-400 mt-0.5">{beschrijving}</p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

      {/* Datum */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Datum
        </p>
        {startDatum ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-p/10 flex items-center justify-center">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-p" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Start</p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatDateNL(startDatum)}
                </p>
              </div>
            </div>
            {eindDatum && eindDatum !== startDatum ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Eind</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDateNL(eindDatum)}
                  </p>
                </div>
              </div>
            ) : eindDatum ? (
              <p className="text-xs text-slate-400 ml-8">Één dag scan</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-300 italic font-normal">
            Nog niet gekozen
          </p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

      {/* Locatie */}
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
          Aanmeldprocedure
        </p>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${extraCheckin ? "bg-amber-50 border border-amber-100" : "bg-slate-50 border border-slate-100"}`}
        >
          <ShieldCheckIcon
            className={`w-4 h-4 shrink-0 ${extraCheckin ? "text-amber-500" : "text-slate-300"}`}
          />
          <p
            className={`text-xs font-semibold ${extraCheckin ? "text-amber-700" : "text-slate-400"}`}
          >
            {extraCheckin ? "Vereist" : "Niet vereist"}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-50" />

      {/* Wagen */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Wagen
        </p>
        {selectedBus ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-p/10 flex items-center justify-center">
              <TruckIcon className="w-3.5 h-3.5 text-p" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedBus.bus.naam}
              </p>
              <p className="text-xs text-slate-400">
                {selectedBus.medewerkerIds.length} medewerker(s)
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 italic font-normal">Optioneel</p>
        )}
      </div>

      {selectedBus && selectedBus.medewerkerIds.length > 0 && (
        <>
          <div className="h-px bg-slate-50" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-2">
              Medewerkers
            </p>
            <div className="space-y-1.5">
              {alleMedewerkers
                .filter((m) => selectedBus.medewerkerIds.includes(m.id))
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg"
                  >
                    <div className="w-5 h-5 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                      {m.voornaam[0]}
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      {m.voornaam} {m.achternaam}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-slate-50" />

      <button
        onClick={handleSubmit}
        disabled={!step1Done || !step2Done || !step3Done || submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>
            <ClipboardDocumentCheckIcon className="w-4 h-4" />
            Vloerscan inplannen
          </>
        )}
      </button>

      {(!step1Done || !step2Done || !step3Done) && (
        <p className="text-center text-[11px] text-slate-300">
          {!step1Done
            ? "Vul naam en beschrijving in"
            : !step2Done
              ? "Kies een datum"
              : "Kies een locatie"}
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
          title="Vloerscan inplannen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6 mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Nieuwe scan
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {naam || "Vloerscan inplannen"}
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

              <div className="flex items-center gap-2 md:gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 self-start overflow-x-auto">
                <StepBadge
                  number={1}
                  label="Gegevens"
                  active={!step1Done}
                  done={step1Done}
                />
                <div className="w-3 md:w-4 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={2}
                  label="Datum"
                  active={step1Done && !step2Done}
                  done={step2Done}
                />
                <div className="w-3 md:w-4 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={3}
                  label="Locatie"
                  active={step2Done && !step3Done}
                  done={step3Done}
                />
                <div className="w-3 md:w-4 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={4}
                  label="Procedure"
                  active={step3Done}
                  done={false}
                />
                <div className="w-3 md:w-4 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={5}
                  label="Wagen"
                  active={step3Done && !step4Done}
                  done={step4Done}
                />
              </div>
            </div>

            {/* Desktop */}
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

            {/* Mobile */}
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
