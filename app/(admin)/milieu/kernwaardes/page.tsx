"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/layout/dropdown";

interface Reinigmethode {
  id: string;
  naam: string;
  waterverbruik: number;
  afvalwater: number;
  chemieverbruik: number;
  stroom: number;
  verpakking: number;
}

export default function NieuweReinigmethodePage() {
  const { toast, showToast, hideToast } = useToast();
  const router = useRouter();

  const [bestaande, setBestaande] = useState<Reinigmethode[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [naam, setNaam] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [waterverbruik, setWaterverbruik] = useState("");
  const [afvalwater, setAfvalwater] = useState("");
  const [chemieverbruik, setChemieverbruik] = useState("");
  const [stroom, setStroom] = useState("");
  const [verpakking, setVerpakking] = useState("");
  const [vergelijkMetId, setVergelijkMetId] = useState<string>("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reinigings_methodes")
        .select(
          "id, naam, waterverbruik, afvalwater, chemieverbruik, stroom, verpakking",
        )
        .order("naam");
      setBestaande(data ?? []);
    }
    load();
  }, []);

  const vergelijkMet = bestaande.find((b) => b.id === vergelijkMetId) ?? null;

  async function handleSave() {
    if (!naam) {
      showToast("Vul een naam in", "error");
      return;
    }
    setSaving(true);

    const row: any = {
      naam,
      beschrijving,
      waterverbruik: parseFloat(waterverbruik) || 0,
      afvalwater: parseFloat(afvalwater) || 0,
      chemieverbruik: parseFloat(chemieverbruik) || 0,
      stroom: parseFloat(stroom) || 0,
      verpakking: parseFloat(verpakking) || 0,
      // Old values from comparison method
      waterverbruik_old: vergelijkMet?.waterverbruik ?? null,
      afvalwater_old: vergelijkMet?.afvalwater ?? null,
      chemieverbruik_old: vergelijkMet?.chemieverbruik ?? null,
      stroom_old: vergelijkMet?.stroom ?? null,
      verpakking_old: vergelijkMet?.verpakking ?? null,
    };

    const { error } = await supabase.from("reinigings_methodes").insert(row);
    setSaving(false);

    if (error) {
      showToast("Opslaan mislukt: " + error.message, "error");
      return;
    }
    console.log("calling showToast");
    showToast("Reinigingsmethode opgeslagen", "success");
    setTimeout(() => router.back(), 1000);
  }

  const fields = [
    {
      label: "Waterverbruik per m²",
      unit: "L",
      value: waterverbruik,
      set: setWaterverbruik,
      old: vergelijkMet?.waterverbruik,
    },
    {
      label: "Afvalwater per m²",
      unit: "L",
      value: afvalwater,
      set: setAfvalwater,
      old: vergelijkMet?.afvalwater,
    },
    {
      label: "Chemieverbruik per m²",
      unit: "g",
      value: chemieverbruik,
      set: setChemieverbruik,
      old: vergelijkMet?.chemieverbruik,
    },
    {
      label: "Stroomverbruik per m²",
      unit: "Wh",
      value: stroom,
      set: setStroom,
      old: vergelijkMet?.stroom,
    },
    {
      label: "Verpakking per m²",
      unit: "g",
      value: verpakking,
      set: setVerpakking,
      old: vergelijkMet?.verpakking,
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Milieu & Duurzaamheid" />

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-0.5">
                  Milieu & Duurzaamheid
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Nieuwe reinigingsmethode
                </h1>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-800">
                  Basisinformatie
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">
                    Naam
                  </p>
                  <input
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder="Bijv. Stoomreiniging"
                    className="w-full px-4 py-2.5 text-slate-700 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all placeholder:text-slate-300"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">
                    Beschrijving
                  </p>
                  <textarea
                    value={beschrijving}
                    onChange={(e) => setBeschrijving(e.target.value)}
                    placeholder="Korte omschrijving van de methode..."
                    rows={3}
                    className="w-full px-4 py-2.5 text-slate-700 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all placeholder:text-slate-300 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible min-w-screen">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-800">
                  Vergelijken met
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Optioneel — waardesworden opgeslagen als referentie
                </p>
              </div>
              <div className="px-5 py-5 w-screen">
                <Dropdown
                  options={[
                    { id: "", naam: "— Geen vergelijking —" } as any,
                    ...bestaande,
                  ]}
                  displayKey="naam"
                  value={
                    vergelijkMetId
                      ? (bestaande.find((b) => b.id === vergelijkMetId) ?? null)
                      : null
                  }
                  placeholder="— Geen vergelijking —"
                  onChange={(e: any) => setVergelijkMetId(e.id ?? "")}
                  className="w-full"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-sm font-bold text-slate-800">Kernwaarden</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Milieu impact per m²
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="grid grid-cols-[1fr_140px_140px] gap-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400"></p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Nieuwe waarde
                  </p>
                  {vergelijkMet && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Referentie ({vergelijkMet.naam})
                    </p>
                  )}
                </div>

                {fields.map((f) => (
                  <div
                    key={f.label}
                    className={`grid gap-4 items-center ${vergelijkMet ? "grid-cols-[1fr_140px_140px]" : "grid-cols-[1fr_140px]"}`}
                  >
                    <p className="text-sm font-semibold text-slate-700">
                      {f.label}
                    </p>
                    <div className="relative">
                      <input
                        value={f.value}
                        onChange={(e) => f.set(e.target.value)}
                        type="number"
                        placeholder="0"
                        className="w-full text-slate-700  px-3 pr-10 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        {f.unit}
                      </span>
                    </div>
                    {vergelijkMet && (
                      <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm text-amber-500 font-medium">
                          {f.old ?? "—"}{" "}
                          <span className="text-xs text-slate-400">
                            {f.unit}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !naam}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <PlusIcon className="w-4 h-4" />
              )}
              Reinigingsmethode opslaan
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
