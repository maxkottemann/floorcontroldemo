"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Card from "@/components/layout/card";
import Dropdown from "@/components/layout/dropdown";
import Inputfield from "@/components/layout/inputfield";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import DropdownBig from "@/components/layout/dropdownbig";
import InputfieldSmall from "@/components/layout/inputfieldsmall";

interface Vloer {
  id: string;
  naam: string;
  m2: string;
}

export default function getKamersPage({}) {
  const { id } = useParams();
  const { toast, showToast, hideToast } = useToast();

  const [activeGebouw, setActiveGebouw] = useState("");
  const [activeVerdieping, setActiveVerdieping] = useState<{
    id: string;
    naam: string;
  } | null>(null);
  const [naam, setNaam] = useState("");
  const [alleGebouwen, setAlleGebouwen] = useState<any[]>([]);
  const [alleVloerTypes, setAlleVloerTypes] = useState<any[]>([]);
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<any[]>([]);
  const [vloeren, setVloeren] = useState<Vloer[]>([]);

  async function handleSubmit() {
    // Basic validation
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

    // Insert kamer
    const { data: kamerData, error: kamerError } = await supabase
      .from("kamers")
      .insert({
        verdieping_id: activeVerdieping?.id,
        naam,
      })
      .select("id")
      .single();

    if (kamerError) {
      if (kamerError.code === "23505")
        return showToast("Deze kamer bestaat al", "error");
      console.log(kamerError);
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
    } catch (err) {
      await supabase.from("kamers").delete().eq("id", kamerId);
      console.error(err);
      showToast(
        "Er ging iets mis bij het toevoegen van de vloeren, kamer is verwijderd",
        "error",
      );
    }
  }
  useEffect(() => {
    async function getVloerTypes() {
      if (!id) return;
      const { data } = await supabase.from("vloer_types").select("id,naam");

      console.log(data);
      setAlleVloerTypes(data || []);
    }
    getVloerTypes();
  }, []);

  const addVloer = () => {
    setVloeren([...vloeren, { id: "", naam: "", m2: "" }]);
  };

  const updateVloer = (index: number, updates: Partial<Vloer>) => {
    setVloeren((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...updates } : v)),
    );
  };
  const removeVloer = (index: number) => {
    setVloeren(vloeren.filter((_, i) => i !== index));
  };

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

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Kamer" />

        <main className="flex-1 overflow-auto p-6 space-y-4">
          <Card>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold mb-5">Toevoegen</h2>
              <div className="flex flex-row gap-10 ">
                <div className="w-full mt-1">
                  <Inputfield
                    value={naam}
                    onChange={(e) => setNaam(e)}
                    title="Naam"
                  ></Inputfield>
                </div>
                <div className="w-[20%]">
                  <DropdownBig
                    title="Gebouw"
                    options={alleGebouwen.map((g) => g.naam)}
                    placeholder="Selecteer gebouw"
                    onChange={(selectedNaam) => {
                      const selectedGebouw = alleGebouwen.find(
                        (g) => g.naam === selectedNaam,
                      );
                      if (selectedGebouw) {
                        setActiveGebouw(selectedGebouw.id);
                      }
                      setActiveVerdieping(null);
                    }}
                  />
                </div>
                <div className="w-[20%]">
                  <DropdownBig
                    title="Verdieping"
                    value={activeVerdieping?.naam || ""}
                    options={alleVerdiepingen.map((v) => v.naam)}
                    placeholder="Selecteer verdieping"
                    onChange={(selectedNaam) => {
                      const selectedverdieping = alleVerdiepingen.find(
                        (v) => v.naam === selectedNaam,
                      );
                      if (selectedverdieping) {
                        setActiveVerdieping(selectedverdieping);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 mt-4">
              {vloeren.map((vloer, index) => (
                <div key={index} className="flex items-end gap-10">
                  <div className="w-[20%]">
                    <Dropdown
                      title={`Vloertype ${index + 1}`}
                      options={alleVloerTypes}
                      displayKey="naam"
                      value={vloer}
                      placeholder="Selecteer vloertype"
                      onChange={(selected) => {
                        updateVloer(index, {
                          id: selected.id,
                          naam: selected.naam,
                        });
                      }}
                    />
                  </div>

                  <InputfieldSmall
                    title="m²"
                    value={vloer.m2 || ""}
                    onChange={(value: string) =>
                      updateVloer(index, { m2: value })
                    }
                  />

                  {vloeren.length > 1 && (
                    <button
                      onClick={() => removeVloer(index)}
                      className="text-red-500 hover:scale-110 transition-transform pb-2 hover:cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addVloer}
                className="mt-2 text-blue-500 hover:cursor-pointer hover:text-blue-600"
              >
                + Vloer toevoegen
              </button>
            </div>
            <button onClick={() => handleSubmit()}>asdasd</button>
          </Card>
        </main>
      </div>
    </div>
  );
}
