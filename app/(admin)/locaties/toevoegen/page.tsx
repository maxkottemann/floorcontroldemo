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

    const { error: error2 } = await supabase.from("locaties").insert({
      perceel_id: data.id,
      naam: naam,
      type: type,
      plaats: plaats,
      adres: adres,
      extra_checkin: extraCheckinBoolean,
      contact_persoon: contactPersoon,
      telefoonnummer: telefoonnummer,
    });
    if (error2) {
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
                id="naam"
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
                id="plaats"
                title="Plaats"
                placeholder="Bijv. Amsterdam"
                value={plaats}
                onChange={setPlaats}
              />

              <Inputfield
                id="adres"
                title="Adres"
                placeholder="Straatnaam en nummer"
                value={adres}
                onChange={setAdres}
              />

              <Inputfield
                id="contactpersoon"
                title="Contactpersoon"
                placeholder="Naam van contactpersoon"
                value={contactPersoon}
                onChange={setContactPersoon}
              />

              <Inputfield
                id="telefoonnummer"
                title="Telefoonnummer"
                placeholder="06 12345678"
                value={telefoonnummer}
                onChange={setTelefoonnummer}
              />
            </form>

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
