"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Locatie } from "@/types/locatie";
import { useRouter } from "next/navigation";
import MultiSelect from "@/components/layout/multiselect";
import { formatNumber } from "@/lib/utils";
import {
  MapPinIcon,
  SwatchIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

interface VloerRij {
  id: string;
  vloertype_naam: string;
  vierkante_meter: number;
  status: string;
  kamer_naam: string;
  kamer_ruimtefunctie: string | null;
  verdieping_naam: string;
  bouwdeel_naam: string;
  laatste_wasbeurt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Goed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700 w-fit",
      border: "border-emerald-100",
    },
    Matig: {
      bg: "bg-amber-50",
      text: "text-amber-700 w-fit",
      border: "border-amber-100",
    },
    Slecht: {
      bg: "bg-red-50",
      text: "text-red-700 w-fit",
      border: "border-red-100",
    },
  };
  const s = config[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500 w-fit",
    border: "border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {status ?? "—"}
    </span>
  );
}

function formatDate(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Step 1: Locatie picker ─────────────────────────────────────────────────

function LocatiePicker({
  locaties,
  onSelect,
}: {
  locaties: Locatie[];
  onSelect: (l: Locatie) => void;
}) {
  const [zoek, setZoek] = useState("");
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterPerceel, setFilterPerceel] = useState<string[]>([]);

  const uniqueTypes = [
    ...new Set(locaties.map((l) => l.type).filter(Boolean)),
  ].sort() as string[];
  const uniquePercelen = [
    ...new Set(locaties.map((l) => l.perceel).filter(Boolean)),
  ].sort() as string[];

  const filtered = locaties.filter((l) => {
    const matchZoek =
      l.naam.toLowerCase().includes(zoek.toLowerCase()) ||
      (l.plaats ?? "").toLowerCase().includes(zoek.toLowerCase());
    const matchType = filterType.length
      ? filterType.includes(l.type ?? "")
      : true;
    const matchPerceel = filterPerceel.length
      ? filterPerceel.includes(l.perceel ?? "")
      : true;
    return matchZoek && matchType && matchPerceel;
  });

  const grouped: Record<string, Locatie[]> = {};
  for (const l of filtered) {
    const key = l.perceel ?? "Overig";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(l);
  }
  const activeFilters = filterType.length + filterPerceel.length;

  return (
    <div className="h-full flex flex-col gap-4 md:gap-5">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
          Vloerpaspoort
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Kies een locatie
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {filtered.length} van {locaties.length} locaties
        </p>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 md:px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 md:flex-wrap shrink-0">
        <div className="relative flex-1 min-w-0 md:min-w-[220px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op naam of plaats..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {uniqueTypes.length > 1 && (
            <div className="flex items-center gap-1.5">
              {uniqueTypes.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setFilterType((prev) =>
                      prev.includes(t)
                        ? prev.filter((x) => x !== t)
                        : [...prev, t],
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${filterType.includes(t) ? "bg-p text-white border-p" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {uniquePercelen.length > 1 && (
            <MultiSelect
              title="Perceel"
              options={uniquePercelen}
              selected={filterPerceel}
              onChange={setFilterPerceel}
            />
          )}
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setFilterType([]);
                setFilterPerceel([]);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Wissen
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 md:space-y-6 pb-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([perceel, locs]) => (
            <div key={perceel}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">
                {perceel}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {locs.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => onSelect(l)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-p/30 hover:shadow-md transition-all cursor-pointer p-4 group active:bg-slate-50"
                  >
                    <div className="w-9 h-9 rounded-xl bg-p/10 group-hover:bg-p/20 flex items-center justify-center mb-3 transition-colors">
                      <BuildingOfficeIcon className="w-5 h-5 text-p" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-p transition-colors leading-tight">
                      {l.naam}
                    </p>
                    {l.plaats && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {l.plaats}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3">
                      {l.type && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {l.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPinIcon className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-400">Geen locaties gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Vloer table ────────────────────────────────────────────────────

function VloerTable({
  locatie,
  vloeren,
  loading,
  onBack,
  router,
}: {
  locatie: Locatie;
  vloeren: VloerRij[];
  loading: boolean;
  onBack: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [zoekterm, setZoekterm] = useState("");
  const [filterStatussen, setFilterStatussen] = useState<string[]>([]);
  const [filterVloertypes, setFilterVloertypes] = useState<string[]>([]);
  const [filterGebouwen, setFilterGebouwen] = useState<string[]>([]);
  const [filterVerdiepingen, setFilterVerdiepingen] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "naam" | "status" | "laatste_wasbeurt" | "verdieping" | "gebouw"
  >("naam");

  const uniqueVloertypes = [
    ...new Set(vloeren.map((v) => v.vloertype_naam).filter(Boolean)),
  ];
  const uniqueGebouwen = [
    ...new Set(vloeren.map((v) => v.bouwdeel_naam).filter(Boolean)),
  ];
  const uniqueVerdiepingen = [
    ...new Set(vloeren.map((v) => v.verdieping_naam).filter(Boolean)),
  ];

  const filtered = vloeren
    .filter((v) => {
      const matchZoek = [
        v.vloertype_naam,
        v.kamer_naam,
        v.verdieping_naam,
        v.bouwdeel_naam,
      ].some((f) => f?.toLowerCase().includes(zoekterm.toLowerCase()));
      const matchStatus = filterStatussen.length
        ? filterStatussen.includes(v.status)
        : true;
      const matchType = filterVloertypes.length
        ? filterVloertypes.includes(v.vloertype_naam)
        : true;
      const matchGebouw = filterGebouwen.length
        ? filterGebouwen.includes(v.bouwdeel_naam)
        : true;
      const matchVerdieping = filterVerdiepingen.length
        ? filterVerdiepingen.includes(v.verdieping_naam)
        : true;
      return (
        matchZoek && matchStatus && matchType && matchGebouw && matchVerdieping
      );
    })
    .sort((a, b) => {
      if (sortBy === "status") {
        const o = { Goed: 0, Matig: 1, Slecht: 2 };
        return (
          (o[a.status as keyof typeof o] ?? 3) -
          (o[b.status as keyof typeof o] ?? 3)
        );
      }
      if (sortBy === "laatste_wasbeurt") {
        if (!a.laatste_wasbeurt) return 1;
        if (!b.laatste_wasbeurt) return -1;
        return (
          new Date(b.laatste_wasbeurt).getTime() -
          new Date(a.laatste_wasbeurt).getTime()
        );
      }
      if (sortBy === "gebouw")
        return a.bouwdeel_naam.localeCompare(b.bouwdeel_naam);
      if (sortBy === "verdieping")
        return a.verdieping_naam.localeCompare(b.verdieping_naam);
      return a.vloertype_naam.localeCompare(b.vloertype_naam);
    });

  const activeVloerFilters =
    filterStatussen.length +
    filterVloertypes.length +
    filterGebouwen.length +
    filterVerdiepingen.length;

  return (
    <div className="h-full flex flex-col gap-4 md:gap-5">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Alle locaties</span>
        </button>
        <div className="w-px h-5 bg-slate-200 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 hidden sm:block">
              Vloerpaspoort
            </p>
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {locatie.naam}
            </h1>
            {locatie.plaats && (
              <p className="text-sm text-slate-400 hidden sm:block">
                {locatie.plaats}
              </p>
            )}
          </div>
        </div>
        {locatie.extra_checkin && (
          <div className=" items-center gap-2 px-3 h-10 mt-0 bg-amber-50 border border-amber-100 rounded-lg shadow-sm hidden md:inline-flex">
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                Aanmeldprocedure
              </span>
              <span className="text-sm font-bold text-amber-700">
                {locatie.extra_checkin}
              </span>
            </div>
          </div>
        )}
        <span className="text-xs text-slate-400 font-medium shrink-0">
          {filtered.length} vloeren
        </span>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-3 md:px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 md:flex-wrap shrink-0">
        <div className="relative flex-1 min-w-0 md:min-w-[180px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek op vloertype, kamer..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {["Goed", "Matig", "Slecht"].map((s) => {
              const active = filterStatussen.includes(s);
              const colors: Record<string, string> = {
                Goed: active
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50",
                Matig: active
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
                Slecht: active
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-red-600 border-red-200 hover:bg-red-50",
              };
              return (
                <button
                  key={s}
                  onClick={() =>
                    setFilterStatussen((prev) =>
                      prev.includes(s)
                        ? prev.filter((x) => x !== s)
                        : [...prev, s],
                    )
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${colors[s]}`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {uniqueVloertypes.length > 0 && (
            <MultiSelect
              title="Vloertype"
              options={uniqueVloertypes}
              selected={filterVloertypes}
              onChange={setFilterVloertypes}
            />
          )}
          {uniqueGebouwen.length > 0 && (
            <MultiSelect
              title="Gebouw"
              options={uniqueGebouwen}
              selected={filterGebouwen}
              onChange={setFilterGebouwen}
            />
          )}
          {uniqueVerdiepingen.length > 0 && (
            <MultiSelect
              title="Verdieping"
              options={uniqueVerdiepingen}
              selected={filterVerdiepingen}
              onChange={setFilterVerdiepingen}
            />
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="naam">Naam</option>
            <option value="status">Status</option>
            <option value="laatste_onderhoud">Wasbeurt</option>
            <option value="gebouw">Gebouw</option>
            <option value="verdieping">Verdieping</option>
          </select>

          {activeVloerFilters > 0 && (
            <button
              onClick={() => {
                setFilterStatussen([]);
                setFilterVloertypes([]);
                setFilterGebouwen([]);
                setFilterVerdiepingen([]);
                setZoekterm("");
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-3.5 h-3.5" /> Wissen
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.9fr_140px_40px] px-6 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          {[
            "Vloertype",
            "Kamer",
            "Gebouw · Verdieping",
            "Functie",
            "Status",
            "Laatste onderhoud",
            "",
          ].map((h) => (
            <p
              key={h}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
            >
              {h}
            </p>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SwatchIcon className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400 font-medium">
                Geen vloeren gevonden
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Pas de filters aan
              </p>
            </div>
          ) : (
            filtered.map((v) => (
              <div
                key={v.id}
                onClick={() =>
                  router.push(`/klant/vloerenpaspoort/bekijken/${v.id}`)
                }
                className="cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors group"
              >
                <div className="hidden md:grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.9fr_140px_40px] items-center px-6 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0 group-hover:bg-p/15 transition-colors">
                      <SwatchIcon className="w-4 h-4 text-p" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-p transition-colors">
                          {v.vloertype_naam}
                        </p>
                        <span className="text-xs font-bold text-p/70 bg-p/8 px-1.5 py-0.5 rounded shrink-0">
                          {formatNumber(v.vierkante_meter)}m²
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <HomeModernIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <p className="text-sm text-slate-600 font-medium truncate">
                      {v.kamer_naam}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-slate-600 font-medium truncate">
                      {v.bouwdeel_naam}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Square3Stack3DIcon className="w-3 h-3 text-slate-300 shrink-0" />
                      <p className="text-xs text-slate-400 truncate">
                        {v.verdieping_naam}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    {v.kamer_ruimtefunctie ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 truncate max-w-full">
                        {v.kamer_ruimtefunctie}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  <StatusBadge status={v.status} />

                  <div className="flex items-center gap-1.5">
                    {v.laatste_wasbeurt ? (
                      <>
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-slate-600">
                          {formatDate(v.laatste_wasbeurt)}
                        </p>
                      </>
                    ) : (
                      <>
                        <ClockIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <p className="text-xs text-slate-300">Nog niet</p>
                      </>
                    )}
                  </div>

                  <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p transition-colors justify-self-end" />
                </div>
                {/* Mobile card row */}
                <div className="md:hidden flex items-start gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0 mt-0.5">
                    <SwatchIcon className="w-4 h-4 text-p" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-p transition-colors">
                        {v.vloertype_naam}
                      </p>
                      <span className="text-xs font-bold text-p/70 bg-p/8 px-1.5 py-0.5 rounded shrink-0">
                        {formatNumber(v.vierkante_meter)}m²
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <HomeModernIcon className="w-3 h-3 text-slate-300 shrink-0" />
                        <p className="text-xs text-slate-400">{v.kamer_naam}</p>
                      </div>
                      <span className="text-slate-200 text-xs">·</span>
                      <p className="text-xs text-slate-400">
                        {v.bouwdeel_naam}
                      </p>
                      <span className="text-slate-200 text-xs">·</span>
                      <p className="text-xs text-slate-400">
                        {v.verdieping_naam}
                      </p>
                      {v.kamer_ruimtefunctie && (
                        <>
                          <span className="text-slate-200 text-xs">·</span>
                          <span className="text-xs text-slate-400">
                            {v.kamer_ruimtefunctie}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={v.status} />
                      {v.laatste_wasbeurt ? (
                        <span className="text-xs text-emerald-600 font-medium">
                          {formatDate(v.laatste_wasbeurt)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">
                          Nog niet gewassen
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p shrink-0 mt-1 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function VloerenPaspoortPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie | null>(null);
  const [vloeren, setVloeren] = useState<VloerRij[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,plaats,adres,contact_persoon,telefoonnummer,percelen(naam),extra_checkin",
        )
        .order("naam", { ascending: true });
      if (!data) return;
      setLocaties(
        data.map((d) => ({
          id: d.id,
          naam: d.naam,
          type: d.type,
          plaats: d.plaats,
          adres: d.adres,
          contact_persoon: d.contact_persoon,
          telefoonnummer: d.telefoonnummer,
          perceel: (d.percelen as any)?.naam,
          extra_checkin: d.extra_checkin,
        })),
      );
    }
    getLocaties();
  }, []);

  useEffect(() => {
    async function getVloeren() {
      if (!selectedLocatie) {
        setVloeren([]);
        return;
      }
      setLoading(true);
      setVloeren([]);
      const { data: bouwdelen } = await supabase
        .from("bouwdeel")
        .select("id,naam")
        .eq("locatie_id", selectedLocatie.id);
      if (!bouwdelen?.length) {
        setLoading(false);
        return;
      }
      const { data: verdiepingen } = await supabase
        .from("verdiepingen")
        .select("id,naam,bouwdeel_id")
        .in(
          "bouwdeel_id",
          bouwdelen.map((b) => b.id),
        );
      if (!verdiepingen?.length) {
        setLoading(false);
        return;
      }
      const { data: kamers } = await supabase
        .from("kamers")
        .select("id,naam,verdieping_id,ruimtefunctie")
        .in(
          "verdieping_id",
          verdiepingen.map((v) => v.id),
        );
      if (!kamers?.length) {
        setLoading(false);
        return;
      }
      const { data: kamerVloeren } = await supabase
        .from("kamer_vloeren")
        .select("id,kamer_id,vierkante_meter,status,vloer_types(naam)")
        .in(
          "kamer_id",
          kamers.map((k) => k.id),
        );
      if (!kamerVloeren?.length) {
        setLoading(false);
        return;
      }
      const vloerIds = kamerVloeren.map((v) => v.id);
      const { data: wasbeurten } = await supabase
        .from("gewassen_vloeren")
        .select("kamervloer_id,aangemaakt_op")
        .in("kamervloer_id", vloerIds)
        .order("aangemaakt_op", { ascending: false });
      const bouwdeelMap = Object.fromEntries(
        bouwdelen.map((b) => [b.id, b.naam]),
      );
      const verdiepingMap = Object.fromEntries(
        verdiepingen.map((v) => [
          v.id,
          { naam: v.naam, bouwdeel_id: v.bouwdeel_id },
        ]),
      );
      const kamerMap = Object.fromEntries(
        kamers.map((k) => [
          k.id,
          {
            naam: k.naam,
            verdieping_id: k.verdieping_id,
            ruimtefunctie: k.ruimtefunctie,
          },
        ]),
      );
      const latestWasMap: Record<string, string> = {};
      for (const w of wasbeurten ?? []) {
        if (!latestWasMap[w.kamervloer_id])
          latestWasMap[w.kamervloer_id] = w.aangemaakt_op;
      }
      setVloeren(
        kamerVloeren.map((v) => {
          const kamer = kamerMap[v.kamer_id];
          const verdieping = verdiepingMap[kamer?.verdieping_id];
          const bouwdeel = bouwdeelMap[verdieping?.bouwdeel_id];
          return {
            id: v.id,
            vloertype_naam: (v.vloer_types as any)?.naam ?? "Onbekend",
            vierkante_meter: v.vierkante_meter,
            status: v.status ?? "onbekend",
            kamer_naam: kamer?.naam ?? "—",
            kamer_ruimtefunctie: kamer?.ruimtefunctie ?? null,
            verdieping_naam: verdieping?.naam ?? "—",
            bouwdeel_naam: bouwdeel ?? "—",
            laatste_wasbeurt: latestWasMap[v.id] ?? null,
          };
        }),
      );
      setLoading(false);
    }
    getVloeren();
  }, [selectedLocatie]);

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
          title="Vloerpaspoort"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-hidden p-3 md:p-8">
          {selectedLocatie ? (
            <VloerTable
              locatie={selectedLocatie}
              vloeren={vloeren}
              loading={loading}
              onBack={() => setSelectedLocatie(null)}
              router={router}
            />
          ) : (
            <LocatiePicker locaties={locaties} onSelect={setSelectedLocatie} />
          )}
        </main>
      </div>
    </div>
  );
}
