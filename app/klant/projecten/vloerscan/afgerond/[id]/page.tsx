"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  MapPinIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftEllipsisIcon,
  SwatchIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

interface VloerscanVloer {
  id: string;
  kamervloer_id: string;
  oude_status: string | null;
  nieuwe_status: string | null;
  opmerkingen: string | null;
  aangemaakt_op: string;
  kamer_naam: string;
  verdieping_naam: string;
  bouwdeel_naam: string;
  vloertype_naam: string;
  vierkante_meter: number | null;
}

interface Vloerscan {
  id: string;
  naam: string;
  beschrijving: string | null;
  status: string;
  start_datum: string | null;
  eind_datum: string | null;
  extra_checkin: boolean;
  aangemaakt_op: string;
  locatie_naam: string;
  locatie_plaats: string | null;
  medewerker_naam: string | null;
  vloeren: VloerscanVloer[];
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Goed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
    },
    Matig: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    Slecht: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
  };
  const s = config[status ?? ""] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {status ?? "—"}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = "text-p",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function VloerscanResultatenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scan, setScan] = useState<Vloerscan | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterChanged, setFilterChanged] = useState(false);

  useEffect(() => {
    async function getScan() {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("vloerscans")
        .select(
          "id, naam, beschrijving, status, start_datum, eind_datum, extra_checkin, aangemaakt_op, locaties(naam, plaats), medewerkers(voornaam, achternaam)",
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        showToast("Scan kon niet worden geladen", "error");
        setLoading(false);
        return;
      }

      // Fetch vloerscan_vloeren with hierarchy
      const { data: vloerData } = await supabase
        .from("vloerscan_vloeren")
        .select(
          "id, kamervloer_id, oude_status, nieuwe_status, opmerkingen, aangemaakt_op, kamer_vloeren(vierkante_meter, vloer_types(naam), kamers(naam, verdiepingen(naam, bouwdeel(naam))))",
        )
        .eq("vloerscan_id", id)
        .order("aangemaakt_op", { ascending: true });

      setScan({
        id: data.id,
        naam: data.naam ?? "Naamloos",
        beschrijving: data.beschrijving ?? null,
        status: data.status,
        start_datum: data.start_datum,
        eind_datum: data.eind_datum,
        extra_checkin: data.extra_checkin ?? false,
        aangemaakt_op: data.aangemaakt_op,
        locatie_naam: (data.locaties as any)?.naam ?? "—",
        locatie_plaats: (data.locaties as any)?.plaats ?? null,
        medewerker_naam: data.medewerkers
          ? `${(data.medewerkers as any).voornaam} ${(data.medewerkers as any).achternaam}`
          : null,
        vloeren: (vloerData ?? []).map((v: any) => {
          const kv = v.kamer_vloeren;
          const kamer = kv?.kamers;
          const verdieping = kamer?.verdiepingen;
          const bouwdeel = verdieping?.bouwdeel;
          return {
            id: v.id,
            kamervloer_id: v.kamervloer_id,
            oude_status: v.oude_status,
            nieuwe_status: v.nieuwe_status,
            opmerkingen: v.opmerkingen ?? null,
            aangemaakt_op: v.aangemaakt_op,
            kamer_naam: kamer?.naam ?? "—",
            verdieping_naam: verdieping?.naam ?? "—",
            bouwdeel_naam: bouwdeel?.naam ?? "—",
            vloertype_naam: kv?.vloer_types?.naam ?? "Onbekend",
            vierkante_meter: kv?.vierkante_meter ?? null,
          };
        }),
      });
      setLoading(false);
    }
    getScan();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex bg-[#F5F6FA]">
        <Sidebar
          className="fixed top-0 left-0 h-screen"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-col flex-1 h-screen">
          <Topbar
            title="Scanresultaten"
            onMenuToggle={() => setSidebarOpen((p) => !p)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );

  if (!scan) return null;

  const totalVloeren = scan.vloeren.length;
  const changedVloeren = scan.vloeren.filter(
    (v) => v.oude_status !== v.nieuwe_status,
  );
  const vloerMetOpmerkingen = scan.vloeren.filter((v) => v.opmerkingen);
  const totalM2 = scan.vloeren.reduce(
    (s, v) => s + (v.vierkante_meter ?? 0),
    0,
  );

  const statusCounts: Record<string, number> = {};
  for (const v of scan.vloeren) {
    const s = v.nieuwe_status ?? "—";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  const displayed = filterChanged ? changedVloeren : scan.vloeren;

  // Group by bouwdeel
  const grouped: Record<string, Record<string, VloerscanVloer[]>> = {};
  for (const v of displayed) {
    if (!grouped[v.bouwdeel_naam]) grouped[v.bouwdeel_naam] = {};
    if (!grouped[v.bouwdeel_naam][v.verdieping_naam])
      grouped[v.bouwdeel_naam][v.verdieping_naam] = [];
    grouped[v.bouwdeel_naam][v.verdieping_naam].push(v);
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Scanresultaten"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="space-y-4 md:space-y-6">
            {/* Back + header */}
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                    Scanresultaten
                  </p>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                    {scan.naam}
                  </h1>
                  {scan.beschrijving && (
                    <p className="text-sm text-slate-400 mt-1">
                      {scan.beschrijving}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {scan.locatie_naam}
                        {scan.locatie_plaats ? ` · ${scan.locatie_plaats}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {formatDate(scan.start_datum)}
                        {scan.eind_datum && scan.eind_datum !== scan.start_datum
                          ? ` — ${formatDate(scan.eind_datum)}`
                          : ""}
                      </span>
                    </div>
                    {scan.medewerker_naam && (
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-500">
                          {scan.medewerker_naam}
                        </span>
                      </div>
                    )}
                    {scan.extra_checkin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Aanmeldprocedure
                      </span>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                  <CheckCircleIcon className="w-4 h-4" />
                  Afgerond
                </span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Vloeren gescand"
                value={totalVloeren}
                sub="totaal bekeken"
                color="text-p"
              />
              <StatCard
                label="Gewijzigd"
                value={changedVloeren.length}
                sub="status veranderd"
                color="text-amber-600"
              />
              <StatCard
                label="Met opmerkingen"
                value={vloerMetOpmerkingen.length}
                sub="opmerkingen gemaakt"
                color="text-slate-700"
              />
              <StatCard
                label="Totaal oppervlak"
                value={`${totalM2.toFixed(0)}m²`}
                sub="gescand"
                color="text-emerald-600"
              />
            </div>

            {/* Status breakdown */}
            {Object.keys(statusCounts).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Resultaat per status
                </p>
                <div className="flex flex-col gap-3">
                  {Object.entries(statusCounts).map(([status, count]) => {
                    const pct =
                      totalVloeren > 0 ? (count / totalVloeren) * 100 : 0;
                    const barColor =
                      status === "Goed"
                        ? "bg-emerald-400"
                        : status === "Matig"
                          ? "bg-amber-400"
                          : status === "Slecht"
                            ? "bg-red-400"
                            : "bg-slate-300";
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={status} />
                            <span className="text-xs text-slate-500">
                              {count} vloer{count !== 1 ? "en" : ""}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Opmerkingen overview */}
            {vloerMetOpmerkingen.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 md:px-5 py-4 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      Opmerkingen
                    </h2>
                    <p className="text-xs text-slate-400">
                      {vloerMetOpmerkingen.length} vloer
                      {vloerMetOpmerkingen.length !== 1 ? "en" : ""} met
                      opmerkingen
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {vloerMetOpmerkingen.map((v) => (
                    <div key={v.id} className="px-4 md:px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700">
                            {v.vloertype_naam}
                          </span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-xs text-slate-400">
                            {v.kamer_naam}
                          </span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-xs text-slate-400">
                            {v.bouwdeel_naam} · {v.verdieping_naam}
                          </span>
                        </div>
                        <StatusBadge status={v.nieuwe_status} />
                      </div>
                      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                        <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                          {v.opmerkingen}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vloer detail table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-slate-50 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                    <SwatchIcon className="w-4 h-4 text-p" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">
                      Vloerdetails
                    </h2>
                    <p className="text-xs text-slate-400">
                      {displayed.length} van {totalVloeren} vloeren
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterChanged((p) => !p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${filterChanged ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                >
                  {filterChanged ? "Toon alle" : "Alleen gewijzigd"}
                </button>
              </div>

              {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardDocumentCheckIcon className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">
                    Geen gewijzigde vloeren
                  </p>
                </div>
              ) : (
                <div>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                            Vloer
                          </th>
                          <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-48">
                            Locatie
                          </th>
                          <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                            Voor
                          </th>
                          <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3 w-28">
                            Na
                          </th>
                          <th className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 px-5 py-3">
                            Opmerking
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {Object.entries(grouped).map(
                          ([bouwdeel, verdiepingen]) => (
                            <>
                              {/* Bouwdeel header */}
                              <tr
                                key={`bd-${bouwdeel}`}
                                className="bg-slate-50/80"
                              >
                                <td colSpan={5} className="px-5 py-2">
                                  <div className="flex items-center gap-2">
                                    <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">
                                      {bouwdeel}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                              {Object.entries(verdiepingen).map(
                                ([verdieping, vloeren]) =>
                                  vloeren.map((v, vi) => {
                                    const changed =
                                      v.oude_status !== v.nieuwe_status;
                                    return (
                                      <tr
                                        key={v.id}
                                        className={`group ${changed ? "hover:bg-amber-50/30" : "hover:bg-slate-50/60"}`}
                                      >
                                        <td className="px-5 py-3.5">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                              <SwatchIcon className="w-3.5 h-3.5 text-p" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-slate-800">
                                                {v.vloertype_naam}
                                              </p>
                                              {v.vierkante_meter && (
                                                <p className="text-xs text-slate-400">
                                                  {v.vierkante_meter}m²
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                          <div className="flex items-center gap-1.5">
                                            <HomeModernIcon className="w-3 h-3 text-slate-300 shrink-0" />
                                            <div>
                                              <p className="text-xs font-medium text-slate-600">
                                                {v.kamer_naam}
                                              </p>
                                              <p className="text-xs text-slate-400">
                                                {verdieping}
                                              </p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                          <StatusBadge status={v.oude_status} />
                                        </td>
                                        <td className="px-5 py-3.5">
                                          <div className="flex items-center gap-2">
                                            {changed && (
                                              <ArrowRightIcon className="w-3 h-3 text-amber-400 shrink-0" />
                                            )}
                                            <StatusBadge
                                              status={v.nieuwe_status}
                                            />
                                          </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                          {v.opmerkingen ? (
                                            <p className="text-xs text-slate-500 max-w-xs truncate">
                                              {v.opmerkingen}
                                            </p>
                                          ) : (
                                            <span className="text-xs text-slate-200">
                                              —
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }),
                              )}
                            </>
                          ),
                        )}
                      </tbody>
                    </table>
                    <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                      <p className="text-xs text-slate-400">
                        {displayed.length} vloer
                        {displayed.length !== 1 ? "en" : ""} ·{" "}
                        {changedVloeren.length} gewijzigd
                      </p>
                    </div>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-slate-50">
                    {Object.entries(grouped).map(([bouwdeel, verdiepingen]) => (
                      <div key={bouwdeel}>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80">
                          <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">
                            {bouwdeel}
                          </span>
                        </div>
                        {Object.entries(verdiepingen).map(
                          ([verdieping, vloeren]) =>
                            vloeren.map((v) => {
                              const changed = v.oude_status !== v.nieuwe_status;
                              return (
                                <div
                                  key={v.id}
                                  className={`px-4 py-3.5 ${changed ? "bg-amber-50/20" : ""}`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-p/10 flex items-center justify-center shrink-0">
                                        <SwatchIcon className="w-3.5 h-3.5 text-p" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                          {v.vloertype_naam}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                          <HomeModernIcon className="w-3 h-3 text-slate-300" />
                                          <p className="text-xs text-slate-400">
                                            {v.kamer_naam} · {verdieping}
                                          </p>
                                          {v.vierkante_meter && (
                                            <span className="text-xs text-slate-300">
                                              · {v.vierkante_meter}m²
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <StatusBadge status={v.oude_status} />
                                    {changed && (
                                      <ArrowRightIcon className="w-3 h-3 text-amber-400" />
                                    )}
                                    {changed && (
                                      <StatusBadge status={v.nieuwe_status} />
                                    )}
                                  </div>
                                  {v.opmerkingen && (
                                    <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                                      <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                      <p className="text-xs text-amber-700">
                                        {v.opmerkingen}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            }),
                        )}
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-slate-50/40">
                      <p className="text-xs text-slate-400 text-center">
                        {displayed.length} vloer
                        {displayed.length !== 1 ? "en" : ""} ·{" "}
                        {changedVloeren.length} gewijzigd
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
