"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Inputfield from "@/components/layout/inputfield";
import { useEffect, useState } from "react";
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
} from "@heroicons/react/24/outline";

interface SelectedState {
  bouwdeelIds: string[];
  alleKamersPerBouwdeel: Record<string, boolean>;
  verdiepingIds: string[];
  alleKamersPerVerdieping: Record<string, boolean>;
  vloerIds: string[];
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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

export default function ProjectenOverzichtPage() {
  const { toast, showToast, hideToast } = useToast();

  const [projectnaam, setProjectnaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [opmerking, setOpmerking] = useState("");

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

  const step1Done = !!(projectnaam && beschrijving);
  const step2Done = !!selectedLocatie;
  const step3Done = selected.bouwdeelIds.length > 0;

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

      const { error: bouwdelenError, data: bouwdelen } = await supabase
        .from("bouwdeel")
        .select("id,locatie_id,naam")
        .eq("locatie_id", selectedLocatie.id);
      if (bouwdelenError || !bouwdelen) {
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

      const { error: verdiepingError, data: verdiepingen } = await supabase
        .from("verdiepingen")
        .select("id,bouwdeel_id,naam")
        .in(
          "bouwdeel_id",
          bouwdelen.map((d) => d.id),
        );
      if (verdiepingError || !verdiepingen) {
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

      const { error: kamerError, data: kamers } = await supabase
        .from("kamers")
        .select("id,verdieping_id,naam")
        .in(
          "verdieping_id",
          verdiepingen.map((v) => v.id),
        );
      if (kamerError || !kamers) {
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

      const { error: vloerenError, data: vloeren } = await supabase
        .from("kamer_vloeren")
        .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
        .in(
          "kamer_id",
          kamers.map((k) => k.id),
        );
      if (vloerenError || !vloeren) {
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
      const { error, data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,plaats,adres,extra_checkin,contact_persoon,telefoonnummer,percelen!inner(naam)",
        )
        .order("naam", { ascending: true });
      if (error || !data) {
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

  const totalSelected =
    selected.bouwdeelIds.length +
    selected.verdiepingIds.length +
    selected.vloerIds.length;

  async function handleSubmit() {
    if (!step1Done || !step2Done || !step3Done) return;

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
      })
      .select("id")
      .single();

    if (projectError || !project) {
      showToast("Project kon niet worden aangemaakt", "error");
      return;
    }

    const { error: vloerError } = await supabase.from("project_vloeren").insert(
      geselecteerdeVloerIds.map((kamer_vloer_id) => ({
        project_id: project.id,
        kamervloer_id: kamer_vloer_id,
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

    showToast("Project aangemaakt", "success");
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

              <div className="flex items-center gap-5 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
                <StepBadge
                  number={1}
                  label="Details"
                  active={!step1Done}
                  done={step1Done}
                />
                <div className="w-6 h-px bg-slate-200" />
                <StepBadge
                  number={2}
                  label="Locatie"
                  active={step1Done && !step2Done}
                  done={step2Done}
                />
                <div className="w-6 h-px bg-slate-200" />
                <StepBadge
                  number={3}
                  label="Selectie"
                  active={step2Done && !step3Done}
                  done={step3Done}
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
                    subtitle="Selecteer de bouwdelen, verdiepingen en kamers"
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
              </div>

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

                    {Object.entries(selected.alleKamersPerBouwdeel).filter(
                      ([, v]) => v,
                    ).length > 0 && (
                      <div className="mt-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <p className="text-xs text-emerald-600 font-medium">
                          {
                            Object.entries(
                              selected.alleKamersPerBouwdeel,
                            ).filter(([, v]) => v).length
                          }{" "}
                          bouwdeel(en) op "alle kamers"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-50" />

                  <button
                    onClick={() => handleSubmit()}
                    disabled={!step1Done || !step2Done || !step3Done}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
                      bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md
                      disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none hover:cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Project aanmaken
                  </button>

                  {(!step1Done || !step2Done || !step3Done) && (
                    <p className="text-center text-[11px] text-slate-300">
                      {!step1Done
                        ? "Vul een naam en beschrijving in"
                        : !step2Done
                          ? "Kies een locatie"
                          : "Selecteer minimaal één bouwdeel"}
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
