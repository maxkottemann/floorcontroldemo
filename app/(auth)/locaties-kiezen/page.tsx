"use client";

// app/(auth)/locaties-kiezen/page.tsx
// Step 3: User selects which locations they need access to

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircleIcon,
  MapPinIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

interface Locatie {
  id: string;
  naam: string;
  type: string;
  plaats: string;
  perceel: string;
}

export default function LocatiesKiezenPage() {
  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/locaties-publiek");
      const data = await res.json();
      setLocaties(
        data.map((l: any) => ({
          id: l.id,
          naam: l.naam,
          type: l.type,
          plaats: l.plaats,
          perceel: l.percelen?.naam ?? "",
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  function toggleLocatie(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      setError("Selecteer minimaal één locatie");
      return;
    }
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Niet ingelogd");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase
      .from("account_aanvraag")
      .update({ locaties_geselecteerd: selected, stap: "locaties_aangevraagd" })
      .eq("email", user.email);

    setSaving(false);
    if (err) {
      setError("Er ging iets mis. Probeer het opnieuw.");
      console.log(err);
      return;
    }
    setDone(true);
  }

  const grouped = locaties.reduce(
    (acc, l) => {
      const key = l.perceel || "Overig";
      if (!acc[key]) acc[key] = [];
      acc[key].push(l);
      return acc;
    },
    {} as Record<string, Locatie[]>,
  );

  if (done) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              Locaties aangevraagd
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Uw locatieselectie is ingediend. U ontvangt een e-mail zodra de
              beheerder uw toegang heeft goedgekeurd.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <img
            src="/duofortlogo.png"
            className="h-10 mx-auto mb-4 object-contain"
            alt="Duofort"
          />
          <h1 className="text-2xl font-bold text-slate-900">Locaties kiezen</h1>
          <p className="text-sm text-slate-400 mt-1">
            Selecteer de locaties waar u toegang tot wilt
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">
                Beschikbare locaties
              </p>
              <span className="text-xs text-slate-400">
                {selected.length} geselecteerd
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([perceel, locs]) => (
                  <div key={perceel}>
                    <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/60">
                      {perceel}
                    </p>
                    {locs.map((l) => {
                      const isSelected = selected.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLocatie(l.id)}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all border-b border-slate-50 last:border-0
                          ${isSelected ? "bg-p/5" : "hover:bg-slate-50"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors
                          ${isSelected ? "bg-p text-white" : "bg-slate-100 text-slate-400"}`}
                          >
                            {isSelected ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <BuildingOffice2Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${isSelected ? "text-p" : "text-slate-700"}`}
                            >
                              {l.naam}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {l.type && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                                  {l.type}
                                </span>
                              )}
                              {l.plaats && (
                                <span className="flex items-center gap-0.5 text-xs text-slate-400">
                                  <MapPinIcon className="w-3 h-3" />
                                  {l.plaats}
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                          ${isSelected ? "bg-p border-p" : "border-slate-200"}`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 space-y-3">
              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving || selected.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                Locaties aanvragen · {selected.length} geselecteerd
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
