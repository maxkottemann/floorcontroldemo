"use client";

// Admin page showing all account aanvragen with approve actions

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserPlusIcon,
  MapPinIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface Aanvraag {
  id: string;
  naam: string;
  email: string;
  stap: string;
  locaties_geselecteerd: string[] | null;
  aangemaakt_op: string;
}

interface Locatie {
  id: string;
  naam: string;
  type: string;
}

const STAP_CONFIG: Record<string, { label: string; color: string }> = {
  aangevraagd: { label: "Aangevraagd", color: "bg-slate-100 text-slate-500" },
  account_aangemaakt: {
    label: "Account aangemaakt",
    color: "bg-blue-50 text-blue-600",
  },
  locaties_aangevraagd: {
    label: "Locaties aangevraagd",
    color: "bg-amber-50 text-amber-600",
  },
  goedgekeurd: {
    label: "Goedgekeurd",
    color: "bg-emerald-50 text-emerald-600",
  },
};

function StapBadge({ stap }: { stap: string }) {
  const cfg = STAP_CONFIG[stap] ?? {
    label: stap,
    color: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

function AanvraagCard({
  aanvraag,
  locaties,
  onRefresh,
}: {
  aanvraag: Aanvraag;
  locaties: Locatie[];
  onRefresh: () => void;
}) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedLocaties = locaties.filter((l) =>
    aanvraag.locaties_geselecteerd?.includes(l.id),
  );

  async function handleAccountAanmaken() {
    setLoading(true);
    const res = await fetch("/api/account-aanmaken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: aanvraag.id,
        email: aanvraag.email,
        naam: aanvraag.naam,
      }),
    });
    const data = await res.json();
    console.log("Response:", data);
    setLoading(false);
    if (!res.ok) {
      showToast(data.error ?? "Mislukt", "error");
      return;
    }
    showToast("Account aangemaakt", "success");
    onRefresh();
  }

  async function handleLocatiesGoedkeuren() {
    setLoading(true);
    const res = await fetch("/api/locaties-goedkeuren", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: aanvraag.id,
        email: aanvraag.email,
        naam: aanvraag.naam,
        locaties_geselecteerd: aanvraag.locaties_geselecteerd,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      showToast(d.error ?? "Mislukt", "error");
      return;
    }
    showToast("Toegang volledig goedgekeurd", "success");
    onRefresh();
  }

  async function handleAfwijzen() {
    setLoading(true);
    await supabase
      .from("account_aanvraag")
      .update({ stap: "afgewezen" })
      .eq("id", aanvraag.id);
    setLoading(false);
    showToast("Aanvraag afgewezen", "error");
    onRefresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
          <UserPlusIcon className="w-5 h-5 text-p" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-800">{aanvraag.naam}</p>
            <StapBadge stap={aanvraag.stap} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{aanvraag.email}</p>
        </div>
        <button
          onClick={() => setOpen((p) => !p)}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer transition-colors"
        >
          {open ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-50 px-5 py-4 space-y-4">
          {/* Locaties */}
          {aanvraag.stap === "locaties_aangevraagd" &&
            selectedLocaties.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Aangevraagde locaties
                </p>
                <div className="space-y-1.5">
                  {selectedLocaties.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl"
                    >
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <p className="text-sm text-slate-700 font-medium">
                        {l.naam}
                      </p>
                      {l.type && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded ml-auto">
                          {l.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Actions */}
          <div className="flex gap-2">
            {aanvraag.stap === "aangevraagd" && (
              <>
                <button
                  onClick={handleAccountAanmaken}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-30 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  Account aanmaken
                </button>
                <button
                  onClick={handleAfwijzen}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-30 cursor-pointer border border-red-100"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </>
            )}

            {aanvraag.stap === "account_aangemaakt" && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl flex-1">
                <ClockIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600 font-medium">
                  Wachten op locatieselectie door gebruiker
                </p>
              </div>
            )}

            {aanvraag.stap === "locaties_aangevraagd" && (
              <>
                <button
                  onClick={handleLocatiesGoedkeuren}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-30 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  Locaties goedkeuren
                </button>
                <button
                  onClick={handleAfwijzen}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-30 cursor-pointer border border-red-100"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </>
            )}

            {aanvraag.stap === "goedgekeurd" && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex-1">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-600 font-semibold">
                  Volledig goedgekeurd
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GebruikersBeheerAanvragenPage() {
  const { toast, showToast, hideToast } = useToast();
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([]);
  const [locaties, setLocaties] = useState<Locatie[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("alle");

  async function load() {
    const [{ data: a }, { data: l }] = await Promise.all([
      supabase
        .from("account_aanvraag")
        .select("*")
        .order("aangemaakt_op", { ascending: false }),
      supabase.from("locaties").select("id, naam, type").order("naam"),
    ]);
    setAanvragen(a ?? []);
    setLocaties(l ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const tabs = [
    { key: "alle", label: "Alle" },
    { key: "aangevraagd", label: "Aangevraagd" },
    { key: "account_aangemaakt", label: "Wacht op locaties" },
    { key: "locaties_aangevraagd", label: "Te beoordelen" },
    { key: "goedgekeurd", label: "Goedgekeurd" },
  ];

  const filtered =
    filter === "alle" ? aanvragen : aanvragen.filter((a) => a.stap === filter);

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Account aanvragen" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Gebruikersbeheer
              </p>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Account aanvragen
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Beheer toegangsverzoeken van nieuwe gebruikers
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex-wrap">
              {tabs.map((t) => {
                const count =
                  t.key === "alle"
                    ? aanvragen.length
                    : aanvragen.filter((a) => a.stap === t.key).length;
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer
                      ${filter === t.key ? "bg-p text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                  >
                    {t.label}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-16 text-center">
                <UserPlusIcon className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  Geen aanvragen gevonden
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <AanvraagCard
                    key={a.id}
                    aanvraag={a}
                    locaties={locaties}
                    onRefresh={load}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
