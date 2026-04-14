"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { project } from "@/types/project";
import { Locatie } from "@/types/locatie";
import { kamervloer } from "@/types/kamervloer";
import { kamer } from "@/types/kamer";
import {
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  HomeModernIcon,
  SwatchIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  Square3Stack3DIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
      <span className="text-slate-400 shrink-0">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-800">{value}</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-p leading-tight">{value}</p>
      {sub && (
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sub}</p>
      )}
    </div>
  );
}

interface KamerMetVloeren extends kamer {
  verdieping_naam?: string;
  vloeren: kamervloer[];
}

function KamerRij({ kamer }: { kamer: KamerMetVloeren }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-50 last:border-0">
      {/* Header — clickable */}
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <HomeModernIcon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-slate-800">{kamer.naam}</p>
          {kamer.verdieping_naam && (
            <p className="text-sm text-slate-400">{kamer.verdieping_naam}</p>
          )}
        </div>
        <span className="text-xs font-bold text-p bg-p/10 px-2.5 py-1 rounded-full shrink-0">
          {kamer.vloeren.length} vloer{kamer.vloeren.length !== 1 ? "en" : ""}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Vloeren — collapsible */}
      {open && (
        <div className="px-6 pb-4 ml-11 space-y-2">
          {kamer.vloeren.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="w-6 h-6 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                <SwatchIcon className="w-3.5 h-3.5 text-p" />
              </div>
              <p className="text-sm font-semibold text-slate-700 flex-1">
                {v.vloertype_naam}
              </p>
              {v.vierkante_meter && (
                <span className="text-sm font-bold text-slate-600">
                  {v.vierkante_meter}m²
                </span>
              )}
              {v.status && (
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    v.status === "afgerond"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : v.status === "bezig"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {v.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectBekijkenPage() {
  const { id } = useParams();
  const { toast, showToast, hideToast } = useToast();

  const [project, setProject] = useState<project>();
  const [locatie, setLocatie] = useState<Locatie>();
  const [kamervloeren, setKamerVloer] = useState<kamervloer[]>([]);
  const [kamers, setKamers] = useState<kamer[]>([]);

  interface ProjectBusData {
    id: string;
    bus_naam: string;
    bus_type: string;
    bus_kenteken: string;
    medewerkers: { id: string; voornaam: string; achternaam: string }[];
  }
  const [projectBussen, setProjectBussen] = useState<ProjectBusData[]>([]);

  useEffect(() => {
    async function getProjectData() {
      if (!id) return;
      const { error: projectError, data: projectData } = await supabase
        .from("projecten")
        .select(
          "locatie_id, locaties(naam,id),naam,beschrijving,opmerkingen,id,start_datum,eind_datum",
        )
        .eq("id", id)
        .single();

      if (projectError || !projectData) {
        showToast("Data kon niet geladen worden", "error");
        return;
      }

      setProject({
        id: projectData.id,
        locatie_naam: (projectData?.locaties as any)?.naam,
        naam: projectData.naam,
        beschrijving: projectData.beschrijving,
        opmerkingen: projectData.opmerkingen,
        start_datum: projectData.start_datum,
        eind_datum: projectData.eind_datum,
      });

      const { data: locatieData } = await supabase
        .from("locaties")
        .select(
          "naam,type,plaats,adres,extra_checkin,contact_persoon,telefoonnummer,percelen(naam)",
        )
        .eq("id", projectData.locatie_id)
        .single();

      if (locatieData) {
        setLocatie({
          id: projectData.locatie_id,
          naam: locatieData.naam,
          type: locatieData.type,
          extra_checkin: locatieData.extra_checkin,
          plaats: locatieData.plaats,
          adres: locatieData.adres,
          contact_persoon: locatieData.contact_persoon,
          telefoonnummer: locatieData.telefoonnummer,
          perceel: (locatieData.percelen as any)?.naam,
        });
      }
    }
    getProjectData();
  }, [id]);

  useEffect(() => {
    async function getKamers() {
      if (!id) return;

      const { data } = await supabase
        .from("project_vloeren")
        .select(
          "kamer_vloeren(id, kamer_id, vloer_types(naam), vierkante_meter, status)",
        )
        .eq("project_id", id);

      if (!data) return;

      setKamerVloer(
        data.map((d: any) => ({
          id: d.kamer_vloeren.id,
          kamer_id: d.kamer_vloeren.kamer_id,
          vloertype_naam: d.kamer_vloeren.vloer_types?.naam,
          vierkante_meter: d.kamer_vloeren.vierkante_meter,
          status: d.kamer_vloeren.status,
        })),
      );

      const { data: data2 } = await supabase
        .from("kamers")
        .select("id,naam,verdiepingen(naam)")
        .in(
          "id",
          data.map((d: any) => d.kamer_vloeren.kamer_id),
        );

      if (data2) {
        setKamers(
          data2.map((k: any) => ({
            id: k.id,
            naam: k.naam,
            verdieping_id: k.verdiepingen?.naam,
          })),
        );
      }
    }
    getKamers();
  }, [id]);

  useEffect(() => {
    async function getBussen() {
      if (!id) return;
      const { data } = await supabase
        .from("project_bussen")
        .select(
          "id, bussen(naam, type, kenteken), project_bus_medewerkers(medewerkers(id, voornaam, achternaam))",
        )
        .eq("project_id", id);
      if (!data) return;
      setProjectBussen(
        data.map((pb: any) => ({
          id: pb.id,
          bus_naam: pb.bussen?.naam,
          bus_type: pb.bussen?.type,
          bus_kenteken: pb.bussen?.kenteken,
          medewerkers:
            pb.project_bus_medewerkers
              ?.map((m: any) => m.medewerkers)
              .filter(Boolean) ?? [],
        })),
      );
      console.log(data);
    }
    getBussen();
  }, [id]);

  const kamersMetVloeren: KamerMetVloeren[] = kamers.map((kamer) => ({
    ...kamer,
    verdieping_naam: (kamer as any).verdieping_naam,
    vloeren: kamervloeren.filter((v) => v.kamer_id === kamer.id),
  }));

  const totalM2 = kamervloeren.reduce(
    (sum, v) => sum + (v.vierkante_meter ?? 0),
    0,
  );
  const uniqueVloerTypes = [
    ...new Set(kamervloeren.map((v) => v.vloertype_naam).filter(Boolean)),
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Project bekijken" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Project
              </p>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {project?.naam ?? "—"}
              </h1>
              {project?.beschrijving && (
                <p className="text-base text-slate-500 mt-1.5">
                  {project.beschrijving}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-4">
                <InfoChip
                  icon={<MapPinIcon className="w-4 h-4" />}
                  label="Locatie"
                  value={project?.locatie_naam}
                />
                <InfoChip
                  icon={<CalendarDaysIcon className="w-4 h-4" />}
                  label="Start"
                  value={formatDate(project?.start_datum)}
                />
                <InfoChip
                  icon={<CalendarDaysIcon className="w-4 h-4" />}
                  label="Einde"
                  value={formatDate(project?.eind_datum)}
                />
                {locatie?.adres && (
                  <InfoChip
                    icon={<MapPinIcon className="w-4 h-4" />}
                    label="Adres"
                    value={`${locatie.adres}${locatie.plaats ? `, ${locatie.plaats}` : ""}`}
                  />
                )}
                {locatie?.contact_persoon && (
                  <InfoChip
                    icon={<UserIcon className="w-4 h-4" />}
                    label="Contact"
                    value={locatie.contact_persoon}
                  />
                )}
                {locatie?.telefoonnummer && (
                  <InfoChip
                    icon={<PhoneIcon className="w-4 h-4" />}
                    label="Telefoon"
                    value={locatie.telefoonnummer}
                  />
                )}
                {project?.opmerkingen && (
                  <InfoChip
                    icon={
                      <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                    }
                    label="Opmerking"
                    value={project.opmerkingen}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Kamers"
                value={kamers.length}
                sub="geselecteerd in dit project"
              />
              <StatCard
                label="Vloeronderdelen"
                value={kamervloeren.length}
                sub="te behandelen"
              />
              <StatCard
                label="Totaal m²"
                value={`${totalM2}m²`}
                sub="totaal vloeroppervlak"
              />
              <StatCard
                label="Vloertypes"
                value={uniqueVloerTypes.length}
                sub={uniqueVloerTypes.join(", ") || "—"}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                      <HomeModernIcon className="w-5 h-5 text-p" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        Ruimtes & vloeren
                      </h2>
                      <p className="text-sm text-slate-400">
                        {kamers.length} kamers — klik om te openen
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-p bg-p/10 px-3 py-1.5 rounded-full">
                    {kamervloeren.length} vloer
                    {kamervloeren.length !== 1 ? "en" : ""}
                  </span>
                </div>

                <div>
                  {kamersMetVloeren.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <HomeModernIcon className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-base text-slate-400 font-medium">
                        Geen kamers gevonden
                      </p>
                      <p className="text-sm text-slate-300 mt-1">
                        Er zijn geen vloeren gekoppeld aan dit project
                      </p>
                    </div>
                  ) : (
                    kamersMetVloeren.map((kamer) => (
                      <KamerRij key={kamer.id} kamer={kamer} />
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-5">
                {locatie && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
                      <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-5 h-5 text-p" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">
                          Locatie
                        </h2>
                        <p className="text-sm text-slate-400">{locatie.naam}</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {(locatie.type || locatie.extra_checkin) && (
                        <div className="flex items-center gap-2">
                          {locatie.type && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {locatie.type}
                            </span>
                          )}
                          {locatie.extra_checkin && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckBadgeIcon className="w-3.5 h-3.5" />
                              Extra check-in
                            </span>
                          )}
                        </div>
                      )}
                      <div className="space-y-3">
                        {locatie.perceel && (
                          <div className="flex items-center gap-3">
                            <Square3Stack3DIcon className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-sm font-medium text-slate-600">
                              {locatie.perceel}
                            </span>
                          </div>
                        )}
                        {locatie.adres && (
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-sm font-medium text-slate-600">
                              {locatie.adres}
                              {locatie.plaats ? `, ${locatie.plaats}` : ""}
                            </span>
                          </div>
                        )}
                        {locatie.contact_persoon && (
                          <div className="flex items-center gap-3">
                            <UserIcon className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-sm font-medium text-slate-600">
                              {locatie.contact_persoon}
                            </span>
                          </div>
                        )}
                        {locatie.telefoonnummer && (
                          <div className="flex items-center gap-3">
                            <PhoneIcon className="w-4 h-4 text-slate-300 shrink-0" />
                            <span className="text-sm font-medium text-slate-600">
                              {locatie.telefoonnummer}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {uniqueVloerTypes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
                      <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                        <SwatchIcon className="w-5 h-5 text-p" />
                      </div>
                      <h2 className="text-base font-bold text-slate-800">
                        Vloertypes
                      </h2>
                    </div>
                    <div className="p-5 space-y-4">
                      {uniqueVloerTypes.map((type) => {
                        const vloeren = kamervloeren.filter(
                          (v) => v.vloertype_naam === type,
                        );
                        const m2 = vloeren.reduce(
                          (sum, v) => sum + (v.vierkante_meter ?? 0),
                          0,
                        );
                        const pct =
                          totalM2 > 0 ? Math.round((m2 / totalM2) * 100) : 0;
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-bold text-slate-700">
                                {type}
                              </p>
                              <p className="text-sm font-semibold text-slate-500">
                                {m2}m² · {pct}%
                              </p>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-p rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {projectBussen.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
                      <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                        <TruckIcon className="w-5 h-5 text-p" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">
                          Wagens & bezetting
                        </h2>
                        <p className="text-sm text-slate-400">
                          {projectBussen.length} wagen
                          {projectBussen.length !== 1 ? "s" : ""} ingepland
                        </p>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {projectBussen.map((pb) => (
                        <div key={pb.id} className="px-5 py-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                              <TruckIcon className="w-4 h-4 text-p" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">
                                {pb.bus_naam}
                              </p>
                              <p className="text-xs text-slate-400">
                                {pb.bus_type} · {pb.bus_kenteken}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-p bg-p/10 px-2 py-1 rounded-full shrink-0">
                              {pb.medewerkers.length} pers.
                            </span>
                          </div>
                          {pb.medewerkers.length > 0 && (
                            <div className="ml-11 flex flex-wrap gap-1.5">
                              {pb.medewerkers.map((m) => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-600"
                                >
                                  <span className="w-4 h-4 rounded-full bg-p/15 text-p text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {m.voornaam?.[0]}
                                  </span>
                                  {m.voornaam} {m.achternaam}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
                    <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-p" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800">
                      Planning
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      {
                        label: "Startdatum",
                        value: formatDate(project?.start_datum),
                      },
                      {
                        label: "Einddatum",
                        value: formatDate(project?.eind_datum),
                      },
                      { label: "Opmerking", value: project?.opmerkingen },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between items-start gap-4"
                      >
                        <p className="text-sm font-semibold text-slate-400">
                          {label}
                        </p>
                        <p className="text-sm font-bold text-slate-800 text-right max-w-[60%]">
                          {value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
