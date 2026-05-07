"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Locatie } from "@/types/locatie";
import { bouwdeel } from "@/types/bouwdeel";
import { verdieping } from "@/types/verdieping";
import { kamer } from "@/types/kamer";
import { kamervloer } from "@/types/kamervloer";
import LocatieSelector from "@/components/layout/locatieselector";
import BouwdeelTree from "@/components/layout/bouwdeeltree";
import {
  CalendarDaysIcon,
  ArrowLeftIcon,
  MapPinIcon,
  SwatchIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

interface SelectedState {
  bouwdeelIds: string[];
  alleKamersPerBouwdeel: Record<string, boolean>;
  verdiepingIds: string[];
  alleKamersPerVerdieping: Record<string, boolean>;
  vloerIds: string[];
}

function StepBadge({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 md:gap-2.5 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-35"}`}
    >
      <div
        className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
        ${done ? "bg-emerald-500 text-white" : active ? "bg-p text-white shadow-[0_0_0_4px_rgba(21,66,115,0.15)]" : "bg-slate-200 text-slate-400"}`}
      >
        {done ? (
          <CheckCircleIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs md:text-sm font-semibold tracking-tight hidden sm:inline ${active ? "text-slate-800" : done ? "text-emerald-600" : "text-slate-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  step,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  step: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 border-b border-slate-50">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-p/10 flex items-center justify-center text-p shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-0.5">
            Stap {step}
          </p>
          <h3 className="text-sm font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

export default function OnderhoudAanvragenPage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [alleLocaties, setAlleLocaties] = useState<Locatie[]>([]);
  const [locatieZoekterm, setLocatieZoekterm] = useState("");
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie | undefined>();

  const [alleBouwdelen, setAlleBouwdelen] = useState<bouwdeel[]>([]);
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<verdieping[]>([]);
  const [alleKamers, setAlleKamers] = useState<kamer[]>([]);
  const [alleKamersvloeren, setAlleKamersvloeren] = useState<kamervloer[]>([]);
  const [selected, setSelected] = useState<SelectedState>({
    bouwdeelIds: [],
    alleKamersPerBouwdeel: {},
    verdiepingIds: [],
    alleKamersPerVerdieping: {},
    vloerIds: [],
  });

  const [beschrijving, setBeschrijving] = useState("");
  const [saving, setSaving] = useState(false);

  const alleGeselecteerdeVloerIds = useMemo(
    () => [
      ...new Set([
        ...selected.vloerIds,
        ...alleKamersvloeren
          .filter((v) =>
            alleKamers.find(
              (k) =>
                k.id === v.kamer_id &&
                alleVerdiepingen.find(
                  (verd) =>
                    verd.id === k.verdieping_id &&
                    selected.alleKamersPerBouwdeel[verd.bouwdeel_id],
                ),
            ),
          )
          .map((v) => v.id),
        ...alleKamersvloeren
          .filter((v) =>
            alleKamers.find(
              (k) =>
                k.id === v.kamer_id &&
                selected.alleKamersPerVerdieping[k.verdieping_id],
            ),
          )
          .map((v) => v.id),
      ]),
    ],
    [selected, alleKamersvloeren, alleKamers, alleVerdiepingen],
  );

  const step1Done = !!selectedLocatie;
  const step2Done = alleGeselecteerdeVloerIds.length > 0;
  const step3Done = !!beschrijving.trim();

  useEffect(() => {
    async function getAllLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select(
          "id,naam,type,plaats,adres,extra_checkin,contact_persoon,telefoonnummer,percelen!inner(naam)",
        )
        .order("naam", { ascending: true });
      if (!data) {
        showToast("Locaties konden niet worden geladen", "error");
        return;
      }
      setAlleLocaties(
        data.map((d: any) => ({
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
    getAllLocaties();
  }, []);

  useEffect(() => {
    async function loadLocatieData() {
      if (!selectedLocatie) return;
      setAlleBouwdelen([]);
      setAlleVerdiepingen([]);
      setAlleKamers([]);
      setAlleKamersvloeren([]);
      setSelected({
        bouwdeelIds: [],
        alleKamersPerBouwdeel: {},
        verdiepingIds: [],
        alleKamersPerVerdieping: {},
        vloerIds: [],
      });

      const { data: bouwdelen } = await supabase
        .from("bouwdeel")
        .select("id,locatie_id,naam")
        .eq("locatie_id", selectedLocatie.id);
      if (!bouwdelen) {
        showToast("Bouwdelen konden niet laden", "error");
        return;
      }
      setAlleBouwdelen(
        bouwdelen.map((b) => ({
          id: b.id,
          locatie_id: b.locatie_id,
          naam: b.naam,
        })),
      );

      const { data: verdiepingen } = await supabase
        .from("verdiepingen")
        .select("id,bouwdeel_id,naam")
        .in(
          "bouwdeel_id",
          bouwdelen.map((d) => d.id),
        );
      if (!verdiepingen) {
        showToast("Verdiepingen konden niet laden", "error");
        return;
      }
      setAlleVerdiepingen(
        verdiepingen.map((v) => ({
          id: v.id,
          bouwdeel_id: v.bouwdeel_id,
          naam: v.naam,
        })),
      );

      const { data: kamers } = await supabase
        .from("kamers")
        .select("id,verdieping_id,naam")
        .in(
          "verdieping_id",
          verdiepingen.map((v) => v.id),
        );
      if (!kamers) {
        showToast("Kamers konden niet laden", "error");
        return;
      }
      setAlleKamers(
        kamers.map((k) => ({
          id: k.id,
          verdieping_id: k.verdieping_id,
          naam: k.naam,
        })),
      );

      const { data: vloeren } = await supabase
        .from("kamer_vloeren")
        .select("id,kamer_id,vloer_types(naam),vierkante_meter,status")
        .in(
          "kamer_id",
          kamers.map((k) => k.id),
        );
      if (!vloeren) {
        showToast("Vloeren konden niet laden", "error");
        return;
      }
      setAlleKamersvloeren(
        vloeren.map((v) => ({
          id: v.id,
          kamer_id: v.kamer_id,
          vloertype_naam: (v.vloer_types as any)?.naam,
          vierkante_meter: v.vierkante_meter,
          status: v.status,
        })),
      );
    }
    loadLocatieData();
  }, [selectedLocatie]);

  const filteredLocatie = alleLocaties.filter((l) =>
    l.naam!.toLowerCase().includes(locatieZoekterm.toLowerCase()),
  );

  async function handleSubmit() {
    if (
      !selectedLocatie ||
      alleGeselecteerdeVloerIds.length === 0 ||
      !beschrijving.trim()
    )
      return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Niet ingelogd", "error");
      setSaving(false);
      return;
    }

    const { data: profielData, error: profielError } = await supabase
      .from("profielen")
      .select("id")
      .eq("gebruiker_id", user.id)
      .single();

    if (!profielData || profielError) {
      showToast("Geen gebruiker gevonden", "error");
      setSaving(false);
      return;
    }

    const { data: aanvraag, error } = await supabase
      .from("onderhouds_aanvragen")
      .insert({
        locatie_id: selectedLocatie.id,
        aangevraagd_door: profielData.id,
        beschrijving: beschrijving.trim(),
      })
      .select("id")
      .single();

    if (error || !aanvraag) {
      showToast("Kon aanvraag niet indienen", "error");
      console.log(error);
      setSaving(false);
      return;
    }

    const { error: vloerError } = await supabase
      .from("onderhouds_aanvragen_vloeren")
      .insert(
        alleGeselecteerdeVloerIds.map((kamervloer_id) => ({
          kamervloer_id,
          onderhouds_aanvraag_id: aanvraag.id,
        })),
      );

    if (vloerError) {
      showToast("Kon vloeren niet koppelen", "error");
      console.log(vloerError);
      setSaving(false);
      return;
    }

    showToast("Aanvraag ingediend", "success");
    setTimeout(() => router.push("/klant/meldingen"), 1000);
    setSaving(false);
  }

  const steps = (
    <div className="space-y-4 md:space-y-5">
      <SectionCard
        step={1}
        icon={<MapPinIcon className="w-5 h-5" />}
        title="Locatie kiezen"
        subtitle="Kies de locatie die onderhoud nodig heeft"
      >
        <LocatieSelector
          locaties={filteredLocatie}
          value={selectedLocatie}
          onChange={(l) => setSelectedLocatie(l)}
        />
      </SectionCard>

      {selectedLocatie && (
        <SectionCard
          step={2}
          icon={<BuildingOffice2Icon className="w-5 h-5" />}
          title="Vloeren selecteren"
          subtitle="Selecteer de vloeren die onderhoud nodig hebben"
        >
          <BouwdeelTree
            alleBouwdelen={alleBouwdelen}
            alleVerdiepingen={alleVerdiepingen}
            alleKamers={alleKamers}
            alleKamersvloeren={alleKamersvloeren}
            selected={selected}
            onChange={setSelected}
          />
        </SectionCard>
      )}

      {step2Done && (
        <SectionCard
          step={3}
          icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          title="Beschrijving"
          subtitle="Omschrijf het gewenste onderhoud en eventuele urgentie"
        >
          <div className="flex flex-col gap-1.5">
            <textarea
              value={beschrijving}
              onChange={(e) => setBeschrijving(e.target.value)}
              rows={4}
              placeholder="Beschrijf het gewenste onderhoud en eventuele urgentie..."
              className="w-full px-3 py-2.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 resize-none placeholder:text-slate-300 transition-all"
            />
            <p className="text-[11px] text-slate-300 text-right">
              {beschrijving.length} tekens
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );

  const summarySidebar = (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Locatie
        </p>
        {selectedLocatie ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-p/10 flex items-center justify-center">
              <MapPinIcon className="w-3.5 h-3.5 text-p" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedLocatie.naam}
              </p>
              {selectedLocatie.plaats && (
                <p className="text-xs text-slate-400">
                  {selectedLocatie.plaats}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 italic font-normal">
            Nog niet gekozen
          </p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-2">
          Selectie
        </p>
        <div
          className={`rounded-xl px-3 py-2.5 text-center transition-colors ${alleGeselecteerdeVloerIds.length > 0 ? "bg-p/10 border border-p/15" : "bg-slate-50 border border-slate-100"}`}
        >
          <p
            className={`text-lg font-bold leading-tight ${alleGeselecteerdeVloerIds.length > 0 ? "text-p" : "text-slate-300"}`}
          >
            {alleGeselecteerdeVloerIds.length}
          </p>
          <p
            className={`text-[10px] font-medium ${alleGeselecteerdeVloerIds.length > 0 ? "text-p/70" : "text-slate-300"}`}
          >
            Vloeren geselecteerd
          </p>
        </div>
      </div>

      {beschrijving.trim() && (
        <>
          <div className="h-px bg-slate-50" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
              Beschrijving
            </p>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {beschrijving}
            </p>
          </div>
        </>
      )}

      <div className="h-px bg-slate-50" />

      <button
        onClick={handleSubmit}
        disabled={!step1Done || !step2Done || !step3Done || saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
          bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
            Indienen...
          </>
        ) : (
          <>
            <CalendarDaysIcon className="w-4 h-4" />
            Aanvraag indienen
          </>
        )}
      </button>

      {(!step1Done || !step2Done || !step3Done) && (
        <p className="text-center text-[11px] text-slate-300">
          {!step1Done
            ? "Kies een locatie"
            : !step2Done
              ? "Selecteer minimaal één vloer"
              : "Voeg een beschrijving toe"}
        </p>
      )}
    </div>
  );

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

      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        <Topbar
          title="Onderhoud aanvragen"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
          <div className="space-y-4 md:space-y-6 mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Terug naar meldingen
                </button>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Nieuw
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Onderhoud aanvragen
                </h1>
                {selectedLocatie && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {selectedLocatie.naam}
                    </span>
                    {selectedLocatie.plaats && (
                      <span className="text-sm text-slate-300">
                        · {selectedLocatie.plaats}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 self-start">
                <StepBadge
                  number={1}
                  label="Locatie"
                  active={!step1Done}
                  done={step1Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={2}
                  label="Vloeren"
                  active={step1Done && !step2Done}
                  done={step2Done}
                />
                <div className="w-3 md:w-5 h-px bg-slate-200 shrink-0" />
                <StepBadge
                  number={3}
                  label="Details"
                  active={step2Done && !step3Done}
                  done={step3Done}
                />
              </div>
            </div>

            {/* Desktop two-column */}
            <div className="hidden md:grid md:grid-cols-[1fr_340px] gap-6 items-start">
              {steps}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>
                {summarySidebar}
              </div>
            </div>

            {/* Mobile single column */}
            <div className="md:hidden space-y-4">
              {steps}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>
                {summarySidebar}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
