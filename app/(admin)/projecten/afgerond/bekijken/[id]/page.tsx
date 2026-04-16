"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  CheckCircleIcon,
  MapPinIcon,
  CalendarDaysIcon,
  SwatchIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  TruckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

interface ProjectDetail {
  id: string;
  naam: string;
  beschrijving: string;
  opmerkingen: string;
  start_datum: string;
  eind_datum: string;
  locatie_naam: string;
  locatie_adres: string;
}

interface VloerStat {
  vloertype: string;
  totaal_m2: number;
  gewassen_m2: number;
  status: string;
}

interface Steekproef {
  status: string;
  afgerond_op: string;
  totaal: number;
  goed: number;
}

interface Bus {
  id: string;
  naam: string;
  kenteken: string;
  type: string;
  medewerkers: { voornaam: string; achternaam: string }[];
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">
        {value}
      </p>
      <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const CHART_COLORS = [
  "#154273",
  "#3AB8BF",
  "#f59e0b",
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
];

// Fixed donut — center label uses absolute positioning relative to chart height
function DonutChart({
  gewassen,
  totaal,
}: {
  gewassen: number;
  totaal: number;
}) {
  const nietGewassen = Math.max(totaal - gewassen, 0);
  const pct = totaal > 0 ? (gewassen / totaal) * 100 : 0;
  const data = [
    { name: "Gewassen", value: gewassen },
    { name: "Niet gewassen", value: nietGewassen },
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill="#154273" />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-slate-900 leading-none">
            {pct.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">gewassen</p>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-p shrink-0" />
          <span className="text-xs text-slate-500">
            {gewassen.toFixed(0)}m² gewassen
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
          <span className="text-xs text-slate-500">
            {nietGewassen.toFixed(0)}m² open
          </span>
        </div>
      </div>
    </div>
  );
}

// Fixed pie — legend below chart, no overlap
function VloertypePieChart({ vloerStats }: { vloerStats: VloerStat[] }) {
  const data = vloerStats.map((v) => ({
    name: v.vloertype,
    value: Math.round(v.totaal_m2),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-md px-3 py-2">
          <p className="text-xs font-bold text-slate-700">{payload[0].name}</p>
          <p className="text-xs text-slate-500">{payload[0].value}m²</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            strokeWidth={2}
            stroke="#F5F6FA"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend below, no overlap */}
      <div className="w-full grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {d.name} · {d.value}m²
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AfgerondProjectBekijkenPage() {
  const { id } = useParams();
  const projectId = Array.isArray(id) ? id[0] : (id as string);
  const { toast, hideToast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [vloerStats, setVloerStats] = useState<VloerStat[]>([]);
  const [steekproef, setSteekproef] = useState<Steekproef | null>(null);
  const [bussen, setBussen] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [vloerOpmerkingen, setVloerOpmerkingen] = useState<
    { kamer: string; vloertype: string; opmerking: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      const { data: p } = await supabase
        .from("projecten")
        .select(
          "id, naam, beschrijving, opmerkingen, start_datum, eind_datum, locaties(naam, adres, plaats)",
        )
        .eq("id", projectId)
        .single();

      if (p) {
        const loc = p.locaties as any;
        setProject({
          id: p.id,
          naam: p.naam,
          beschrijving: p.beschrijving,
          opmerkingen: p.opmerkingen,
          start_datum: p.start_datum,
          eind_datum: p.eind_datum,
          locatie_naam: loc?.naam ?? "—",
          locatie_adres: [loc?.adres, loc?.plaats].filter(Boolean).join(", "),
        });
      }

      const { data: gepland } = await supabase
        .from("project_vloeren")
        .select(
          "kamervloer_id, kamer_vloeren(vierkante_meter, vloer_types(naam), status)",
        )
        .eq("project_id", projectId);

      const { data: gewassen } = await supabase
        .from("gewassen_vloeren")
        .select(
          "kamervloer_id, vierkante_meter, opmerking, kamer_vloeren(vloer_types(naam), kamers(naam))",
        )
        .eq("project_id", projectId);

      const typeMap: Record<
        string,
        { gepland_m2: number; gewassen_m2: number; status: string }
      > = {};
      for (const g of gepland ?? []) {
        const kv = g.kamer_vloeren as any;
        const type = kv?.vloer_types?.naam ?? "Onbekend";
        if (!typeMap[type])
          typeMap[type] = {
            gepland_m2: 0,
            gewassen_m2: 0,
            status: kv?.status ?? "—",
          };
        typeMap[type].gepland_m2 += kv?.vierkante_meter ?? 0;

        setVloerOpmerkingen(
          (gewassen ?? [])
            .filter((g: any) => g.opmerking)
            .map((g: any) => ({
              kamer: (g.kamer_vloeren as any)?.kamers?.naam ?? "—",
              vloertype: (g.kamer_vloeren as any)?.vloer_types?.naam ?? "—",
              opmerking: g.opmerking,
            })),
        );
      }
      for (const g of gewassen ?? []) {
        const kv = g.kamer_vloeren as any;
        const type = kv?.vloer_types?.naam ?? "Onbekend";
        if (!typeMap[type])
          typeMap[type] = { gepland_m2: 0, gewassen_m2: 0, status: "—" };
        typeMap[type].gewassen_m2 += g.vierkante_meter ?? 0;
      }

      setVloerStats(
        Object.entries(typeMap).map(([vloertype, val]) => ({
          vloertype,
          totaal_m2: val.gepland_m2,
          gewassen_m2: val.gewassen_m2,
          status: val.status,
        })),
      );

      const { data: sp } = await supabase
        .from("steekproeven")
        .select("status, afgerond_op, steekproef_vloeren(goedgekeurd)")
        .eq("project_id", projectId)
        .single();

      if (sp) {
        const vloeren = sp.steekproef_vloeren as any[];
        setSteekproef({
          status: sp.status,
          afgerond_op: sp.afgerond_op,
          totaal: vloeren?.length ?? 0,
          goed: vloeren?.filter((v) => v.goedgekeurd === true).length ?? 0,
        });
      }

      setLoading(false);
    }
    load();
  }, [projectId]);

  const totaalGepland = vloerStats.reduce((s, v) => s + v.totaal_m2, 0);
  const totaalGewassen = vloerStats.reduce((s, v) => s + v.gewassen_m2, 0);
  const pctGedaan =
    totaalGepland > 0 ? (totaalGewassen / totaalGepland) * 100 : 0;
  const steekproefPct =
    steekproef && steekproef.totaal > 0
      ? (steekproef.goed / steekproef.totaal) * 100
      : 0;

  const duurDagen =
    project?.start_datum && project.eind_datum
      ? Math.max(
          1,
          Math.ceil(
            (new Date(project.eind_datum).getTime() -
              new Date(project.start_datum).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Project overzicht" />

        <main className="flex-1 overflow-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : !project ? (
            <p className="text-slate-400 text-center py-20">
              Project niet gevonden
            </p>
          ) : (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                    Afgerond project
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {project.naam}
                  </h1>
                  {project.beschrijving && (
                    <p className="text-sm text-slate-400 mt-1">
                      {project.beschrijving}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      {project.locatie_naam}
                      {project.locatie_adres && ` · ${project.locatie_adres}`}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      {formatDate(project.start_datum)} —{" "}
                      {formatDate(project.eind_datum)}
                    </span>
                  </div>
                </div>
                <a
                  href={`/api/rapport?project_id=${projectId}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all shrink-0 shadow-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Opleverbon
                </a>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Gepland oppervlak"
                  value={`${totaalGepland.toFixed(0)}m²`}
                  color="bg-p/10"
                  icon={<SwatchIcon className="w-5 h-5 text-p" />}
                />
                <StatCard
                  label="Gewassen oppervlak"
                  value={`${totaalGewassen.toFixed(0)}m²`}
                  sub={`${pctGedaan.toFixed(0)}% van gepland`}
                  color="bg-emerald-100"
                  icon={
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  }
                />
                <StatCard
                  label="Projectduur"
                  value={`${duurDagen}`}
                  sub={duurDagen === 1 ? "dag" : "dagen"}
                  color="bg-p/10"
                  icon={<CalendarDaysIcon className="w-5 h-5 text-p" />}
                />
                <StatCard
                  label="Kwaliteit steekproef"
                  value={steekproef ? `${steekproefPct.toFixed(0)}%` : "—"}
                  sub={
                    steekproef
                      ? `${steekproef.goed}/${steekproef.totaal} goedgekeurd`
                      : "Geen steekproef"
                  }
                  color={
                    steekproefPct >= 95
                      ? "bg-emerald-100"
                      : steekproefPct > 0
                        ? "bg-amber-100"
                        : "bg-slate-100"
                  }
                  icon={
                    <ClipboardDocumentCheckIcon
                      className={`w-5 h-5 ${steekproefPct >= 95 ? "text-emerald-600" : steekproefPct > 0 ? "text-amber-600" : "text-slate-400"}`}
                    />
                  }
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Donut — gewassen vs gepland */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-800">
                      Gewassen oppervlak
                    </p>
                    <p className="text-xs text-slate-400">
                      Voortgang vs gepland
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <DonutChart
                      gewassen={totaalGewassen}
                      totaal={totaalGepland}
                    />
                  </div>
                </div>

                {/* Pie — vloertype distribution */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-800">
                      Vloertype verdeling
                    </p>
                    <p className="text-xs text-slate-400">
                      Distributie per type in m²
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    {vloerStats.length === 0 ? (
                      <p className="text-sm text-slate-300 text-center py-8">
                        Geen vloerdata
                      </p>
                    ) : (
                      <VloertypePieChart vloerStats={vloerStats} />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Vloertypes table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="text-sm font-bold text-slate-800">
                      Vloertypes detail
                    </p>
                    <p className="text-xs text-slate-400">
                      Gepland vs gewassen per type
                    </p>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {vloerStats.map((v, i) => (
                      <div key={v.vloertype} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                            <p className="text-sm font-semibold text-slate-700">
                              {v.vloertype}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {v.gewassen_m2.toFixed(0)}/
                              {v.totaal_m2.toFixed(0)}m²
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${v.status === "Goed" ? "bg-emerald-50 text-emerald-600" : v.status === "Matig" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}
                            >
                              {v.status}
                            </span>
                          </div>
                        </div>
                        <ProgressBar
                          value={v.gewassen_m2}
                          max={v.totaal_m2}
                          color="bg-p"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steekproef + opmerkingen */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center">
                        <ClipboardDocumentCheckIcon className="w-4 h-4 text-p" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Steekproef
                        </p>
                        <p className="text-xs text-slate-400">
                          Kwaliteitscontrole resultaat
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      {!steekproef ? (
                        <p className="text-sm text-slate-300 text-center py-4">
                          Geen steekproef uitgevoerd
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center bg-slate-50 rounded-xl py-3">
                              <p className="text-xl font-bold text-slate-700">
                                {steekproef.totaal}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Totaal
                              </p>
                            </div>
                            <div className="text-center bg-emerald-50 rounded-xl py-3">
                              <p className="text-xl font-bold text-emerald-600">
                                {steekproef.goed}
                              </p>
                              <p className="text-[10px] text-emerald-500 mt-0.5">
                                Goed
                              </p>
                            </div>
                            <div className="text-center bg-red-50 rounded-xl py-3">
                              <p className="text-xl font-bold text-red-500">
                                {steekproef.totaal - steekproef.goed}
                              </p>
                              <p className="text-[10px] text-red-400 mt-0.5">
                                Niet goed
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs text-slate-500">
                                Goedgekeurd
                              </span>
                              <span
                                className={`text-xs font-bold ${steekproefPct >= 95 ? "text-emerald-600" : "text-amber-500"}`}
                              >
                                {steekproefPct.toFixed(0)}%
                              </span>
                            </div>
                            <ProgressBar
                              value={steekproef.goed}
                              max={steekproef.totaal}
                              color={
                                steekproefPct >= 95
                                  ? "bg-emerald-500"
                                  : "bg-amber-400"
                              }
                            />
                          </div>
                          {steekproef.afgerond_op && (
                            <p className="text-xs text-slate-400">
                              Afgerond op {formatDate(steekproef.afgerond_op)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {vloerOpmerkingen.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Opmerkingen
                          </p>
                          <p className="text-xs text-slate-400">
                            {vloerOpmerkingen.length} opmerking
                            {vloerOpmerkingen.length !== 1 ? "en" : ""} bij
                            vloeren
                          </p>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {vloerOpmerkingen.map((o, i) => (
                          <div
                            key={i}
                            className="px-5 py-3.5 flex items-start gap-3"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-bold text-slate-700">
                                  {o.kamer}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                                  {o.vloertype}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {o.opmerking}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Project tijdlijn */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-sm font-bold text-slate-800">
                    Project tijdlijn
                  </p>
                  <p className="text-xs text-slate-400">
                    Looptijd en mijlpalen
                  </p>
                </div>
                <div className="px-5 py-5">
                  <div className="flex items-center gap-0">
                    {/* Start */}
                    <div className="text-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-p flex items-center justify-center mx-auto mb-2">
                        <CalendarDaysIcon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Start</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(project.start_datum)}
                      </p>
                    </div>

                    {/* Line */}
                    <div className="flex-1 h-0.5 bg-p/20 mx-4 relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-p rounded-full"
                        style={{ width: "100%" }}
                      />
                    </div>

                    {/* Steekproef if done */}
                    {steekproef?.afgerond_op && (
                      <>
                        <div className="text-center shrink-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">
                            Steekproef
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatDate(steekproef.afgerond_op)}
                          </p>
                        </div>
                        <div className="flex-1 h-0.5 bg-p/20 mx-4 relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-p rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </>
                    )}

                    {/* Eind */}
                    <div className="text-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                        <CheckCircleIcon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        Afgerond
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(project.eind_datum)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Samenvatting tabel */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-sm font-bold text-slate-800">
                    Samenvatting
                  </p>
                  <p className="text-xs text-slate-400">
                    Alle kerngegevens op een rij
                  </p>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    { label: "Locatie", value: project.locatie_naam },
                    { label: "Adres", value: project.locatie_adres || "—" },
                    {
                      label: "Startdatum",
                      value: formatDate(project.start_datum),
                    },
                    {
                      label: "Einddatum",
                      value: formatDate(project.eind_datum),
                    },
                    {
                      label: "Gepland oppervlak",
                      value: `${totaalGepland.toFixed(0)} m²`,
                    },
                    {
                      label: "Gewassen oppervlak",
                      value: `${totaalGewassen.toFixed(0)} m²`,
                    },
                    {
                      label: "Voltooiingspercentage",
                      value: `${pctGedaan.toFixed(1)}%`,
                    },
                    {
                      label: "Aantal vloertypes",
                      value: `${vloerStats.length}`,
                    },
                    {
                      label: "Steekproef status",
                      value: steekproef
                        ? steekproef.status === "afgerond"
                          ? "Afgerond"
                          : "In uitvoering"
                        : "Niet uitgevoerd",
                    },
                    {
                      label: "Steekproef kwaliteit",
                      value: steekproef
                        ? `${steekproefPct.toFixed(0)}% goedgekeurd`
                        : "—",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {row.label}
                      </p>
                      <p className="text-xs font-bold text-slate-800">
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
