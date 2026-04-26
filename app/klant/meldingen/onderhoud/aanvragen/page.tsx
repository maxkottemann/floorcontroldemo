"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Inputfield from "@/components/layout/inputfield";
import {
  ClipboardDocumentListIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface Locatie {
  id: string;
  naam: string;
  plaats: string | null;
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 border-b border-slate-50">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-p/8 flex items-center justify-center text-p shrink-0">
          {icon}
        </div>
        <div>
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

export default function OnderhoudsPageAanvragen() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [opmerkingen, setOpmerking] = useState("");
  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [selectedLocatie, setSelectedLocatie] = useState<Locatie | null>(null);
  const [locatieZoek, setLocatieZoek] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step1Done = !!(naam && beschrijving);
  const step2Done = !!selectedLocatie;
  const canSubmit = step1Done && step2Done;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showToast("Niet ingelogd", "error");
      setSubmitting(false);
      console.log("No user found");
      return;
    }

    const { data: profiel, error: profielError } = await supabase
      .from("profielen")
      .select("id")
      .eq("gebruiker_id", user.id)
      .single();

    if (profielError || !profiel) {
      showToast("Profiel niet gevonden", "error");
      setSubmitting(false);
      console.log(profielError);
      return;
    }

    const { error } = await supabase.from("onderhoud_aanvragen").insert({
      locatie_id: selectedLocatie?.id,
      profiel_id: profiel.id,
      naam: naam,
      beschrijving: beschrijving,
      opmerkingen: opmerkingen,
    });

    if (error) {
      showToast("Aanvraag kon niet worden ingediend", "error");
      setSubmitting(false);
      console.log(error);
      return;
    }

    showToast("Aanvraag ingediend", "success");
    setTimeout(() => router.back(), 1000);
  }

  useEffect(() => {
    async function getLocaties() {
      const { data } = await supabase
        .from("locaties")
        .select("id, naam, plaats")
        .order("naam");
      setLocaties(data ?? []);
    }
    getLocaties();
  }, []);

  const filteredLocaties = locaties.filter((l) =>
    `${l.naam} ${l.plaats ?? ""}`
      .toLowerCase()
      .includes(locatieZoek.toLowerCase()),
  );

  const form = (
    <div className="space-y-4 md:space-y-5">
      <SectionCard
        icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
        title="Aanvraaggegevens"
        subtitle="Beschrijf het onderhoudsverzoek"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Inputfield
            title="Naam"
            value={naam}
            onChange={setNaam}
            placeholder="Bijv. Vervanging vloerbedekking hal"
          />
          <Inputfield
            title="Beschrijving"
            value={beschrijving}
            onChange={setBeschrijving}
            placeholder="Wat moet er gebeuren?"
          />
          <div className="sm:col-span-2">
            <Inputfield
              title="Opmerkingen"
              value={opmerkingen}
              onChange={setOpmerking}
              placeholder="Aanvullende informatie (optioneel)"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<MapPinIcon className="w-5 h-5" />}
        title="Locatie"
        subtitle="Kies de locatie waarvoor het onderhoud geldt"
      >
        <div className="space-y-3">
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={locatieZoek}
              onChange={(e) => setLocatieZoek(e.target.value)}
              placeholder="Zoek locatie..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all"
            />
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden max-h-64 overflow-y-auto">
            {filteredLocaties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MapPinIcon className="w-6 h-6 text-slate-200 mb-2" />
                <p className="text-sm text-slate-300">Geen locaties gevonden</p>
              </div>
            ) : (
              filteredLocaties.map((l) => {
                const isSelected = selectedLocatie?.id === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLocatie(l);
                      setLocatieZoek("");
                    }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0
                    ${isSelected ? "bg-p/5 border-l-2 border-l-p" : "bg-white hover:bg-slate-50"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-p/15" : "bg-slate-100"}`}
                    >
                      <BuildingOfficeIcon
                        className={`w-4 h-4 ${isSelected ? "text-p" : "text-slate-400"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${isSelected ? "text-p" : "text-slate-800"}`}
                      >
                        {l.naam}
                      </p>
                      {l.plaats && (
                        <p className="text-xs text-slate-400 truncate">
                          {l.plaats}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircleIcon className="w-4 h-4 text-p shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedLocatie && (
            <div className="flex items-center gap-2 px-3 py-2 bg-p/5 border border-p/15 rounded-xl">
              <CheckCircleIcon className="w-4 h-4 text-p shrink-0" />
              <p className="text-sm font-semibold text-p">
                {selectedLocatie.naam}
              </p>
              {selectedLocatie.plaats && (
                <p className="text-xs text-p/60">· {selectedLocatie.plaats}</p>
              )}
              <button
                onClick={() => setSelectedLocatie(null)}
                className="ml-auto text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Wissen
              </button>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );

  const summarySidebar = (
    <div className="p-5 space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
          Aanvraag
        </p>
        <p className="text-sm font-semibold text-slate-800">
          {naam || (
            <span className="text-slate-300 italic font-normal">
              Nog niet ingevuld
            </span>
          )}
        </p>
        {beschrijving && (
          <p className="text-xs text-slate-400 mt-0.5">{beschrijving}</p>
        )}
      </div>

      <div className="h-px bg-slate-50" />

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

      {opmerkingen && (
        <>
          <div className="h-px bg-slate-50" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-300 mb-1">
              Opmerkingen
            </p>
            <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                {opmerkingen}
              </p>
            </div>
          </div>
        </>
      )}

      <div className="h-px bg-slate-50" />

      <button
        onClick={() => handleSubmit()}
        disabled={!canSubmit || submitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 bg-p text-white shadow-sm hover:bg-p/90 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <>
            <PlusIcon className="w-4 h-4" />
            Aanvraag indienen
          </>
        )}
      </button>

      {!canSubmit && (
        <p className="text-center text-[11px] text-slate-300">
          {!step1Done ? "Vul naam en beschrijving in" : "Kies een locatie"}
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
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3 md:mb-4"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Onderhoud aanvragen
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Dien een onderhoudsverzoek in voor een van uw locaties
              </p>
            </div>

            <div className="hidden md:grid md:grid-cols-[1fr_320px] gap-6 items-start">
              {form}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-slate-50">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Samenvatting
                  </p>
                </div>
                {summarySidebar}
              </div>
            </div>

            <div className="md:hidden space-y-4">
              {form}
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
