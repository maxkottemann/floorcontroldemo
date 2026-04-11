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
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

interface VloerRij {
  id: string;
  vloertype_naam: string;
  vierkante_meter: number;
  status: string;
  kamer_naam: string;
  verdieping_naam: string;
  bouwdeel_naam: string;
  laatste_wasbeurt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Goed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700 w-15",
      border: "border-emerald-100",
    },
    Matig: {
      bg: "bg-amber-50 ",
      text: "text-amber-700 w-15",
      border: "border-amber-100",
    },
    Slecht: {
      bg: "bg-red-50",
      text: "text-red-700 w-15",
      border: "border-red-100",
    },
  };
  const s = config[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
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

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MultiCheckGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val],
    );
  };

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {options.map((opt) => {
          const isChecked = selected.includes(opt);
          return (
            <label
              key={opt}
              onClick={() => toggle(opt)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors
                ${isChecked ? "bg-p/8" : "hover:bg-slate-50"}`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
                ${isChecked ? "bg-p border-p" : "border-slate-300 bg-white"}`}
              >
                {isChecked && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-sm font-medium ${isChecked ? "text-p" : "text-slate-600"}`}
              >
                {opt}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function VloerenPaspoortPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();

  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [selectedLocatieIds, setSelectedLocatieIds] = useState<string[]>([]);
  const [locatieZoek, setLocatieZoek] = useState("");
  const [vloeren, setVloeren] = useState<VloerRij[]>([]);
  const [loading, setLoading] = useState(false);

  // Locatie-level multi filters
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterPercelen, setFilterPercelen] = useState<string[]>([]);

  // Vloer-level multi filters
  const [zoekterm, setZoekterm] = useState("");
  const [filterStatussen, setFilterStatussen] = useState<string[]>([]);
  const [filterVloertypes, setFilterVloertypes] = useState<string[]>([]);
  const [filterGebouwen, setFilterGebouwen] = useState<string[]>([]);
  const [filterVerdiepingen, setFilterVerdiepingen] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "naam" | "status" | "laatste_wasbeurt" | "verdieping" | "gebouw"
  >("naam");

  useEffect(() => {
    async function getLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,plaats,adres,contact_persoon,telefoonnummer,percelen(naam)",
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
        })),
      );
    }
    getLocaties();
  }, []);

  useEffect(() => {
    async function getVloeren() {
      if (!selectedLocatieIds.length) {
        setVloeren([]);
        return;
      }
      setLoading(true);
      setVloeren([]);

      const allRows: VloerRij[] = [];

      for (const locatieId of selectedLocatieIds) {
        const { data: bouwdelen } = await supabase
          .from("bouwdeel")
          .select("id,naam")
          .eq("locatie_id", locatieId);
        if (!bouwdelen?.length) continue;

        const { data: verdiepingen } = await supabase
          .from("verdiepingen")
          .select("id,naam,bouwdeel_id")
          .in(
            "bouwdeel_id",
            bouwdelen.map((b) => b.id),
          );
        if (!verdiepingen?.length) continue;

        const { data: kamers } = await supabase
          .from("kamers")
          .select("id,naam,verdieping_id")
          .in(
            "verdieping_id",
            verdiepingen.map((v) => v.id),
          );
        if (!kamers?.length) continue;

        const { data: kamerVloeren } = await supabase
          .from("kamer_vloeren")
          .select("id,kamer_id,vierkante_meter,status,vloer_types(naam)")
          .in(
            "kamer_id",
            kamers.map((k) => k.id),
          );
        if (!kamerVloeren?.length) continue;

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
            { naam: k.naam, verdieping_id: k.verdieping_id },
          ]),
        );

        const latestWasMap: Record<string, string> = {};
        for (const w of wasbeurten ?? []) {
          if (!latestWasMap[w.kamervloer_id])
            latestWasMap[w.kamervloer_id] = w.aangemaakt_op;
        }

        for (const v of kamerVloeren) {
          const kamer = kamerMap[v.kamer_id];
          const verdieping = verdiepingMap[kamer?.verdieping_id];
          const bouwdeel = bouwdeelMap[verdieping?.bouwdeel_id];
          allRows.push({
            id: v.id,
            vloertype_naam: (v.vloer_types as any)?.naam ?? "Onbekend",
            vierkante_meter: v.vierkante_meter,
            status: v.status ?? "onbekend",
            kamer_naam: kamer?.naam ?? "—",
            verdieping_naam: verdieping?.naam ?? "—",
            bouwdeel_naam: bouwdeel ?? "—",
            laatste_wasbeurt: latestWasMap[v.id] ?? null,
          });
        }
      }

      setVloeren(allRows);
      setLoading(false);
    }
    getVloeren();
  }, [selectedLocatieIds]);

  // Derived unique values for vloer filters
  const uniqueVloertypes = [
    ...new Set(vloeren.map((v) => v.vloertype_naam).filter(Boolean)),
  ];
  const uniqueGebouwen = [
    ...new Set(vloeren.map((v) => v.bouwdeel_naam).filter(Boolean)),
  ];
  const uniqueVerdiepingen = [
    ...new Set(vloeren.map((v) => v.verdieping_naam).filter(Boolean)),
  ];

  // Derived unique values for locatie filters
  const uniqueTypes = [...new Set(locaties.map((l) => l.type).filter(Boolean))];
  const uniquePercelen = [
    ...new Set(locaties.map((l) => l.perceel).filter(Boolean)),
  ];

  // Filter locaties
  const filteredLocaties = locaties.filter((l) => {
    const matchZoek =
      l.naam.toLowerCase().includes(locatieZoek.toLowerCase()) ||
      (l.plaats ?? "").toLowerCase().includes(locatieZoek.toLowerCase());
    const matchType = filterTypes.length
      ? filterTypes.includes(l.type ?? "")
      : true;
    const matchPerceel = filterPercelen.length
      ? filterPercelen.includes(l.perceel ?? "")
      : true;
    return matchZoek && matchType && matchPerceel;
  });

  const toggleLocatie = (id: string) => {
    setSelectedLocatieIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  // Filter vloeren
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
        const order = { Goed: 0, Matig: 1, Slecht: 2 };
        return (
          (order[a.status as keyof typeof order] ?? 3) -
          (order[b.status as keyof typeof order] ?? 3)
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

  const activeLocatieFilters = filterTypes.length + filterPercelen.length;
  const activeVloerFilters =
    filterStatussen.length +
    filterVloertypes.length +
    filterGebouwen.length +
    filterVerdiepingen.length;

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Vloerpaspoort" />

        <main className="flex-1 overflow-hidden p-8">
          <div className="h-full flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Overzicht
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Vloerpaspoort
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Selecteer locaties en bekijk alle vloeren
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="font-semibold text-p">
                  {selectedLocatieIds.length}
                </span>{" "}
                locatie{selectedLocatieIds.length !== 1 ? "s" : ""} geselecteerd
                ·<span className="font-semibold text-p">{filtered.length}</span>{" "}
                vloeren
              </div>
            </div>

            {/* 3-column layout */}
            <div className="flex-1 grid grid-cols-[280px_1fr] gap-5 min-h-0">
              {/* LEFT — filter + locatie sidebar */}
              <div className="flex flex-col gap-3 min-h-0">
                {/* Locatie search */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      value={locatieZoek}
                      onChange={(e) => setLocatieZoek(e.target.value)}
                      placeholder="Zoek locatie..."
                      className="w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                    />
                  </div>
                </div>

                {/* Locatie filters */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">
                        Locatie filters
                      </p>
                    </div>
                    {activeLocatieFilters > 0 && (
                      <button
                        onClick={() => {
                          setFilterTypes([]);
                          setFilterPercelen([]);
                        }}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold flex items-center gap-1"
                      >
                        <XMarkIcon className="w-3 h-3" /> Wissen
                      </button>
                    )}
                  </div>

                  {uniqueTypes.length > 0 && (
                    <MultiCheckGroup
                      label="Type"
                      options={uniqueTypes as string[]}
                      selected={filterTypes}
                      onChange={setFilterTypes}
                    />
                  )}

                  {uniquePercelen.length > 0 && (
                    <MultiCheckGroup
                      label="Perceel"
                      options={uniquePercelen as string[]}
                      selected={filterPercelen}
                      onChange={setFilterPercelen}
                    />
                  )}
                </div>

                {/* Locatie list */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b border-slate-50 shrink-0">
                    <p className="text-xs font-bold text-slate-500">
                      {filteredLocaties.length} locaties
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {filteredLocaties.map((l) => {
                      const isSelected = selectedLocatieIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLocatie(l.id)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-l-2
                            ${isSelected ? "bg-p/5 border-l-p" : "border-l-transparent hover:bg-slate-50"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
                            ${isSelected ? "bg-p border-p" : "border-slate-300 bg-white"}`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${isSelected ? "text-p" : "text-slate-700"}`}
                            >
                              {l.naam}
                            </p>
                            {l.plaats && (
                              <p className="text-xs text-slate-400 truncate">
                                {l.plaats}
                              </p>
                            )}
                          </div>
                          {l.type && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {l.type}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT — vloer filters + table */}
              <div className="flex flex-col gap-4 min-h-0">
                {!selectedLocatieIds.length ? (
                  <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <MapPinIcon className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-400">
                      Geen locatie geselecteerd
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      Selecteer één of meerdere locaties
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap shrink-0">
                      <div className="relative flex-1 min-w-[180px]">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          value={zoekterm}
                          onChange={(e) => setZoekterm(e.target.value)}
                          placeholder="Zoek op vloertype, kamer, gebouw..."
                          className="w-full pl-9 pr-4 py-2 text-slate-700 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
                        />
                      </div>

                      <div className="w-px h-6 bg-slate-100" />

                      <div className="flex items-center gap-1.5">
                        {["goed", "matig", "slecht"].map((s) => {
                          const active = filterStatussen.includes(s);
                          const colors: Record<string, string> = {
                            goed: active
                              ? "bg-emerald-500 text-white border-emerald-500"
                              : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50",
                            matig: active
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
                            slecht: active
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
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${colors[s]}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-px h-6 bg-slate-100" />

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
                        className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 outline-none focus:border-p/40 transition-all"
                      >
                        <option value="naam">Naam</option>
                        <option value="status">Status</option>
                        <option value="laatste_wasbeurt">
                          Laatste wasbeurt
                        </option>
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
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" /> Wissen
                        </button>
                      )}

                      <span className="ml-auto text-xs text-slate-400 font-medium shrink-0">
                        {filtered.length} vloeren
                      </span>
                    </div>

                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                      <div className="grid grid-cols-[1fr_180px_100px_160px_40px] px-6 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
                        {[
                          "Vloer & kamer",
                          "Gebouw · Verdieping",
                          "Status",
                          "Laatste wasbeurt",
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
                                router.push(`/vloerenpaspoort/bekijken/${v.id}`)
                              }
                              className="grid grid-cols-[1fr_180px_100px_160px_40px] items-center px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0 group-hover:bg-p/15 transition-colors">
                                  <SwatchIcon className="w-4 h-4 text-p" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-p transition-colors">
                                    {v.vloertype_naam}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <HomeModernIcon className="w-3 h-3 text-slate-300 shrink-0" />
                                    <p className="text-xs text-slate-400 truncate">
                                      {v.kamer_naam}
                                    </p>
                                  </div>
                                </div>
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
                                    <p className="text-xs text-slate-300">
                                      Nog niet gewassen
                                    </p>
                                  </>
                                )}
                              </div>

                              <ChevronRightIcon className="w-4 h-4 text-slate-200 group-hover:text-p transition-colors" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
