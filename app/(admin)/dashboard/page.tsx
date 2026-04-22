"use client";

import Topbar from "@/components/layout/topbar";
import Card from "@/components/layout/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/sidebar";
import {
  BellAlertIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  TruckIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface TypePlanning {
  type: string;
  totaal: number;
  gepland: number;
  afgerond: number;
}

interface PerceelPlanning {
  perceel_id: string;
  perceel_naam: string;
  totaal: number;
  gepland: number;
  afgerond: number;
  perType: TypePlanning[];
}

interface DashboardData {
  totaalLocaties: number;
  totaalGepland: number;
  totaalAfgerond: number;
  perPerceel: PerceelPlanning[];
  openMeldingen: number;
}

interface ActiveProject {
  id: string;
  projectnaam: string;
  totalm2: number;
  finishedm2: number;
  bussen: any[];
}

function getWasJaar() {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-09-01`;
}

function MiniBar({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProjecten, setActiveProjecten] = useState<ActiveProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sustainability = [
    { label: "CO₂-reductie mobiliteit", value: 93, target: 90, suffix: "%" },
    { label: "Afvalreductie", value: 52, target: 50, suffix: "%" },
    { label: "Chemiereductie", value: 30, target: 30, suffix: "%" },
    { label: "Afvalwater reductie", value: 39, target: 40, suffix: "%" },
  ];

  const ring = (value: number) => ({
    background: `conic-gradient(#154273 0 ${value}%, #e5e7eb ${value}% 100%)`,
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const wasJaarStart = getWasJaar();

      const { data: locaties } = await supabase
        .from("locaties")
        .select("id, perceel_id, per_jaar, type, percelen(naam)");

      if (!locaties) {
        setLoading(false);
        return;
      }

      const { data: projecten } = await supabase
        .from("projecten")
        .select("locatie_id, status")
        .gte("start_datum", wasJaarStart);

      const geplandCount: Record<string, number> = {};
      const afgerondCount: Record<string, number> = {};
      for (const p of projecten ?? []) {
        geplandCount[p.locatie_id] = (geplandCount[p.locatie_id] ?? 0) + 1;
        if (p.status === "afgerond")
          afgerondCount[p.locatie_id] = (afgerondCount[p.locatie_id] ?? 0) + 1;
      }

      const geplandLocatieIds = new Set(
        locaties
          .filter((l:any) => (geplandCount[l.id] ?? 0) >= (l.per_jaar ?? 1))
          .map((l:any) => l.id),
      );
      const afgerondLocatieIds = new Set(
        locaties
          .filter((l) => (afgerondCount[l.id] ?? 0) >= (l.per_jaar ?? 1))
          .map((l) => l.id),
      );

      const perceelMap: Record<
        string,
        {
          perceel_naam: string;
          totaal: number;
          gepland: number;
          afgerond: number;
          typeMap: Record<
            string,
            { totaal: number; gepland: number; afgerond: number }
          >;
        }
      > = {};

      for (const l of locaties) {
        const pid = l.perceel_id ?? "onbekend";
        const pnaam = (l.percelen as any)?.naam ?? "Onbekend";
        const type = (l.type as string) ?? "Onbekend";

        if (!perceelMap[pid])
          perceelMap[pid] = {
            perceel_naam: pnaam,
            totaal: 0,
            gepland: 0,
            afgerond: 0,
            typeMap: {},
          };
        if (!perceelMap[pid].typeMap[type])
          perceelMap[pid].typeMap[type] = {
            totaal: 0,
            gepland: 0,
            afgerond: 0,
          };

        perceelMap[pid].totaal++;
        perceelMap[pid].typeMap[type].totaal++;
        if (geplandLocatieIds.has(l.id)) {
          perceelMap[pid].gepland++;
          perceelMap[pid].typeMap[type].gepland++;
        }
        if (afgerondLocatieIds.has(l.id)) {
          perceelMap[pid].afgerond++;
          perceelMap[pid].typeMap[type].afgerond++;
        }
      }

      const { count: openMeldingen } = await supabase
        .from("meldingen")
        .select("id", { count: "exact", head: true })
        .eq("afgehandeld", false);

      setData({
        totaalLocaties: locaties.length,
        totaalGepland: geplandLocatieIds.size,
        totaalAfgerond: afgerondLocatieIds.size,
        perPerceel: Object.entries(perceelMap)
          .map(([pid, val]) => ({
            perceel_id: pid,
            perceel_naam: val.perceel_naam,
            totaal: val.totaal,
            gepland: val.gepland,
            afgerond: val.afgerond,
            perType: Object.entries(val.typeMap)
              .map(([type, t]) => ({ type, ...t }))
              .sort((a, b) => a.type.localeCompare(b.type)),
          }))
          .sort((a, b) => b.totaal - a.totaal),
        openMeldingen: openMeldingen ?? 0,
      });
      setLoading(false);
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    async function getActiveProjects() {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from("projecten")
        .select(
          `id, naam, project_vloeren(kamer_vloeren(vierkante_meter)), gewassen_vloeren(vierkante_meter), project_bussen(bussen(id, naam, kenteken, type))`,
        )
        .eq("status", "bezig")
        .limit(5);

      if (error || !data) {
        setActiveProjecten([]);
        setLoadingProjects(false);
        return;
      }

      setActiveProjecten(
        data.map((d: any) => ({
          id: d.id,
          projectnaam: d.naam,
          totalm2: Array.isArray(d.project_vloeren)
            ? d.project_vloeren.reduce(
                (t: number, pv: any) =>
                  t + (pv.kamer_vloeren?.vierkante_meter ?? 0),
                0,
              )
            : 0,
          finishedm2: Array.isArray(d.gewassen_vloeren)
            ? d.gewassen_vloeren.reduce(
                (s: number, gv: any) => s + (gv.vierkante_meter ?? 0),
                0,
              )
            : 0,
          bussen: Array.isArray(d.project_bussen)
            ? d.project_bussen.map((pb: any) => pb.bussen)
            : [],
        })),
      );
      setLoadingProjects(false);
    }
    getActiveProjects();
  }, []);

  const planningPct =
    data && data.totaalLocaties > 0
      ? Math.round((data.totaalGepland / data.totaalLocaties) * 100)
      : 0;
  const now = new Date();
  const wasJaarLabel =
    now.getMonth() >= 8
      ? `${now.getFullYear()}–${now.getFullYear() + 1}`
      : `${now.getFullYear() - 1}–${now.getFullYear()}`;

  return (
    <div className="min-h-screen flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="fixed top-0 left-0 h-screen"
      />
      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Dashboard"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />
        <main className="flex-1 overflow-auto p-6 bg-[#F5F6FA]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Jaarplanning gepland
              </p>
              {loading ? (
                <div className="w-16 h-8 bg-slate-100 rounded animate-pulse mb-2" />
              ) : (
                <p className="text-3xl font-bold text-p mb-2">{planningPct}%</p>
              )}
              <p className="text-slate-400 text-xs">
                 {wasJaarLabel} · {data?.totaalGepland ?? "—"}/
                {data?.totaalLocaties ?? "—"} locaties
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                {!loading && data && (
                  <div
                    className="h-full bg-p rounded-full transition-all duration-700"
                    style={{ width: `${planningPct}%` }}
                  />
                )}
              </div>
            </Card>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Uitvoering op schema
              </p>
              <p className="text-3xl font-bold text-p mb-2">100%</p>
              <p className="text-slate-400 text-xs">
                Binnen afgesproken venster
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-p rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </Card>
            <Card>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Kwaliteit oplevering
              </p>
              <p className="text-3xl font-bold text-p mb-2">98,4%</p>
              <p className="text-slate-400 text-xs">Boven KPI-norm 95%</p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: "96.4%" }}
                />
              </div>
            </Card>
            <Card>
              <a href="/meldingen">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Open meldingen
              </p>
              {loading ? (
                <div className="w-12 h-8 bg-slate-100 rounded animate-pulse mb-2" />
              ) : (
                <p className="text-3xl font-bold text-p mb-2">
                  {data?.openMeldingen ?? "—"}
                </p>
              )}
              <p className="text-slate-400 text-xs">Openstaande acties</p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden" />
              </a>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <Card className="col-span-3">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-lg font-bold">Planningsoverzicht</p>
                  <p className="text-sm text-slate-500">
                    Onderhoudsjaar {wasJaarLabel} — per perceel en locatietype
                  </p>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-p/10 px-3 py-1 text-xs font-semibold text-p">
                  {wasJaarLabel}
                </span>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-slate-100 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.perPerceel.map((p) => (
                    <div
                      key={p.perceel_id}
                      className="rounded-2xl border border-slate-200 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {p.perceel_naam}
                          </p>
                          <p className="text-xs text-slate-400">
                            {p.totaal} locaties · {p.gepland - p.afgerond} projecten projecten ·{" "}
                            {p.afgerond} afgerond
                          </p>
                        </div>
                        <span className="text-sm font-bold text-p">
                          {p.totaal > 0
                            ? Math.round((p.gepland / p.totaal) * 100)
                            : 0}
                          %
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-slate-100">
                        {p.perType.map((t, i) => (
                          <div
                            key={t.type}
                            className={`px-4 py-3 space-y-2 ${i >= 2 ? "border-t border-slate-100" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700">
                                {t.type}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {t.totaal} loc.
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-p inline-block" />
                                    Gepland
                                  </span>
                                  <span className="font-semibold text-slate-600">
                                    {t.gepland}/{t.totaal}
                                  </span>
                                </div>
                                <MiniBar
                                  value={t.gepland}
                                  total={t.totaal}
                                  color="bg-p"
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    Afgerond
                                  </span>
                                  <span className="font-semibold text-slate-600">
                                    {t.afgerond}/{t.totaal}
                                  </span>
                                </div>
                                <MiniBar
                                  value={t.afgerond}
                                  total={t.totaal}
                                  color="bg-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="col-span-3 md:col-span-2">
              <div className="mb-4">
                <h2 className="text-lg font-bold">Duurzaamheid</h2>
                <p className="text-sm text-slate-500">
                  Actuele contractprestaties t.o.v. doelstelling
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {sustainability.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 p-4 text-center"
                  >
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full p-1.5"
                      style={ring(item.value)}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-bold text-p">
                        {item.value}
                        {item.suffix}
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs font-medium text-slate-700">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Doel: {item.target}
                      {item.suffix}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="col-span-3">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-lg font-bold">Actuele projecten</p>
                  <p className="text-sm text-slate-500">
                    Lopende projecten en voortgang
                  </p>
                </div>
                {!loadingProjects && activeProjecten.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {activeProjecten.length} actief
                  </span>
                )}
              </div>

              {loadingProjects ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-slate-100 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : activeProjecten.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-sm text-slate-300">
                    Geen actieve projecten
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjecten.map((a) => {
                    const pct =
                      a.totalm2 > 0
                        ? Math.round((a.finishedm2 / a.totalm2) * 100)
                        : 0;
                    return (
                      <div
                        key={a.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {a.projectnaam}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {a.bussen.filter(Boolean).map((b: any) => (
                                <span
                                  key={b.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                                >
                                  <TruckIcon className="w-4"></TruckIcon>{" "}
                                  {b.naam} · {b.kenteken}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-bold text-p leading-none">
                              {pct}%
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {a.finishedm2} / {a.totalm2}m²
                            </p>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-p rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="col-span-3 md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Project plannen",
                    icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
                    href: "/projecten/aanmaken",
                    color:
                      "bg-p/10 text-p group-hover:bg-p group-hover:text-white",
                  },
                  {
                    label: "Meldingen bekijken",
                    icon: <BellAlertIcon className="w-5 h-5" />,
                    href: "/meldingen",
                    color:
                      "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
                  },
                  {
                    label: "Rapportages",
                    icon: <DocumentChartBarIcon className="w-5 h-5" />,
                    href: "/rapporten",
                    color:
                      "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
                  },
                  {
                    label: "Account aanmaken",
                    icon: <UserPlusIcon className="w-5 h-5" />,
                    href: "/gebruikers",
                    color:
                      "bg-slate-100 text-slate-500 group-hover:bg-slate-700 group-hover:text-white",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.href)}
                    className="group flex flex-col items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${item.color}`}
                    >
                      {item.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 leading-tight">
                      {item.label}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
