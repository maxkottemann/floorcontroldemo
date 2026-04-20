"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  SwatchIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  Square3Stack3DIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 text-slate-800 transition-all"
      />
    </div>
  );
}

function SelectList<T extends { id: string; naam: string; sub?: string }>({
  items,
  selected,
  onSelect,
  loading,
  emptyText,
  icon: Icon,
}: {
  items: T[];
  selected: string | null;
  onSelect: (item: T) => void;
  loading: boolean;
  emptyText: string;
  icon: React.ElementType;
}) {
  const [zoek, setZoek] = useState("");
  const filtered = items.filter((i) =>
    i.naam.toLowerCase().includes(zoek.toLowerCase()),
  );
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-3 shrink-0">
        <SearchInput value={zoek} onChange={setZoek} placeholder="Zoeken..." />
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 rounded-xl border border-slate-100 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-300">{emptyText}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selected === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 cursor-pointer transition-colors active:bg-slate-100 ${isSelected ? "bg-p/5" : "hover:bg-slate-50"}`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? "bg-p border-p" : "border-slate-300 bg-white"}`}
                >
                  {isSelected && (
                    <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-p" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-bold truncate ${isSelected ? "text-p" : "text-slate-800"}`}
                  >
                    {item.naam}
                  </p>
                  {item.sub && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {item.sub}
                    </p>
                  )}
                </div>
                <ChevronRightIcon className="w-4 h-4 text-slate-200 shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function MeldingAanmakenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stap, setStap] = useState(0);

  const [locaties, setLocaties] = useState<
    { id: string; naam: string; sub?: string }[]
  >([]);
  const [bouwdelen, setBouwdelen] = useState<
    { id: string; naam: string; sub?: string }[]
  >([]);
  const [verdiepingen, setVerdiepingen] = useState<
    { id: string; naam: string; sub?: string }[]
  >([]);
  const [kamers, setKamers] = useState<
    { id: string; naam: string; sub?: string }[]
  >([]);
  const [vloeren, setVloeren] = useState<
    {
      id: string;
      naam: string;
      sub?: string;
      status: string;
      m2: number | null;
    }[]
  >([]);

  const [selectedLocatie, setSelectedLocatie] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [selectedBouwdeel, setSelectedBouwdeel] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [selectedVerdieping, setSelectedVerdieping] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [selectedKamer, setSelectedKamer] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [selectedVloer, setSelectedVloer] = useState<{
    id: string;
    naam: string;
    status: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("locaties")
        .select("id, naam, plaats")
        .order("naam");
      setLocaties(
        (data ?? []).map((d: any) => ({
          id: d.id,
          naam: d.naam,
          sub: d.plaats,
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  async function selectLocatie(l: { id: string; naam: string }) {
    setSelectedLocatie(l);
    setSelectedBouwdeel(null);
    setSelectedVerdieping(null);
    setSelectedKamer(null);
    setSelectedVloer(null);
    setLoading(true);
    const { data } = await supabase
      .from("bouwdeel")
      .select("id, naam")
      .eq("locatie_id", l.id)
      .order("naam");
    setBouwdelen((data ?? []).map((d: any) => ({ id: d.id, naam: d.naam })));
    setLoading(false);
    setStap(1);
  }
  async function selectBouwdeel(b: { id: string; naam: string }) {
    setSelectedBouwdeel(b);
    setSelectedVerdieping(null);
    setSelectedKamer(null);
    setSelectedVloer(null);
    setLoading(true);
    const { data } = await supabase
      .from("verdiepingen")
      .select("id, naam")
      .eq("bouwdeel_id", b.id)
      .order("naam");
    setVerdiepingen((data ?? []).map((d: any) => ({ id: d.id, naam: d.naam })));
    setLoading(false);
    setStap(2);
  }
  async function selectVerdieping(v: { id: string; naam: string }) {
    setSelectedVerdieping(v);
    setSelectedKamer(null);
    setSelectedVloer(null);
    setLoading(true);
    const { data } = await supabase
      .from("kamers")
      .select("id, naam")
      .eq("verdieping_id", v.id)
      .order("naam");
    setKamers((data ?? []).map((d: any) => ({ id: d.id, naam: d.naam })));
    setLoading(false);
    setStap(3);
  }
  async function selectKamer(k: { id: string; naam: string }) {
    setSelectedKamer(k);
    setSelectedVloer(null);
    setLoading(true);
    const { data } = await supabase
      .from("kamer_vloeren")
      .select("id, vierkante_meter, status, vloer_types(naam)")
      .eq("kamer_id", k.id);
    setVloeren(
      (data ?? []).map((d: any) => ({
        id: d.id,
        naam: d.vloer_types?.naam ?? "Onbekend",
        sub: d.vierkante_meter ? `${d.vierkante_meter}m²` : undefined,
        status: d.status ?? "goed",
        m2: d.vierkante_meter,
      })),
    );
    setLoading(false);
    setStap(4);
  }
  function selectVloer(v: { id: string; naam: string; status: string }) {
    setSelectedVloer(v);
    setStap(5);
  }

  async function handleSubmit() {
    if (!selectedVloer) return;
    if (!titel.trim()) return showToast("Vul een titel in", "error");
    if (!beschrijving.trim())
      return showToast("Vul een beschrijving in", "error");
    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profiel } = await supabase
      .from("profielen")
      .select("id")
      .eq("gebruiker_id", user?.id ?? "")
      .single();
    const { error } = await supabase
      .from("meldingen")
      .insert({
        profiel_id: profiel?.id,
        kamervloer_id: selectedVloer.id,
        titel: titel.trim(),
        beschrijving: beschrijving.trim(),
      });
    if (error) {
      showToast("Kon melding niet opslaan", "error");
      setSubmitting(false);
      return;
    }
    showToast("Melding ingediend", "success");
    setTimeout(() => router.back(), 1000);
  }

  const statusColor: Record<string, string> = {
    goed: "bg-emerald-100 text-emerald-700",
    matig: "bg-amber-100 text-amber-700",
    slecht: "bg-red-100 text-red-700",
  };
  const breadcrumb = [
    selectedLocatie?.naam,
    selectedBouwdeel?.naam,
    selectedVerdieping?.naam,
    selectedKamer?.naam,
    selectedVloer?.naam,
  ]
    .filter(Boolean)
    .join(" › ");
  const stapLabels = [
    "Locatie",
    "Gebouw",
    "Verdieping",
    "Kamer",
    "Vloer",
    "Gegevens",
    "Bevestigen",
  ];

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
          title="Melding indienen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-hidden flex flex-col p-3 md:p-6 gap-4 md:gap-5">
          {/* Header + stepper */}
          <div className="shrink-0 space-y-3 md:space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Nieuw
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Melding indienen
              </h1>
              {breadcrumb && (
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {breadcrumb}
                </p>
              )}
            </div>

            {/* Stepper — numbers only on mobile, labels on sm+ */}
            <div className="flex items-center gap-1">
              {stapLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1">
                  <button
                    onClick={() => i < stap && setStap(i)}
                    className={`flex items-center gap-1.5 shrink-0 transition-all ${i < stap ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${
                        i < stap
                          ? "bg-emerald-500 text-white"
                          : i === stap
                            ? "bg-p text-white"
                            : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {i < stap ? <CheckIcon className="w-3 h-3" /> : i + 1}
                    </div>
                    <p
                      className={`text-xs font-semibold hidden sm:block whitespace-nowrap ${i === stap ? "text-slate-800" : i < stap ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {label}
                    </p>
                  </button>
                  {i < stapLabels.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-1 ${i < stap ? "bg-emerald-300" : "bg-slate-200"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="flex-1 min-h-0 flex flex-col">
            {stap === 0 && (
              <SelectList
                items={locaties}
                selected={selectedLocatie?.id ?? null}
                onSelect={selectLocatie}
                loading={loading}
                emptyText="Geen locaties gevonden"
                icon={MapPinIcon}
              />
            )}
            {stap === 1 && (
              <SelectList
                items={bouwdelen}
                selected={selectedBouwdeel?.id ?? null}
                onSelect={selectBouwdeel}
                loading={loading}
                emptyText="Geen gebouwen gevonden"
                icon={BuildingOfficeIcon}
              />
            )}
            {stap === 2 && (
              <SelectList
                items={verdiepingen}
                selected={selectedVerdieping?.id ?? null}
                onSelect={selectVerdieping}
                loading={loading}
                emptyText="Geen verdiepingen gevonden"
                icon={Square3Stack3DIcon}
              />
            )}
            {stap === 3 && (
              <SelectList
                items={kamers}
                selected={selectedKamer?.id ?? null}
                onSelect={selectKamer}
                loading={loading}
                emptyText="Geen kamers gevonden"
                icon={HomeModernIcon}
              />
            )}

            {stap === 4 && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 rounded-xl border border-slate-100 bg-white">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
                    </div>
                  ) : vloeren.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-slate-300">
                        Geen vloeren in deze kamer
                      </p>
                    </div>
                  ) : (
                    vloeren.map((v) => {
                      const isSelected = selectedVloer?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => selectVloer(v)}
                          className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 cursor-pointer transition-colors active:bg-slate-100 ${isSelected ? "bg-p/5" : "hover:bg-slate-50"}`}
                        >
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? "bg-p border-p" : "border-slate-300 bg-white"}`}
                          >
                            {isSelected && (
                              <CheckIcon
                                className="w-3 h-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                            <SwatchIcon className="w-4 h-4 text-p" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-bold ${isSelected ? "text-p" : "text-slate-800"}`}
                            >
                              {v.naam}
                            </p>
                            {v.m2 && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                {v.m2}m²
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor[v.status] ?? "bg-slate-100 text-slate-500"}`}
                          >
                            {v.status}
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-slate-200 shrink-0" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {stap === 5 && (
              <div className="flex flex-col flex-1 min-h-0 space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-p/5 border border-p/15 rounded-xl shrink-0">
                  <SwatchIcon className="w-4 h-4 text-p shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-p truncate">
                      {selectedVloer?.naam}
                    </p>
                    <p className="text-xs text-p/70 truncate">{breadcrumb}</p>
                  </div>
                  <button
                    onClick={() => setStap(4)}
                    className="text-xs font-semibold text-p/60 hover:text-p cursor-pointer transition-colors shrink-0"
                  >
                    Wijzigen
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
                  <div className="px-4 md:px-5 py-4 border-b border-slate-50 shrink-0">
                    <p className="text-sm font-bold text-slate-800">
                      Meldingsgegevens
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Beschrijf het probleem zo duidelijk mogelijk
                    </p>
                  </div>
                  <div className="p-4 md:p-5 space-y-4 flex-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Titel
                      </label>
                      <input
                        value={titel}
                        onChange={(e) => setTitel(e.target.value)}
                        placeholder="Bijv. Beschadiging tapijt bij ingang"
                        className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p focus:ring-2 focus:ring-p/10 focus:bg-white placeholder:text-slate-400 transition-all"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                        Beschrijving
                      </label>
                      <textarea
                        value={beschrijving}
                        onChange={(e) => setBeschrijving(e.target.value)}
                        rows={5}
                        placeholder="Beschrijf het probleem in detail — wat is er mis, hoe ernstig is het, wanneer is het opgevallen?"
                        className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p focus:ring-2 focus:ring-p/10 focus:bg-white placeholder:text-slate-400 transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="px-4 md:px-5 py-4 border-t border-slate-50 flex justify-between shrink-0">
                    <button
                      onClick={() => setStap(4)}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Terug
                    </button>
                    <button
                      onClick={() => {
                        if (titel.trim() && beschrijving.trim()) setStap(6);
                        else showToast("Vul alle velden in", "error");
                      }}
                      className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-p hover:bg-p/90 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Volgende <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stap === 6 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="px-4 md:px-5 py-4 border-b border-slate-50 shrink-0">
                  <p className="text-sm font-bold text-slate-800">
                    Controleer uw melding
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Klopt alles? Dan kunt u de melding indienen
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {[
                    {
                      label: "Locatie",
                      content: (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {breadcrumb}
                        </p>
                      ),
                    },
                    {
                      label: "Vloer",
                      content: (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                            <SwatchIcon className="w-4 h-4 text-p" />
                          </div>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedVloer?.naam}
                          </p>
                        </div>
                      ),
                    },
                    {
                      label: "Titel",
                      content: (
                        <p className="text-sm font-semibold text-slate-800">
                          {titel}
                        </p>
                      ),
                    },
                    {
                      label: "Beschrijving",
                      content: (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {beschrijving}
                        </p>
                      ),
                    },
                  ].map(({ label, content }) => (
                    <div key={label} className="px-4 md:px-5 py-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {label}
                      </p>
                      {content}
                    </div>
                  ))}
                </div>
                <div className="px-4 md:px-5 py-4 border-t border-slate-50 flex justify-between shrink-0">
                  <button
                    onClick={() => setStap(5)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Terug
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-p hover:bg-p/90 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {submitting ? "Bezig..." : "Melding indienen"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
