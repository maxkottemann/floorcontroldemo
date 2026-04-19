"use client";

import Card from "@/components/layout/card";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import Inputfield from "@/components/layout/inputfield";
import DropdownBig from "@/components/layout/dropdownbig";
import { useEffect, useRef, useState } from "react";
import MainButton from "@/components/layout/mainbutton";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/hooks/usetoasts";
import Toast from "@/components/layout/toast";
import {
  PlusIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Gebouw {
  naam: string;
  verdiepingen: string[];
  showAll: boolean;
}

const INITIAL_FLOORS = 20;
const TOTAL_FLOORS = 100;

const SPECIAL_FLOORS = ["Kelder", "Begane grond"];

function getFloorOptions(showAll: boolean): string[] {
  const numbered = Array.from(
    { length: showAll ? TOTAL_FLOORS : INITIAL_FLOORS },
    (_, i) => String(i + 1),
  );
  return [...SPECIAL_FLOORS, ...numbered];
}

function VerdiepingenSelect({
  gebouw,
  index,
  onChange,
}: {
  gebouw: Gebouw;
  index: number;
  onChange: (index: number, updates: Partial<Gebouw>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const floors = getFloorOptions(gebouw.showAll);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (floor: string) => {
    const current = gebouw.verdiepingen;
    const updated = current.includes(floor)
      ? current.filter((f) => f !== floor)
      : [...current, floor];
    onChange(index, { verdiepingen: updated });
  };

  const label =
    gebouw.verdiepingen.length === 0
      ? "Selecteer verdiepingen"
      : gebouw.verdiepingen.length === 1
        ? SPECIAL_FLOORS.includes(gebouw.verdiepingen[0])
          ? gebouw.verdiepingen[0]
          : `Verdieping ${gebouw.verdiepingen[0]}`
        : `${gebouw.verdiepingen.length} verdiepingen geselecteerd`;

  const floorLabel = (floor: string) =>
    SPECIAL_FLOORS.includes(floor) ? floor : `Verdieping ${floor}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-150"
      >
        <span
          className={
            gebouw.verdiepingen.length === 0 ? "text-gray-400" : "text-gray-800"
          }
        >
          {label}
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-52 overflow-y-auto py-1">
            {floors.map((floor, i) => {
              const selected = gebouw.verdiepingen.includes(floor);
              const isLastSpecial = i === SPECIAL_FLOORS.length - 1;
              return (
                <li
                  key={floor}
                  onClick={() => toggle(floor)}
                  className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer transition-colors
                    ${isLastSpecial ? "border-b border-gray-100 mb-1" : ""}
                    ${selected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  <span>{floorLabel(floor)}</span>
                  {selected && (
                    <CheckIcon className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </li>
              );
            })}
          </ul>

          {!gebouw.showAll && (
            <button
              type="button"
              onClick={() => onChange(index, { showAll: true })}
              className="w-full text-xs text-center text-blue-500 hover:text-blue-700 py-2 border-t border-gray-100 hover:bg-blue-50 transition-colors font-medium"
            >
              Meer tonen (t/m verdieping {TOTAL_FLOORS})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LocatiesToevoegen() {
  const [type, setType] = useState("");
  const [naam, setNaam] = useState("");
  const [extraCheckin, setExtraCheckin] = useState("");
  const [plaats, setPlaats] = useState("");
  const [adres, setAdres] = useState("");
  const [contactPersoon, setContactPersoon] = useState("");
  const [telefoonnummer, setTelefoonnummer] = useState("");
  const [perceel, setPerceel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [opAfroep, setOpAfroep] = useState(false);
  const [perJaar, setPerJaar] = useState("1");

  const { toast, showToast, hideToast } = useToast();

  const typeOptions = ["type 1", "type 2", "type 3"];
  const extraCheckinOptions = ["Ja", "Nee"];
  const perceelOptions = ["Perceel 2", "Perceel 5"];

  const [gebouwen, setGebouwen] = useState<Gebouw[]>([
    { naam: "Gebouw 1", verdiepingen: [] as string[], showAll: false },
  ]);

  const addGebouw = () =>
    setGebouwen([
      ...gebouwen,
      { naam: "", verdiepingen: [] as string[], showAll: false },
    ]);

  const updateGebouw = (index: number, updates: Partial<Gebouw>) => {
    setGebouwen((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...updates } : g)),
    );
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
    if (gebouwen.some((g) => g.verdiepingen.length === 0)) {
      showToast("Selecteer minimaal 1 verdieping per gebouw", "error");
      return false;
    }
    return true;
  }

  function checkValidValues(): boolean {
    return ["Perceel 2", "Perceel 5"].includes(perceel);
  }

  async function handleSubmit() {
    if (!checkValues()) return;
    if (!checkValidValues()) return;

    setSubmitting(true);

    let afstand: number | null = null;
    try {
      const res = await fetch("/api/afstand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adres: `${adres}, ${plaats}, Nederland` }),
      });
      const distData = await res.json();
      if (distData.afstand_km) afstand = parseFloat(distData.afstand_km);
    } catch (e) {
      console.log("Afstand kon niet berekend worden", e);
    }

    const { data: percelen, error: perceelError } = await supabase
      .from("percelen")
      .select("id")
      .eq("naam", perceel)
      .single();

    if (perceelError) {
      showToast("Er ging iets mis, probeer het opnieuw", "error");
      return;
    }

    const { data: locatie, error: locatieError } = await supabase
      .from("locaties")
      .insert({
        perceel_id: percelen.id,
        naam,
        type,
        plaats,
        adres,
        extra_checkin: extraCheckin === "Ja",
        contact_persoon: contactPersoon,
        telefoonnummer,
        afstand,
        op_afroep: opAfroep,
        per_jaar: opAfroep ? null : parseInt(perJaar),
      })
      .select("id")
      .single();

    if (locatieError) {
      showToast("Er ging iets mis, probeer het opnieuw", "error");
      console.log(locatieError);
      return;
    }

    for (const gebouw of gebouwen) {
      const { data: bouwData, error: bouwError } = await supabase
        .from("bouwdeel")
        .insert({ locatie_id: locatie.id, naam: gebouw.naam })
        .select("id")
        .single();

      if (bouwError) {
        showToast("Er ging iets mis, probeer het opnieuw", "error");
        return;
      }

      const verdiepingRows = gebouw.verdiepingen.map((v) => ({
        bouwdeel_id: bouwData.id,
        naam: SPECIAL_FLOORS.includes(v) ? v : `Verdieping ${v}`,
      }));

      const { error: vError } = await supabase
        .from("verdiepingen")
        .insert(verdiepingRows);

      if (vError) {
        showToast("Er ging iets mis bij verdiepingen", "error");
        return;
      }
    }
    setSubmitting(false);
    showToast("Locatie toegevoegd", "success");
    setTimeout(() => router.push("/locaties"), 1000);
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
              <DropdownBig
                title="Op afroep"
                options={["Ja", "Nee"]}
                value={opAfroep ? "Ja" : "Nee"}
                placeholder="Selecteer"
                onChange={(v) => setOpAfroep(v === "Ja")}
              />

              {!opAfroep && (
                <DropdownBig
                  title="Per jaar"
                  options={["1", "2", "3", "4", "6", "12"]}
                  value={perJaar}
                  placeholder="Selecteer"
                  onChange={setPerJaar}
                />
              )}
            </form>

            <div className="flex flex-col gap-3 mt-6">
              <p className="text-sm font-medium text-gray-700">
                Gebouwen & verdiepingen
              </p>

              {gebouwen.map((gebouw, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={gebouw.naam}
                    onChange={(e) =>
                      updateGebouw(index, { naam: e.target.value })
                    }
                    placeholder={`Gebouw ${index + 1}`}
                    className="w-36 h-9 px-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 transition-all duration-150"
                  />

                  <div className="flex-1">
                    <VerdiepingenSelect
                      gebouw={gebouw}
                      index={index}
                      onChange={updateGebouw}
                    />
                  </div>

                  {gebouwen.length > 1 && (
                    <button
                      type="button"
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
                type="button"
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
                icon={<PlusIcon />}
                label={submitting ? "Bezig..." : "Toevoegen"}
                onClick={handleSubmit}
                disabled={submitting}
              />
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
