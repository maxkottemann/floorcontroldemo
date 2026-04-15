"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { project } from "@/types/project";
import { Locatie } from "@/types/locatie";
import { kamervloer } from "@/types/kamervloer";
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
  ChevronDownIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
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
const PIE_COLORS = [
  "#154273",
  "#2d6aad",
  "#4d94d6",
  "#85b8e8",
  "#b8d4f0",
  "#1a5c3a",
  "#2e8b57",
  "#52b47a",
  "#85cfa3",
  "#c8ebd8",
];

function PieChart({
  data,
  title,
  subtitle,
}: {
  data: { label: string; value: number; m2?: number }[];
  title: string;
  subtitle: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  // Build SVG pie slices
  const cx = 80;
  const cy = 80;
  const r = 68;
  const hole = 44;
  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const sweep = pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const hx1 = cx + hole * Math.cos(angle);
    const hy1 = cy + hole * Math.sin(angle);
    const hx2 = cx + hole * Math.cos(angle + sweep);
    const hy2 = cy + hole * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${hx1} ${hy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${hx2} ${hy2} A ${hole} ${hole} 0 ${large} 0 ${hx1} ${hy1} Z`;
    const result = {
      path,
      color: PIE_COLORS[i % PIE_COLORS.length],
      pct,
      sweep,
    };
    angle += sweep;
    return result;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
        <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
          <SwatchIcon className="w-5 h-5 text-p" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {slices.map((s, i) => (
              <path
                key={i}
                d={s.path}
                fill={s.color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
            <text
              x="80"
              y="74"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontWeight="600"
            >
              TOTAAL
            </text>
            <text
              x="80"
              y="91"
              textAnchor="middle"
              fill="#154273"
              fontSize="17"
              fontWeight="800"
            >
              {total}m²
            </text>
          </svg>
        </div>
        <div className="space-y-2.5">
          {data.map((d, i) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={d.label} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <p className="text-xs font-semibold text-slate-600 flex-1 min-w-0 truncate">
                  {d.label}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {d.m2 ?? d.value}m²
                </span>
                <span className="text-xs font-bold text-slate-700 shrink-0 w-8 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Tree data types
interface VloerNode {
  id: string;
  vloertype_naam?: string;
  vierkante_meter?: number;
  status?: string;
  reinigmethode_naam?: string;
}

interface KamerNode {
  id: string;
  naam: string;
  vloeren: VloerNode[];
}

interface VerdiepingNode {
  id: string;
  naam: string;
  kamers: KamerNode[];
}

interface BouwdeelNode {
  id: string;
  naam: string;
  verdiepingen: VerdiepingNode[];
}

function VloerRij({ v, onClick }: { v: VloerNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-100 hover:border-p/20 hover:bg-p/5 cursor-pointer transition-all group"
    >
      <div className="w-5 h-5 rounded-lg bg-p/10 group-hover:bg-p/20 flex items-center justify-center shrink-0 transition-colors">
        <SwatchIcon className="w-3 h-3 text-p" />
      </div>
      <p className="text-sm font-semibold text-slate-700 flex-1 group-hover:text-p transition-colors">
        {v.vloertype_naam ?? "—"}
      </p>
      {v.reinigmethode_naam && (
        <span className="text-xs text-slate-400 font-medium">
          {v.reinigmethode_naam}
        </span>
      )}
      {v.vierkante_meter && (
        <span className="text-sm font-bold text-slate-600">
          {v.vierkante_meter}m²
        </span>
      )}
      {v.status && (
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            v.status === "afgerond"
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : v.status === "bezig"
                ? "bg-amber-50 text-amber-600 border-amber-100"
                : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {v.status}
        </span>
      )}
      <ChevronDownIcon className="w-3.5 h-3.5 text-slate-200 group-hover:text-p -rotate-90 transition-colors shrink-0" />
    </div>
  );
}

function KamerRij({
  kamer,
  router,
}: {
  kamer: KamerNode;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors"
      >
        <div className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center shrink-0">
          <HomeModernIcon className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700 flex-1">
          {kamer.naam}
        </p>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {kamer.vloeren.length} vloer{kamer.vloeren.length !== 1 ? "en" : ""}
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <div className="ml-8 mt-1 mb-2 space-y-1.5">
          {kamer.vloeren.map((v) => (
            <VloerRij
              key={v.id}
              v={v}
              onClick={() => router.push(`/vloerpaspoort/${v.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function VerdiepingRij({
  verdieping,
  router,
}: {
  verdieping: VerdiepingNode;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const totalVloeren = verdieping.kamers.reduce(
    (s, k) => s + k.vloeren.length,
    0,
  );
  return (
    <div className="mb-1.5">
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors"
      >
        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600 flex-1">
          {verdieping.naam}
        </p>
        <span className="text-[10px] text-slate-400">
          {verdieping.kamers.length} kamers · {totalVloeren} vloeren
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5">
          {verdieping.kamers.map((k) => (
            <KamerRij key={k.id} kamer={k} router={router} />
          ))}
        </div>
      )}
    </div>
  );
}

function BouwdeelRij({
  bouwdeel,
  router,
}: {
  bouwdeel: BouwdeelNode;
  router: ReturnType<typeof useRouter>;
}) {
  const [open, setOpen] = useState(false);
  const totalVloeren = bouwdeel.verdiepingen.reduce(
    (s, v) => s + v.kamers.reduce((s2, k) => s2 + k.vloeren.length, 0),
    0,
  );
  return (
    <div className="border-b border-slate-100 last:border-0">
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
          <BuildingOfficeIcon className="w-4 h-4 text-p" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{bouwdeel.naam}</p>
          <p className="text-xs text-slate-400">
            {bouwdeel.verdiepingen.length} verdiepingen · {totalVloeren} vloeren
          </p>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <div className="px-6 pb-4 pt-1 bg-slate-50/50">
          {bouwdeel.verdiepingen.map((v) => (
            <VerdiepingRij key={v.id} verdieping={v} router={router} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectBekijkenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [project, setProject] = useState<project>();
  const [locatie, setLocatie] = useState<Locatie>();
  const [bouwdeelTree, setBouwdeelTree] = useState<BouwdeelNode[]>([]);
  const [kamervloeren, setKamervloeren] = useState<VloerNode[]>([]);

  interface ProjectBusData {
    id: string;
    bus_naam: string;
    bus_type: string;
    bus_kenteken: string;
    medewerkers: { id: string; voornaam: string; achternaam: string }[];
  }
  const [projectBussen, setProjectBussen] = useState<ProjectBusData[]>([]);
  const [reinigmethodeData, setReinigmethodeData] = useState<
    { label: string; value: number; m2: number }[]
  >([]);

  useEffect(() => {
    async function getProjectData() {
      if (!id) return;
      const { data: projectData } = await supabase
        .from("projecten")
        .select(
          "locatie_id, locaties(naam,id), naam, beschrijving, opmerkingen, id, start_datum, eind_datum",
        )
        .eq("id", id)
        .single();

      if (!projectData) {
        showToast("Data kon niet geladen worden", "error");
        return;
      }

      setProject({
        id: projectData.id,
        locatie_naam: (projectData.locaties as any)?.naam,
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
    async function getTree() {
      if (!id) return;

      // Fetch project vloeren with full hierarchy
      const { data } = await supabase
        .from("project_vloeren")
        .select(
          `
          kamervloer_id,
          reinigings_methodes(naam),
          kamer_vloeren(
            id, vierkante_meter, status,
            vloer_types(naam),
            kamers(
              id, naam,
              verdiepingen(
                id, naam,
                bouwdeel(id, naam)
              )
            )
          )
        `,
        )
        .eq("project_id", id);

      if (!data) return;

      // Build tree: bouwdeel -> verdieping -> kamer -> vloer
      const bouwdeelMap: Record<string, BouwdeelNode> = {};
      const allVloeren: VloerNode[] = [];

      for (const row of data) {
        const kv = row.kamer_vloeren as any;
        if (!kv) continue;

        const kamer = kv.kamers;
        const verdieping = kamer?.verdiepingen;
        const bouwdeel = verdieping?.bouwdeel;

        if (!bouwdeel || !verdieping || !kamer) continue;

        const vloer: VloerNode = {
          id: kv.id,
          vloertype_naam: kv.vloer_types?.naam,
          vierkante_meter: kv.vierkante_meter,
          status: kv.status,
          reinigmethode_naam: (row.reinigings_methodes as any)?.naam,
        };
        allVloeren.push(vloer);

        // Bouwdeel
        if (!bouwdeelMap[bouwdeel.id]) {
          bouwdeelMap[bouwdeel.id] = {
            id: bouwdeel.id,
            naam: bouwdeel.naam,
            verdiepingen: [],
          };
        }
        const bd = bouwdeelMap[bouwdeel.id];

        // Verdieping
        let verd = bd.verdiepingen.find((v) => v.id === verdieping.id);
        if (!verd) {
          verd = { id: verdieping.id, naam: verdieping.naam, kamers: [] };
          bd.verdiepingen.push(verd);
        }

        // Kamer
        let kam = verd.kamers.find((k) => k.id === kamer.id);
        if (!kam) {
          kam = { id: kamer.id, naam: kamer.naam, vloeren: [] };
          verd.kamers.push(kam);
        }

        kam.vloeren.push(vloer);
      }

      setBouwdeelTree(Object.values(bouwdeelMap));
      setKamervloeren(allVloeren);
    }
    getTree();
  }, [id]);

  useEffect(() => {
    async function getReinigmethodes() {
      if (!id) return;
      const { data } = await supabase
        .from("project_vloeren")
        .select("kamer_vloeren(vierkante_meter), reinigings_methodes(naam)")
        .eq("project_id", id)
        .not("reinigmethode_id", "is", null);

      if (!data) return;

      const methodeMap: Record<string, number> = {};
      for (const row of data) {
        const naam = (row.reinigings_methodes as any)?.naam ?? "Onbekend";
        const m2 = (row.kamer_vloeren as any)?.vierkante_meter ?? 0;
        methodeMap[naam] = (methodeMap[naam] ?? 0) + m2;
      }

      setReinigmethodeData(
        Object.entries(methodeMap).map(([label, m2]) => ({
          label,
          value: m2,
          m2,
        })),
      );
    }
    getReinigmethodes();
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
    }
    getBussen();
  }, [id]);

  const totalM2 = kamervloeren.reduce(
    (sum, v) => sum + (v.vierkante_meter ?? 0),
    0,
  );
  const uniqueVloerTypes = [
    ...new Set(kamervloeren.map((v) => v.vloertype_naam).filter(Boolean)),
  ];
  const totalKamers = bouwdeelTree.reduce(
    (s, b) => s + b.verdiepingen.reduce((s2, v) => s2 + v.kamers.length, 0),
    0,
  );

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Project bekijken" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-7">
            {/* Header */}
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

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Bouwdelen"
                value={bouwdeelTree.length}
                sub="in dit project"
              />
              <StatCard label="Kamers" value={totalKamers} sub="geselecteerd" />
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
              {/* Bouwdeel tree */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                      <BuildingOfficeIcon className="w-5 h-5 text-p" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800">
                        Ruimtes & vloeren
                      </h2>
                      <p className="text-sm text-slate-400">
                        {bouwdeelTree.length} bouwdelen — klik om te openen
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-p bg-p/10 px-3 py-1.5 rounded-full">
                    {kamervloeren.length} vloer
                    {kamervloeren.length !== 1 ? "en" : ""}
                  </span>
                </div>

                {bouwdeelTree.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <BuildingOfficeIcon className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-base text-slate-400 font-medium">
                      Geen ruimtes gevonden
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      Er zijn geen vloeren gekoppeld aan dit project
                    </p>
                  </div>
                ) : (
                  <div>
                    {bouwdeelTree.map((b) => (
                      <BouwdeelRij key={b.id} bouwdeel={b} router={router} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
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
                  <PieChart
                    title="Vloertypes"
                    subtitle="Verdeling per vloertype op m²"
                    data={uniqueVloerTypes.map((type) => {
                      const m2 = kamervloeren
                        .filter((v) => v.vloertype_naam === type)
                        .reduce((s, v) => s + (v.vierkante_meter ?? 0), 0);
                      return { label: type ?? "—", value: m2, m2 };
                    })}
                  />
                )}

                {reinigmethodeData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-50">
                      <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center">
                        <SwatchIcon className="w-5 h-5 text-p" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">
                          Reinigingsmethodes
                        </h2>
                        <p className="text-sm text-slate-400">
                          Verdeling per methode op m²
                        </p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {(() => {
                        const total = reinigmethodeData.reduce(
                          (s, d) => s + d.value,
                          0,
                        );
                        return reinigmethodeData
                          .sort((a, b) => b.value - a.value)
                          .map((d, i) => {
                            const pct =
                              total > 0
                                ? Math.round((d.value / total) * 100)
                                : 0;
                            return (
                              <div key={d.label}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-xs font-semibold text-slate-600 truncate max-w-[70%]">
                                    {d.label}
                                  </p>
                                  <span className="text-xs font-bold text-slate-700">
                                    {pct}%
                                  </span>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${pct}%`,
                                      background:
                                        PIE_COLORS[i % PIE_COLORS.length],
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          });
                      })()}
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
