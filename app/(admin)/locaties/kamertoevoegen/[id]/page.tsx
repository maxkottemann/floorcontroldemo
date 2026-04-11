"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Dropdown from "@/components/layout/dropdown";
import Inputfield from "@/components/layout/inputfield";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import DropdownBig from "@/components/layout/dropdownbig";
import InputfieldSmall from "@/components/layout/inputfieldsmall";
import {
  PlusIcon,
  TrashIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UserIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Locatie } from "@/types/locatie";

interface Vloer {
  id: string;
  naam: string;
  m2: string;
}

interface latestKamers {
  id: string;
  kamer_naam: string;
  verdieping_naam: string;
  gebouw_naam: string;
}

export default function getKamersPage({}) {
  const { id } = useParams();
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [refresh, setRefresh] = useState(0);

  const [activeGebouw, setActiveGebouw] = useState("");
  const [activeVerdieping, setActiveVerdieping] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [naam, setNaam] = useState("");
  const [alleGebouwen, setAlleGebouwen] = useState<any[]>([]);
  const [alleVloerTypes, setAlleVloerTypes] = useState<any[]>([]);
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<any[]>([]);
  const [vloeren, setVloeren] = useState<Vloer[]>([
    { id: "", naam: "", m2: "" },
  ]);
  const [alleKamers, setAlleKamers] = useState<latestKamers[]>([]);
  const [locatie, setLocatie] = useState<Locatie>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!naam) return showToast("Vul een naam in", "error");
    if (!activeGebouw) return showToast("Selecteer een gebouw", "error");
    if (!activeVerdieping)
      return showToast("Selecteer een verdieping", "error");
    if (vloeren.length === 0)
      return showToast("Voeg minimaal 1 vloer toe", "error");
    if (
      vloeren.some(
        (v) => !v.id || !v.m2 || isNaN(Number(v.m2)) || Number(v.m2) <= 0,
      )
    ) {
      return showToast(
        "Vul een geldig vloertype en m² in voor alle vloeren",
        "error",
      );
    }

    setIsSubmitting(true);

    const { data: kamerData, error: kamerError } = await supabase
      .from("kamers")
      .insert({ verdieping_id: activeVerdieping?.id, naam })
      .select("id")
      .single();

    if (kamerError) {
      setIsSubmitting(false);
      if (kamerError.code === "23505")
        return showToast("Deze kamer bestaat al", "error");
      return showToast(
        "Er ging iets mis bij het toevoegen van de kamer",
        "error",
      );
    }

    const kamerId = kamerData?.id;

    try {
      for (const v of vloeren) {
        const { error: vloerenError } = await supabase
          .from("kamer_vloeren")
          .insert({
            kamer_id: kamerId,
            vloertype_id: v.id,
            vierkante_meter: v.m2,
          });
        if (vloerenError) throw vloerenError;
      }
      showToast("Kamer en vloeren succesvol toegevoegd", "success");
      setRefresh((prev) => prev + 1);
      clearFields();
    } catch (err) {
      await supabase.from("kamers").delete().eq("id", kamerId);
      showToast(
        "Er ging iets mis bij het toevoegen van de vloeren, kamer is verwijderd",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function getVloerTypes() {
      const { data } = await supabase.from("vloer_types").select("id,naam");
      setAlleVloerTypes(data || []);
    }
    getVloerTypes();
  }, []);

  const addVloer = () => setVloeren([...vloeren, { id: "", naam: "", m2: "" }]);

  const updateVloer = (index: number, updates: Partial<Vloer>) => {
    setVloeren((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    );
  };

  const removeVloer = (index: number) =>
    setVloeren(vloeren.filter((_, i) => i !== index));

  useEffect(() => {
    async function getGebouwen() {
      if (!id) return;
      const { data } = await supabase
        .from("bouwdeel")
        .select("id,naam")
        .eq("locatie_id", id);
      setAlleGebouwen(data || []);
    }
    getGebouwen();
  }, [id]);

  useEffect(() => {
    async function getVerdiepingen() {
      if (!activeGebouw) return;
      const { data } = await supabase
        .from("verdiepingen")
        .select("id,naam")
        .eq("bouwdeel_id", activeGebouw);
      setAlleVerdiepingen(data || []);
    }
    getVerdiepingen();
  }, [activeGebouw]);

  useEffect(() => {
    async function getLatestKamers() {
      const { data } = await supabase
        .from("kamers")
        .select("naam, id, verdiepingen(naam, bouwdeel(naam))")
        .order("aangemaakt_op", { ascending: false })
        .limit(20);

      setAlleKamers(
        data?.map((d: any) => ({
          id: d.id,
          kamer_naam: d.naam,
          verdieping_naam: d.verdiepingen?.naam,
          gebouw_naam: d.verdiepingen?.bouwdeel?.naam,
        })) ?? [],
      );
    }
    getLatestKamers();
  }, [refresh]);

  useEffect(() => {
    async function fetchLocatieData() {
      if (!id) return;
      const { data } = await supabase
        .from("locaties")
        .select(
          "id, naam,type,plaats,adres,contact_persoon, telefoonnummer, percelen!inner(naam)",
        )
        .eq("id", id)
        .single();

      setLocatie({
        naam: data?.naam,
        type: data?.type,
        plaats: data?.plaats,
        adres: data?.adres,
        contact_persoon: data?.contact_persoon,
        telefoonnummer: data?.telefoonnummer,
        perceel: (data?.percelen as any)?.naam,
        id: data?.id,
      });
    }
    fetchLocatieData();
  }, [id]);

  function clearFields() {
    setNaam("");
    setVloeren([{ id: "", naam: "", m2: "" }]);
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Ruimtebeheer" />

        <main className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="flex flex-col gap-6">
              {locatie && (
                <div>
                  <p className="text-xs font-semibold tracking-widest text-[#154273] uppercase mb-1">
                    Locatie
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {locatie.naam}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#154273]/10 text-[#154273] border border-[#154273]/20">
                      {locatie.type}
                    </span>
                    {locatie.extra_checkin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckBadgeIcon className="w-3.5 h-3.5" />
                        Extra check-in
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {locatie.adres && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <MapPinIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">{locatie.adres}</span>
                        {locatie.plaats && (
                          <span className="text-gray-400">
                            · {locatie.plaats}
                          </span>
                        )}
                      </div>
                    )}
                    {locatie.perceel && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <BuildingOfficeIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">{locatie.perceel}</span>
                      </div>
                    )}
                    {locatie.contact_persoon && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <UserIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">
                          {locatie.contact_persoon}
                        </span>
                      </div>
                    )}
                    {locatie.telefoonnummer && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <PhoneIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">
                          {locatie.telefoonnummer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h2 className="text-base font-semibold text-gray-900">
                    Nieuwe ruimte toevoegen
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Vul de gegevens in om een ruimte aan te maken
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Inputfield
                        value={naam}
                        onChange={(e) => setNaam(e)}
                        title="Ruimtenaam"
                        className="pb-3 pt-7"
                      />
                    </div>
                    <div>
                      <DropdownBig
                        title="Gebouw"
                        options={alleGebouwen.map((g) => g.naam)}
                        placeholder="Selecteer gebouw"
                        onChange={(selectedNaam) => {
                          const selectedGebouw = alleGebouwen.find(
                            (g) => g.naam === selectedNaam,
                          );
                          if (selectedGebouw)
                            setActiveGebouw(selectedGebouw.id);
                          setActiveVerdieping(null);
                        }}
                      />
                    </div>
                    <div>
                      <DropdownBig
                        title="Verdieping"
                        value={activeVerdieping?.naam || ""}
                        options={alleVerdiepingen.map((v) => v.naam)}
                        placeholder="Selecteer verdieping"
                        onChange={(selectedNaam) => {
                          const selectedverdieping = alleVerdiepingen.find(
                            (v) => v.naam === selectedNaam,
                          );
                          if (selectedverdieping)
                            setActiveVerdieping(selectedverdieping);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Vloeroppervlakken
                        </p>
                        <p className="text-xs text-gray-400">
                          Voeg één of meerdere vloertypes met oppervlak toe
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {vloeren.map((vloer, index) => (
                        <div
                          key={index}
                          className="flex items-end gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <div className="flex-1">
                            <Dropdown
                              title={`Vloertype ${index + 1}`}
                              options={alleVloerTypes}
                              displayKey="naam"
                              value={vloer}
                              placeholder="Selecteer vloertype"
                              onChange={(selected) =>
                                updateVloer(index, {
                                  id: selected.id,
                                  naam: selected.naam,
                                })
                              }
                            />
                          </div>
                          <div className="w-28">
                            <InputfieldSmall
                              title="m²"
                              value={vloer.m2 || ""}
                              onChange={(value: string) =>
                                updateVloer(index, { m2: value })
                              }
                            />
                          </div>
                          {vloeren.length > 1 && (
                            <button
                              onClick={() => removeVloer(index)}
                              className="mb-0.5 p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                              title="Verwijder vloer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-50">
                    <button
                      onClick={addVloer}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#154273] hover:text-[#0f2f52] hover:cursor-pointer px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Vloer toevoegen
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center  gap-2 px-5 py-2.5 bg-[#154273] hover:bg-[#0f2f52] hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {isSubmitting ? "Bezig..." : "Ruimte toevoegen"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Recente ruimtes
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Laatste 20 aangemaakt
                </p>
              </div>

              <div className="divide-y divide-gray-50">
                {alleKamers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                      <HomeModernIcon className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      Nog geen kamers aangemaakt
                    </p>
                  </div>
                ) : (
                  alleKamers.map((k) => (
                    <a
                      key={k.id}
                      href={`/locaties/kamerbekijken/${k.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#154273]/10 flex items-center justify-center shrink-0 group-hover:bg-[#154273]/20 transition-colors">
                        <HomeModernIcon className="w-4 h-4 text-[#154273]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {k.kamer_naam}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {k.gebouw_naam} · {k.verdieping_naam}
                        </p>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-[#154273] shrink-0 transition-colors" />
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>
          {/* end grid */}
        </main>
      </div>
    </div>
  );
}
