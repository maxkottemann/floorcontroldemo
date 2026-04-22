"use client";

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
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session)
        setError("Niet ingelogd — open de link uit uw e-mail opnieuw");
    }
    checkSession();
  }, []);

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
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setError("Sessie verlopen, probeer de link opnieuw te openen");
      setSaving(false);
      return;
    }
    const { error: err } = await supabase
      .from("account_aanvraag")
      .update({ locaties_geselecteerd: selected, stap: "locaties_aangevraagd" })
      .eq("email", session.user.email);
    setSaving(false);
    if (err) {
      setError("Er ging iets mis. Probeer het opnieuw.");
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
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
              Ingediend
            </p>
            <p className="text-xl font-bold text-slate-800">
              Locaties aangevraagd
            </p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-xs mx-auto">
              Uw locatieselectie is ingediend. U ontvangt een e-mail zodra de
              beheerder uw toegang heeft goedgekeurd.
            </p>
          </div>
          <a
            href="/login"
            className="mt-2 text-sm text-[#154273] font-bold hover:text-[#154273]/70 transition-colors"
          >
            Terug naar inloggen →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="text-center">
          <img
            src="/logo.png"
            className="h-10 mx-auto mb-5 object-contain"
            alt="FloorControl"
          />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
            Toegang aanvragen
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Kies uw locaties
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Selecteer de locaties waar u toegang tot wilt
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 border-[#154273] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Beschikbare locaties
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {locaties.length} locaties beschikbaar
                </p>
              </div>
              {selected.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#154273]/10 text-[#154273] text-xs font-bold rounded-full">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {selected.length} geselecteerd
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([perceel, locs]) => (
                  <div key={perceel}>
                    <p className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/80 border-b border-slate-100 sticky top-0">
                      {perceel}
                    </p>
                    {locs.map((l) => {
                      const isSelected = selected.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => toggleLocatie(l.id)}
                          className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all border-b border-slate-50 last:border-0 active:bg-slate-100
                        ${isSelected ? "bg-[#154273]/5" : "hover:bg-slate-50"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#154273] text-white" : "bg-slate-100 text-slate-400"}`}
                          >
                            {isSelected ? (
                              <CheckCircleIcon className="w-4 h-4" />
                            ) : (
                              <BuildingOffice2Icon className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${isSelected ? "text-[#154273]" : "text-slate-700"}`}
                            >
                              {l.naam}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
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
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-[#154273] border-[#154273]" : "border-slate-200"}`}
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

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 space-y-3">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={saving || selected.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#154273] hover:bg-[#0f2f52] text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Locaties aanvragen
                    {selected.length > 0
                      ? ` · ${selected.length} geselecteerd`
                      : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Al een account?{" "}
          <a
            href="/login"
            className="text-[#154273] font-bold hover:text-[#154273]/70 transition-colors"
          >
            Inloggen
          </a>
        </p>
      </div>
    </div>
  );
}
