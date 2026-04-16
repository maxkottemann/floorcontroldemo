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
  kamer_id: string;
  kamer_naam: string;
  vloertype_naam: string;
  vierkante_meter: number;
  status: string;
  verdieping_naam?: string;
  bouwdeel_naam?: string;
}

interface Beoordeling {
  [kamervloer_id: string]: boolean | null; // true=goed, false=niet goed, null=niet beoordeeld
}

function BeoordelingButton({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer
          ${value === true ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
      >
        <CheckCircleIcon className="w-3.5 h-3.5" />
        Goed
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer
          ${value === false ? "bg-red-500 text-white border-red-500 shadow-sm" : "bg-white text-red-500 border-red-200 hover:bg-red-50"}`}
      >
        <XCircleIcon className="w-3.5 h-3.5" />
        Niet goed
      </button>
    </div>
  );
}

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

export default function SteekproevenUitvoerenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const router = useRouter();

  const [vloeren, setVloeren] = useState<VloerRij[]>([]);
  const [loading, setLoading] = useState(true);
  const [beoordelingen, setBeoordelingen] = useState<Beoordeling>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data: gwIds } = await supabase
        .from("gewassen_vloeren")
        .select("kamervloer_id")
        .eq("project_id", id);
      if (!gwIds?.length) {
        setLoading(false);
        return;
      }

      const { data: kv } = await supabase
        .from("kamer_vloeren")
        .select(
          "id, kamer_id, kamers(naam, verdiepingen(naam, bouwdeel(naam))), vloer_types(naam), vierkante_meter, status",
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
          kamer_id: km.kamer_id,
          kamer_naam: km.kamers?.naam ?? "—",
          vloertype_naam: km.vloer_types?.naam ?? "—",
          vierkante_meter: km.vierkante_meter ?? 0,
          status: km.status ?? "—",
          verdieping_naam: km.kamers?.verdiepingen?.naam ?? "—",
          bouwdeel_naam: km.kamers?.verdiepingen?.bouwdeel?.naam ?? "—",
        })),
      );

      // Load existing beoordelingen so user can resume
      const { data: existing } = await supabase
        .from("steekproeven")
        .select("kamervloer_id, goedgekeurd")
        .eq("project_id", id);

      if (existing) {
        const map: Beoordeling = {};
        for (const e of existing) map[e.kamervloer_id] = e.goedgekeurd;
        setBeoordelingen(map);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function setBeoordeling(vloerId: string, waarde: boolean) {
    setBeoordelingen((prev) => ({ ...prev, [vloerId]: waarde }));
    await supabase.from("steekproeven").upsert(
      {
        project_id: id as string,
        kamervloer_id: vloerId,
        goedgekeurd: waarde,
      },
      { onConflict: "project_id,kamervloer_id" },
    );
  }

  const aantalBeoordeeld = Object.values(beoordelingen).filter(
    (v) => v !== null,
  ).length;
  const aantalGoed = Object.values(beoordelingen).filter(
    (v) => v === true,
  ).length;
  const goedPct =
    vloeren.length > 0 ? (aantalBeoordeeld / vloeren.length) * 100 : 0;
  const alleBeoordeeld =
    vloeren.length > 0 && aantalBeoordeeld === vloeren.length;

  // Group: bouwdeel → verdieping → kamer → vloeren
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
    if (!alleBeoordeeld) {
      showToast("Beoordeel alle vloeren voor je opslaat", "error");
      return;
    }
    setSaving(true);

    const rows = vloeren.map((v) => ({
      project_id: id as string,
      kamervloer_id: v.id,
      goedgekeurd: beoordelingen[v.id] ?? null,
    }));

    const { error } = await supabase
      .from("steekproeven")
      .upsert(rows, { onConflict: "project_id,kamervloer_id" });

    if (error) {
      showToast("Opslaan mislukt, probeer opnieuw", "error");
      setSaving(false);
      return;
    }
    showToast("Steekproef opgeslagen", "success");
    setTimeout(() => router.back(), 1000);
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Steekproef uitvoeren" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Kwaliteitscontrole
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Steekproef uitvoeren
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Beoordeel elke vloer als goed of niet goed
                </p>
              </div>
              <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Voortgang
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    {aantalBeoordeeld}
                    <span className="text-slate-300 font-normal text-sm">
                      /{vloeren.length}
                    </span>
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Goedgekeurd
                  </p>
                  <p
                    className={`text-lg font-bold ${goedPct === 100 ? "text-emerald-600" : goedPct > 0 ? "text-amber-500" : "text-slate-300"}`}
                  >
                    {`${goedPct.toFixed(0)}%`}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${alleBeoordeeld ? "bg-emerald-100" : "bg-slate-100"}`}
                >
                  <BeakerIcon
                    className={`w-5 h-5 ${alleBeoordeeld ? "text-emerald-600" : "text-slate-400"}`}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : vloeren.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
                <SwatchIcon className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  Geen vloeren gevonden
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([bouwdeel, verdiepingen]) => {
                  const bVloeren = Object.values(verdiepingen).flatMap((k) =>
                    Object.values(k).flat(),
                  );
                  const bBeoordeeld = bVloeren.filter(
                    (v) => beoordelingen[v.id] !== undefined,
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
                            (v) => beoordelingen[v.id] !== undefined,
                          ).length;
                          return (
                            <div key={verdieping}>
                              {/* Verdieping subheader */}
                              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50/60 border-b border-slate-50">
                                <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  {verdieping}
                                </p>
                                <span className="text-[10px] text-slate-400 ml-auto">
                                  {vBeoordeeld}/{vVloeren.length}
                                </span>
                              </div>

                              {Object.entries(kamers).map(
                                ([kamer, kvloeren]) => (
                                  <div key={kamer}>
                                    {/* Kamer label */}
                                    <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-50">
                                      <HomeModernIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                      <p className="text-xs font-semibold text-slate-400">
                                        {kamer}
                                      </p>
                                    </div>

                                    {/* Vloer rows */}
                                    {kvloeren.map((v) => (
                                      <div
                                        key={v.id}
                                        className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0"
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
                                          value={beoordelingen[v.id] ?? null}
                                          onChange={(val) =>
                                            setBeoordeling(v.id, val)
                                          }
                                        />
                                      </div>
                                    ))}
                                  </div>
                                ),
                              )}
                            </div>
                          );
                        },
                      )}
                    </CollapsibleSection>
                  );
                })}
              </div>
            )}

            {/* Save button */}
            {!loading && vloeren.length > 0 && (
              <button
                onClick={handleOpslaan}
                disabled={!alleBeoordeeld || saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                  bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                {saving
                  ? "Opslaan..."
                  : `Steekproef afronden · ${goedPct.toFixed(0)}% goedgekeurd`}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
