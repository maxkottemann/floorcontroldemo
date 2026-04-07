"use client";

import Card from "@/components/layout/card";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import Inputfield from "@/components/layout/inputfield";
import DropdownBig from "@/components/layout/dropdownbig";
import { useEffect, useState } from "react";
import MainButton from "@/components/layout/mainbutton";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/hooks/usetoasts";
import Toast from "@/components/layout/toast";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function LocatiesToevoegen() {
  const [type, setType] = useState("");
  const [naam, setNaam] = useState("");
  const [extraCheckin, setExtraCheckin] = useState("");
  const [plaats, setPlaats] = useState("");
  const [adres, setAdres] = useState("");
  const [contactPersoon, setContactPersoon] = useState("");
  const [telefoonnummer, setTelefoonnummer] = useState("");
  const [perceel, setPerceel] = useState("Perceel 1");

  const { toast, showToast, hideToast } = useToast();

  const typeOptions = ["type 1", "type 2", "type 3"];
  const extraCheckinOptions = ["Ja", "Nee"];
  const perceelOptions = ["Perceel 1", "Perceel 2", "Perceel 3"];

  const [gebouwen, setGebouwen] = useState<string[]>(["Gebouw 1"]);

  const addGebouw = () => setGebouwen([...gebouwen, ""]);

  const updateGebouw = (index: number, value: string) => {
    const updated = [...gebouwen];
    updated[index] = value;
    setGebouwen(updated);
  };

  const removeGebouw = (index: number) => {
    setGebouwen(gebouwen.filter((_, i) => i !== index));
  };
  const router = useRouter();

  function checkValues(): boolean {
    if (!naam) {
      showToast("Voer een naam in", "error");
      return false;
    }

    if (!type) {
      showToast("Selecteer een type", "error");
      return false;
    }

    if (!extraCheckin) {
      showToast("Selecteer extra check-in", "error");
      return false;
    }

    if (!perceel) {
      showToast("Selecteer een perceel", "error");
      return false;
    }

    if (!plaats) {
      showToast("Voer een plaats in", "error");
      return false;
    }

    if (!adres) {
      showToast("Voer een adres in", "error");
      return false;
    }

    return true;
  }

  function checkValidValues(): boolean {
    if (
      perceel !== "Perceel 1" &&
      perceel !== "Perceel 2" &&
      perceel !== "Perceel 3"
    ) {
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!checkValues()) return;
    if (!checkValidValues()) return;

    const { data, error } = await supabase
      .from("percelen")
      .select("id")
      .eq("naam", perceel)
      .single();

    if (error) {
      showToast("Er ging iets mis, probeer het opnieuw", "error");
      return;
    }

    const extraCheckinBoolean = extraCheckin === "Ja" ? true : false;

    const { data: data2, error: error2 } = await supabase
      .from("locaties")
      .insert({
        perceel_id: data.id,
        naam: naam,
        type: type,
        plaats: plaats,
        adres: adres,
        extra_checkin: extraCheckinBoolean,
        contact_persoon: contactPersoon,
        telefoonnummer: telefoonnummer,
      })
      .select("id")
      .single();

    if (error2) {
      console.log(error2);
      showToast("Er ging iets mis, probeer het opnieuw", "error");
      return;
    }
    console.log(data2);

    const { error: error3 } = await supabase.from("bouwdeel").insert(
      gebouwen.map((gebouw) => ({
        locatie_id: data2?.id,
        naam: gebouw,
      })),
    );

    if (error3) {
      console.log(error2);
      showToast("Er ging iets mis, probeer het opnieuw", "error");
      return;
    } else {
      showToast("Locatie toegevoed", "success");
      setTimeout(() => {
        router.push("/locaties");
      }, 1000);
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Locatie toevoegen" />

        <main className="flex-1 overflow-auto p-6">
          <Card className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Toevoegen</h2>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Inputfield
                title="Naam"
                placeholder="Naam van de locatie"
                value={naam}
                onChange={setNaam}
              />

              <DropdownBig
                title="Type"
                options={typeOptions}
                value={type}
                placeholder="Selecteer type"
                onChange={setType}
              />

              <DropdownBig
                title="Extra Check-in"
                options={extraCheckinOptions}
                value={extraCheckin}
                placeholder="Selecteer"
                onChange={setExtraCheckin}
              />

              <DropdownBig
                title="Perceel"
                options={perceelOptions}
                value={perceel}
                placeholder="Selecteer perceel"
                onChange={setPerceel}
              />

              <Inputfield
                title="Plaats"
                placeholder="Bijv. Amsterdam"
                value={plaats}
                onChange={setPlaats}
              />

              <Inputfield
                title="Adres"
                placeholder="Straatnaam en nummer"
                value={adres}
                onChange={setAdres}
              />

              <Inputfield
                title="Contactpersoon"
                placeholder="Naam van contactpersoon"
                value={contactPersoon}
                onChange={setContactPersoon}
              />

              <Inputfield
                title="Telefoonnummer"
                placeholder="06 12345678"
                value={telefoonnummer}
                onChange={setTelefoonnummer}
              />
            </form>

            <div className="flex flex-col gap-2 mt-5">
              {gebouwen.map((gebouw, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={gebouw}
                    onChange={(e) => updateGebouw(index, e.target.value)}
                    placeholder={`Gebouw ${index + 1}`}
                    className="flex-1 h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 transition-all duration-150"
                  />
                  {gebouwen.length > 1 && (
                    <button
                      onClick={() => removeGebouw(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addGebouw}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Gebouw toevoegen
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <MainButton
                icon={<PlusIcon></PlusIcon>}
                label="Toevoegen"
                onClick={() => handleSubmit()}
              ></MainButton>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
