"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import SidebarClient from "@/components/layout/sidebarclient";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";

interface VloerRij {
  id: string;
  kamer_naam: string;
  vloertype_naam: string;
  vierkante_meter: number;
  verdieping_naam: string;
  bouwdeel_naam: string;
}

interface Beoordeling {
  [kamervloer_id: string]: boolean | null;
}

function BeoordelingButton({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => !disabled && onChange(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
          ${value === true ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <CheckCircleIcon className="w-3.5 h-3.5" />
        Goed
      </button>
      <button
        onClick={() => !disabled && onChange(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all
          ${value === false ? "bg-red-500 text-white border-red-500 shadow-sm" : "bg-white text-red-500 border-red-200 hover:bg-red-50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <XCircleIcon className="w-3.5 h-3.5" />
        Niet goed
      </button>
    </div>
  );
}

// Collapsible for bouwdeel (top level)
function CollapsibleSection({
  title,
  icon,
  count,
  beoordeeld,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  beoordeeld: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-5 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0 text-p">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400">
            {count} vloer{count !== 1 ? "en" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${beoordeeld === count ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
          >
            {beoordeeld}/{count}
          </span>
          {open ? (
            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
      {open && <div className="divide-y divide-slate-50">{children}</div>}
    </div>
  );
}

// Collapsible for verdieping and kamer rows
function CollapsibleRow({
  label,
  icon,
  count,
  beoordeeld,
  indent,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  beoordeeld: number;
  indent?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center gap-2 py-2.5 border-b border-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left
          ${indent ? "px-8 bg-slate-50/40" : "px-5 bg-slate-50/60"}`}
      >
        {icon}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-1 min-w-0 truncate">
          {label}
        </p>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${beoordeeld === count ? "bg-emerald-50 text-emerald-600" : "text-slate-400"}`}
        >
          {beoordeeld}/{count}
        </span>
        {open ? (
          <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function SteekproevenUitvoerenPage() {
  const { toast, showToast, hideToast } = useToast();
  const params = useParams();
  const projectId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);
  const router = useRouter();

  const [steekproefId, setSteekproefId] = useState<string | null>(null);
  const [vloeren, setVloeren] = useState<VloerRij[]>([]);
  const [loading, setLoading] = useState(true);
  const [beoordelingen, setBeoordelingen] = useState<Beoordeling>({});
  const [saving, setSaving] = useState(false);
  const [afgerond, setAfgerond] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!projectId) return;

      // 1. Get or create steekproef
      let { data: bestaande } = await supabase
        .from("steekproeven")
        .select("id, status")
        .eq("project_id", projectId)
        .single();

      let sid = bestaande?.id;

      if (!bestaande) {
        const { data: nieuw } = await supabase
          .from("steekproeven")
          .insert({ project_id: projectId, status: "in_progress" })
          .select("id, status")
          .single();
        sid = nieuw?.id;
        bestaande = nieuw;
      }

      if (!sid) {
        setLoading(false);
        return;
      }
      setSteekproefId(sid);
      if (bestaande?.status === "afgerond") setAfgerond(true);

      // 2. Load floors
      const { data: gwIds } = await supabase
        .from("gewassen_vloeren")
        .select("kamervloer_id")
        .eq("project_id", projectId);
      if (!gwIds?.length) {
        setLoading(false);
        return;
      }

      const { data: kv } = await supabase
        .from("kamer_vloeren")
        .select(
          "id, kamers(naam, verdiepingen(naam, bouwdeel(naam))), vloer_types(naam), vierkante_meter",
        )
        .in(
          "id",
          gwIds.map((d) => d.kamervloer_id),
        );
      if (!kv) {
        setLoading(false);
        return;
      }

      setVloeren(
        kv.map((km: any) => ({
          id: km.id,
          kamer_naam: km.kamers?.naam ?? "—",
          vloertype_naam: km.vloer_types?.naam ?? "—",
          vierkante_meter: km.vierkante_meter ?? 0,
          verdieping_naam: km.kamers?.verdiepingen?.naam ?? "—",
          bouwdeel_naam: km.kamers?.verdiepingen?.bouwdeel?.naam ?? "—",
        })),
      );

      // 3. Load existing beoordelingen
      const { data: existing } = await supabase
        .from("steekproef_vloeren")
        .select("kamervloer_id, goedgekeurd")
        .eq("steekproef_id", sid);

      if (existing?.length) {
        const map: Beoordeling = {};
        for (const e of existing) map[e.kamervloer_id] = e.goedgekeurd;
        setBeoordelingen(map);
      }

      setLoading(false);
    }
    load();
  }, [projectId]);

  async function setBeoordeling(vloerId: string, waarde: boolean) {
    if (afgerond || !steekproefId) return;
    setBeoordelingen((prev) => ({ ...prev, [vloerId]: waarde }));
    await supabase.from("steekproef_vloeren").upsert(
      {
        steekproef_id: steekproefId,
        kamervloer_id: vloerId,
        goedgekeurd: waarde,
      },
      { onConflict: "steekproef_id,kamervloer_id" },
    );
  }

  const aantalBeoordeeld = Object.values(beoordelingen).filter(
    (v) => v !== null && v !== undefined,
  ).length;
  const aantalGoed = Object.values(beoordelingen).filter(
    (v) => v === true,
  ).length;
  const aantalNietGoed = Object.values(beoordelingen).filter(
    (v) => v === false,
  ).length;
  const voortgangPct =
    vloeren.length > 0 ? (aantalBeoordeeld / vloeren.length) * 100 : 0;

  const grouped: Record<
    string,
    Record<string, Record<string, VloerRij[]>>
  > = {};
  for (const v of vloeren) {
    const b = v.bouwdeel_naam ?? "Overig";
    const verd = v.verdieping_naam ?? "Overig";
    const k = v.kamer_naam ?? "Overig";
    if (!grouped[b]) grouped[b] = {};
    if (!grouped[b][verd]) grouped[b][verd] = {};
    if (!grouped[b][verd][k]) grouped[b][verd][k] = [];
    grouped[b][verd][k].push(v);
  }

  async function handleOpslaan() {
    if (!steekproefId) return;
    setSaving(true);
    const { error } = await supabase
      .from("steekproeven")
      .update({ status: "in_progress" })
      .eq("id", steekproefId);
    setSaving(false);
    if (error) {
      showToast("Opslaan mislukt: " + error.message, "error");
      return;
    }
    showToast("Voortgang opgeslagen", "success");
    setTimeout(() => router.back(), 500);
  }

  async function handleAfronden() {
    if (!steekproefId) return;
    setSaving(true);

    const { data, error: fetchError } = await supabase
      .from("steekproef_vloeren")
      .select("goedgekeurd")
      .eq("steekproef_id", steekproefId);

    if (!data || fetchError) {
      showToast("Geen vloeren gevonden", "error");
      setSaving(false);
      return;
    }

    const good = data.filter((d) => d.goedgekeurd === true).length;
    const pct = data.length > 0 ? (good / data.length) * 100 : 0;
    const approved = pct >= 95;

    const { error } = await supabase
      .from("steekproeven")
      .update({
        status: "afgerond",
        afgerond_op: new Date().toISOString(),
        goedgekeurd: approved,
      })
      .eq("id", steekproefId);

    setSaving(false);
    if (error) {
      showToast("Afronden mislukt: " + error.message, "error");
      return;
    }

    setAfgerond(true);
    showToast("Steekproef afgerond", "success");
    setTimeout(() => router.back(), 1000);
  }
  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="fixed top-0 left-0 h-screen"
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Steekproef uitvoeren"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Kwaliteitscontrole
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Steekproef uitvoeren
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Beoordeel vloeren — elke klik wordt automatisch opgeslagen
              </p>
            </div>

            <div className="flex gap-6 items-start">
              {/* LEFT — floor list */}
              <div className="flex-1 space-y-4 min-w-0">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
                  </div>
                ) : vloeren.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
                    <SwatchIcon className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">
                      Geen vloeren gevonden
                    </p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([bouwdeel, verdiepingen]) => {
                    const bVloeren = Object.values(verdiepingen).flatMap((k) =>
                      Object.values(k).flat(),
                    );
                    const bBeoordeeld = bVloeren.filter(
                      (v) =>
                        beoordelingen[v.id] !== undefined &&
                        beoordelingen[v.id] !== null,
                    ).length;
                    return (
                      <CollapsibleSection
                        key={bouwdeel}
                        title={bouwdeel}
                        icon={<BuildingOffice2Icon className="w-4 h-4" />}
                        count={bVloeren.length}
                        beoordeeld={bBeoordeeld}
                      >
                        {Object.entries(verdiepingen).map(
                          ([verdieping, kamers]) => {
                            const vVloeren = Object.values(kamers).flat();
                            const vBeoordeeld = vVloeren.filter(
                              (v) =>
                                beoordelingen[v.id] !== undefined &&
                                beoordelingen[v.id] !== null,
                            ).length;
                            return (
                              <CollapsibleRow
                                key={verdieping}
                                label={verdieping}
                                icon={
                                  <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                }
                                count={vVloeren.length}
                                beoordeeld={vBeoordeeld}
                              >
                                {Object.entries(kamers).map(
                                  ([kamer, kvloeren]) => {
                                    const kBeoordeeld = kvloeren.filter(
                                      (v) =>
                                        beoordelingen[v.id] !== undefined &&
                                        beoordelingen[v.id] !== null,
                                    ).length;
                                    return (
                                      <CollapsibleRow
                                        key={kamer}
                                        label={kamer}
                                        icon={
                                          <HomeModernIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        }
                                        count={kvloeren.length}
                                        beoordeeld={kBeoordeeld}
                                        indent
                                      >
                                        {kvloeren.map((v) => (
                                          <div
                                            key={v.id}
                                            className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 bg-white"
                                          >
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-semibold text-slate-700">
                                                {v.vloertype_naam}
                                              </p>
                                              <p className="text-xs text-slate-400">
                                                {v.vierkante_meter}m²
                                              </p>
                                            </div>
                                            <BeoordelingButton
                                              value={
                                                beoordelingen[v.id] ?? null
                                              }
                                              onChange={(val) =>
                                                setBeoordeling(v.id, val)
                                              }
                                              disabled={afgerond}
                                            />
                                          </div>
                                        ))}
                                      </CollapsibleRow>
                                    );
                                  },
                                )}
                              </CollapsibleRow>
                            );
                          },
                        )}
                      </CollapsibleSection>
                    );
                  })
                )}
              </div>

              {/* RIGHT — sticky sidebar */}
              <div className="w-64 shrink-0 sticky top-0">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-5 border-b border-slate-50 space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Voortgang
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-center flex-1">
                        <p className="text-2xl font-bold text-slate-800">
                          {aantalBeoordeeld}
                          <span className="text-slate-300 text-sm font-normal">
                            /{vloeren.length}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Beoordeeld
                        </p>
                      </div>
                      <div className="w-px h-10 bg-slate-100" />
                      <div className="text-center flex-1">
                        <p
                          className={`text-2xl font-bold ${voortgangPct === 100 ? "text-emerald-600" : voortgangPct > 0 ? "text-amber-500" : "text-slate-300"}`}
                        >
                          {voortgangPct.toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Gedaan
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center bg-slate-50 rounded-xl py-2.5">
                        <p className="text-base font-bold text-slate-700">
                          {vloeren.length}
                        </p>
                        <p className="text-[10px] text-slate-400">Totaal</p>
                      </div>
                      <div className="text-center bg-emerald-50 rounded-xl py-2.5">
                        <p className="text-base font-bold text-emerald-600">
                          {aantalGoed}
                        </p>
                        <p className="text-[10px] text-emerald-500">Goed</p>
                      </div>
                      <div className="text-center bg-red-50 rounded-xl py-2.5">
                        <p className="text-base font-bold text-red-500">
                          {aantalNietGoed}
                        </p>
                        <p className="text-[10px] text-red-400">Niet goed</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    {afgerond ? (
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-700">
                            Steekproef afgerond
                          </p>
                          <p className="text-[10px] text-emerald-600">
                            Niet meer bewerkbaar
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handleOpslaan}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                            bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {saving ? (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                          )}
                          Opslaan
                        </button>
                        <button
                          onClick={handleAfronden}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                            bg-p text-white shadow-sm hover:bg-p/90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {saving ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            <BeakerIcon className="w-4 h-4" />
                          )}
                          Definitief afronden
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                          Elke klik wordt automatisch opgeslagen
                        </p>
                      </>
                    )}
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
