"use client";
import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Locatie } from "@/types/locatie";
import { bouwdeel } from "@/types/bouwdeel";
import { verdieping } from "@/types/verdieping";
import { kamer } from "@/types/kamer";
import { kamervloer } from "@/types/kamervloer";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  BuildingOfficeIcon,
  Square3Stack3DIcon,
  HomeModernIcon,
  SwatchIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

function VloerRij({ vloer }: { vloer: kamervloer }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/vloerenpaspoort/vloer/${vloer.id}`)}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-p/5 hover:border-p/20 border border-transparent transition-all duration-150 group"
    >
      <div className="w-5 h-5 rounded-md bg-p/10 flex items-center justify-center shrink-0">
        <SwatchIcon className="w-3 h-3 text-p" />
      </div>
      <p className="text-sm font-semibold text-slate-700 flex-1 group-hover:text-p transition-colors">
        {vloer.vloertype_naam ?? "Onbekend vloertype"}
      </p>
      {vloer.vierkante_meter && (
        <span className="text-xs font-bold text-slate-500">
          {vloer.vierkante_meter}m²
        </span>
      )}
      {vloer.status && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            vloer.status === "afgerond"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : vloer.status === "bezig"
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          {vloer.status}
        </span>
      )}
      <ChevronRightIcon className="w-3.5 h-3.5 text-slate-200 group-hover:text-p shrink-0 transition-colors" />
    </div>
  );
}

function KamerRij({ kamer, vloeren }: { kamer: kamer; vloeren: kamervloer[] }) {
  const [open, setOpen] = useState(false);
  const kamerVloeren = vloeren.filter((v) => v.kamer_id === kamer.id);

  return (
    <div className="ml-4">
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group"
      >
        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
          <HomeModernIcon className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-700 flex-1">
          {kamer.naam}
        </p>
        {kamerVloeren.length > 0 && (
          <span className="text-[10px] font-bold text-p bg-p/10 px-1.5 py-0.5 rounded-full">
            {kamerVloeren.length}
          </span>
        )}
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && kamerVloeren.length > 0 && (
        <div className="ml-4 mt-1 mb-2 space-y-1">
          {kamerVloeren.map((v) => (
            <VloerRij key={v.id} vloer={v} />
          ))}
        </div>
      )}

      {open && kamerVloeren.length === 0 && (
        <p className="ml-8 text-xs text-slate-300 py-1 italic">Geen vloeren</p>
      )}
    </div>
  );
}

function VerdiepingRij({
  verdieping,
  kamers,
  vloeren,
}: {
  verdieping: verdieping;
  kamers: kamer[];
  vloeren: kamervloer[];
}) {
  const [open, setOpen] = useState(false);
  const verdiepingKamers = kamers.filter(
    (k) => k.verdieping_id === verdieping.id,
  );

  return (
    <div className="ml-4">
      <div
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group"
      >
        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
          <Square3Stack3DIcon className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 flex-1">
          {verdieping.naam}
        </p>
        <span className="text-[10px] text-slate-400">
          {verdiepingKamers.length} kamers
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {verdiepingKamers.map((k) => (
            <KamerRij key={k.id} kamer={k} vloeren={vloeren} />
          ))}
        </div>
      )}
    </div>
  );
}

function BouwdeelRij({
  bouwdeel,
  verdiepingen,
  kamers,
  vloeren,
}: {
  bouwdeel: bouwdeel;
  verdiepingen: verdieping[];
  kamers: kamer[];
  vloeren: kamervloer[];
}) {
  const [open, setOpen] = useState(false);
  const bouwdeelVerdiepingen = verdiepingen.filter(
    (v) => v.bouwdeel_id === bouwdeel.id,
  );

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${open ? "bg-p/5" : "bg-slate-50 hover:bg-slate-100"}`}
      >
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${open ? "bg-p/15 text-p" : "bg-slate-200 text-slate-500"}`}
        >
          <BuildingOfficeIcon className="w-4 h-4" />
        </div>
        <p
          className={`text-sm font-bold flex-1 ${open ? "text-p" : "text-slate-700"}`}
        >
          {bouwdeel.naam}
        </p>
        <span className="text-xs text-slate-400">
          {bouwdeelVerdiepingen.length} verdiepingen
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${open ? "rotate-180 text-p" : ""}`}
        />
      </div>

      {open && (
        <div className="p-2 space-y-0.5 border-t border-slate-100">
          {bouwdeelVerdiepingen.map((v) => (
            <VerdiepingRij
              key={v.id}
              verdieping={v}
              kamers={kamers}
              vloeren={vloeren}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VloerenPaspoortPage() {
  const { toast, showToast, hideToast } = useToast();

  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [locatieZoek, setLocatieZoek] = useState("");
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie>();
  const [loading, setLoading] = useState(false);

  const [alleBouwdelen, setAlleBouwdelen] = useState<bouwdeel[]>([]);
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<verdieping[]>([]);
  const [alleKamers, setAlleKamers] = useState<kamer[]>([]);
  const [alleKamersvloeren, setAlleKamersvloeren] = useState<kamervloer[]>([]);

  useEffect(() => {
    async function getLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,extra_checkin,plaats,adres,contact_persoon,telefoonnummer,percelen(naam)",
        )
        .order("naam", { ascending: true });
      if (!data) return;
      setLocaties(
        data.map((d) => ({
          id: d.id,
          naam: d.naam,
          type: d.type,
          extra_checkin: d.extra_checkin,
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
    async function getLocatieData() {
      if (!selectedLocatie) return;
      setLoading(true);
      setAlleBouwdelen([]);
      setAlleVerdiepingen([]);
      setAlleKamers([]);
      setAlleKamersvloeren([]);

      const { data: bouwdeelData } = await supabase
        .from("bouwdeel")
        .select("id,locatie_id,naam")
        .eq("locatie_id", selectedLocatie.id);
      if (!bouwdeelData) {
        setLoading(false);
        return;
      }
      setAlleBouwdelen(
        bouwdeelData.map((d) => ({
          id: d.id,
          locatie_id: d.locatie_id,
          naam: d.naam,
        })),
      );

      const { data: verdiepingData } = await supabase
        .from("verdiepingen")
        .select("id,bouwdeel_id,naam")
        .in(
          "bouwdeel_id",
          bouwdeelData.map((d) => d.id),
        );
      if (!verdiepingData) {
        setLoading(false);
        return;
      }
      setAlleVerdiepingen(
        verdiepingData.map((d) => ({
          id: d.id,
          bouwdeel_id: d.bouwdeel_id,
          naam: d.naam,
        })),
      );

      const { data: kamerData } = await supabase
        .from("kamers")
        .select("id,verdieping_id,naam")
        .in(
          "verdieping_id",
          verdiepingData.map((d) => d.id),
        );
      if (!kamerData) {
        setLoading(false);
        return;
      }
      setAlleKamers(
        kamerData.map((d) => ({
          id: d.id,
          verdieping_id: d.verdieping_id,
          naam: d.naam,
        })),
      );

      const { data: vloerData } = await supabase
        .from("kamer_vloeren")
        .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
        .in(
          "kamer_id",
          kamerData.map((d) => d.id),
        );
      setAlleKamersvloeren(
        (vloerData || []).map((d) => ({
          id: d.id,
          kamer_id: d.kamer_id,
          vloertype_naam: (d.vloer_types as any)?.naam,
          vierkante_meter: d.vierkante_meter,
          status: d.status,
        })),
      );

      setLoading(false);
    }
    getLocatieData();
  }, [selectedLocatie]);

  const filteredLocaties = locaties.filter((l) =>
    [l.naam, l.plaats].some((f) =>
      f?.toLowerCase().includes(locatieZoek.toLowerCase()),
    ),
  );

  const totalVloeren = alleKamersvloeren.length;
  const totalM2 = alleKamersvloeren.reduce(
    (sum, v) => sum + (v.vierkante_meter ?? 0),
    0,
  );

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Vloerpaspoort" />

        <main className="flex-1 overflow-hidden p-8">
          <div className="h-full flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Overzicht
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Vloerpaspoort
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Selecteer een locatie om alle vloeren te bekijken
              </p>
            </div>

            <div className="flex-1 grid grid-cols-[280px_1fr] gap-5 min-h-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100">
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

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {filteredLocaties.map((l) => {
                    const isSelected = selectedLocatie?.id === l.id;
                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLocatie(l)}
                        className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-l-2
                          ${isSelected ? "bg-p/5 border-l-p" : "border-l-transparent hover:bg-slate-50"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                          ${isSelected ? "bg-p/15 text-p" : "bg-slate-100 text-slate-400"}`}
                        >
                          <MapPinIcon className="w-4 h-4" />
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
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/40">
                  <p className="text-xs text-slate-400">
                    {filteredLocaties.length} locaties
                  </p>
                </div>
              </div>

              {/* Right panel */}
              <div className="flex flex-col gap-4 min-h-0">
                {!selectedLocatie ? (
                  <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <MapPinIcon className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-400">
                      Geen locatie geselecteerd
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      Klik op een locatie om de vloeren te zien
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Locatie header + stats */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex items-center gap-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest text-p/60 mb-0.5">
                          Geselecteerde locatie
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {selectedLocatie.naam}
                        </p>
                        {selectedLocatie.plaats && (
                          <p className="text-sm text-slate-400">
                            {selectedLocatie.adres} · {selectedLocatie.plaats}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-p">
                            {alleBouwdelen.length}
                          </p>
                          <p className="text-xs text-slate-400">Bouwdelen</p>
                        </div>
                        <div className="w-px bg-slate-100" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-p">
                            {alleKamers.length}
                          </p>
                          <p className="text-xs text-slate-400">Kamers</p>
                        </div>
                        <div className="w-px bg-slate-100" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-p">
                            {totalVloeren}
                          </p>
                          <p className="text-xs text-slate-400">Vloeren</p>
                        </div>
                        <div className="w-px bg-slate-100" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-p">
                            {totalM2}m²
                          </p>
                          <p className="text-xs text-slate-400">Totaal</p>
                        </div>
                      </div>
                    </div>

                    {/* Tree */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center">
                            <BuildingOfficeIcon className="w-4 h-4 text-p" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Bouwdelen & vloeren
                            </p>
                            <p className="text-xs text-slate-400">
                              Klik op een rij om uit te klappen · klik op een
                              vloer voor details
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
                          </div>
                        ) : alleBouwdelen.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <BuildingOfficeIcon className="w-8 h-8 text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400">
                              Geen bouwdelen gevonden
                            </p>
                          </div>
                        ) : (
                          alleBouwdelen.map((b) => (
                            <BouwdeelRij
                              key={b.id}
                              bouwdeel={b}
                              verdiepingen={alleVerdiepingen}
                              kamers={alleKamers}
                              vloeren={alleKamersvloeren}
                            />
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
