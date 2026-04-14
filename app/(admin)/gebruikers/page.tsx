"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  MapPinIcon,
  EnvelopeIcon,
  UserIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface Aanvraag {
  id: string;
  email: string;
  naam: string | null;
  rol: string | null;
  stap: string;
  goedgekeurd: boolean;
  locaties_geselecteerd: string[] | null;
  aangemaakt_op: string;
}

interface Locatie {
  id: string;
  naam: string;
  plaats: string | null;
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StapBadge({ stap }: { stap: string }) {
  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    aangevraagd: {
      label: "Nieuw",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    locaties_kiezen: {
      label: "Locaties kiezen",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
    },
    locaties_gekozen: {
      label: "Locaties gekozen",
      bg: "bg-violet-50",
      text: "text-violet-700",
      border: "border-violet-100",
    },
    goedgekeurd: {
      label: "Goedgekeurd",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
    },
    afgewezen: {
      label: "Afgewezen",
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
    },
  };
  const s = config[stap] ?? {
    label: stap,
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
    </span>
  );
}

function LocatieSelectPopup({
  aanvraag,
  alleLocaties,
  onClose,
  onSave,
}: {
  aanvraag: Aanvraag;
  alleLocaties: Locatie[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    aanvraag.locaties_geselecteerd ?? [],
  );
  const [zoek, setZoek] = useState("");

  const filtered = alleLocaties.filter((l) =>
    [l.naam, l.plaats].some((f) =>
      f?.toLowerCase().includes(zoek.toLowerCase()),
    ),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-800">Locaties beheren</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {aanvraag.naam ?? aanvraag.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-50">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek locatie..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-lg border border-slate-100 outline-none focus:border-p/40 placeholder:text-slate-300 transition-all"
            />
          </div>
        </div>

        <ul className="max-h-64 overflow-y-auto divide-y divide-slate-50 px-2 py-1">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-300">
              Geen locaties gevonden
            </li>
          ) : (
            filtered.map((l) => {
              const isSelected = selected.includes(l.id);
              return (
                <li
                  key={l.id}
                  onClick={() => toggle(l.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-p/5" : "hover:bg-slate-50"}`}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${isSelected ? "bg-p border-p" : "border-slate-300 bg-white"}`}
                  >
                    {isSelected && (
                      <CheckIcon
                        className="w-3 h-3 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${isSelected ? "text-p" : "text-slate-700"}`}
                    >
                      {l.naam}
                    </p>
                    {l.plaats && (
                      <p className="text-xs text-slate-400">{l.plaats}</p>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">
            {selected.length} geselecteerd
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuleren
            </button>
            <button
              onClick={() => {
                onSave(selected);
                onClose();
              }}
              className="px-4 py-2 text-sm font-bold text-white bg-p hover:bg-p/90 rounded-lg transition-colors cursor-pointer"
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GebruikersPage() {
  const { toast, showToast, hideToast } = useToast();
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([]);
  const [alleLocaties, setAlleLocaties] = useState<Locatie[]>([]);
  const [activeTab, setActiveTab] = useState<"nieuw" | "locaties" | "klaar">(
    "nieuw",
  );
  const [zoekterm, setZoekterm] = useState("");
  const [loading, setLoading] = useState(true);
  const [locatiePopup, setLocatiePopup] = useState<Aanvraag | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: req }, { data: loc }] = await Promise.all([
        supabase
          .from("account_aanvraag")
          .select("*")
          .order("aangemaakt_op", { ascending: false }),
        supabase.from("locaties").select("id,naam,plaats").order("naam"),
      ]);
      setAanvragen(req ?? []);
      setAlleLocaties(loc ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const [confirm, setConfirm] = useState<{
    id: string;
    type: "goedkeuren" | "afwijzen" | "aanmaken";
  } | null>(null);

  async function goedkeurenStap1(a: Aanvraag) {
    const { error } = await supabase
      .from("account_aanvraag")
      .update({ stap: "locaties_kiezen" })
      .eq("id", a.id);
    if (error) return showToast("Er ging iets mis", "error");
    setAanvragen((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, stap: "locaties_kiezen" } : x)),
    );
    showToast(
      "Aanvraag goedgekeurd — gebruiker kan nu locaties kiezen",
      "success",
    );
  }

  async function afwijzen(a: Aanvraag) {
    const { error } = await supabase
      .from("account_aanvraag")
      .update({ stap: "afgewezen", goedgekeurd: false })
      .eq("id", a.id);
    if (error) return showToast("Er ging iets mis", "error");
    setAanvragen((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, stap: "afgewezen" } : x)),
    );
    showToast("Aanvraag afgewezen", "success");
  }

  async function saveLocaties(a: Aanvraag, ids: string[]) {
    const { error } = await supabase
      .from("account_aanvraag")
      .update({ locaties_geselecteerd: ids })
      .eq("id", a.id);
    if (error) return showToast("Er ging iets mis", "error");
    setAanvragen((prev) =>
      prev.map((x) =>
        x.id === a.id ? { ...x, locaties_geselecteerd: ids } : x,
      ),
    );
    showToast("Locaties opgeslagen", "success");
  }

  async function accountAanmaken(a: Aanvraag) {
    const res = await fetch("/api/account-aanmaken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: a.id,
        email: a.email,
        naam: a.naam,
        locaties_geselecteerd: a.locaties_geselecteerd,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      showToast(error ?? "Er ging iets mis", "error");
      return;
    }

    setAanvragen((prev) =>
      prev.map((x) =>
        x.id === a.id ? { ...x, stap: "goedgekeurd", goedgekeurd: true } : x,
      ),
    );
    showToast("Account aangemaakt", "success");
  }

  const tabs = [
    { key: "nieuw", label: "Nieuw", stappen: ["aangevraagd"] },
    {
      key: "locaties",
      label: "Locaties kiezen",
      stappen: ["locaties_kiezen", "locaties_gekozen"],
    },
    { key: "klaar", label: "Afgerond", stappen: ["goedgekeurd", "afgewezen"] },
  ] as const;

  const activeStappen = tabs.find((t) => t.key === activeTab)?.stappen ?? [];
  const filtered = aanvragen.filter(
    (a) =>
      activeStappen.includes(a.stap as never) &&
      [a.naam, a.email].some((f) =>
        f?.toLowerCase().includes(zoekterm.toLowerCase()),
      ),
  );

  const counts = {
    nieuw: aanvragen.filter((a) => a.stap === "aangevraagd").length,
    locaties: aanvragen.filter((a) =>
      ["locaties_kiezen", "locaties_gekozen"].includes(a.stap),
    ).length,
    klaar: aanvragen.filter((a) =>
      ["goedgekeurd", "afgewezen"].includes(a.stap),
    ).length,
  };

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      {locatiePopup && (
        <LocatieSelectPopup
          aanvraag={locatiePopup}
          alleLocaties={alleLocaties}
          onClose={() => setLocatiePopup(null)}
          onSave={(ids) => saveLocaties(locatiePopup, ids)}
        />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Gebruikers" />

        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Beheer
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Gebruikers
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Beheer accountaanvragen en gebruikerstoegang
                </p>
              </div>
              {counts.nieuw > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <UserPlusIcon className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-amber-600">
                    {counts.nieuw} nieuwe aanvra
                    {counts.nieuw === 1 ? "ag" : "gen"}
                  </p>
                </div>
              )}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Tabs + search */}
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {tabs.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {label}
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-slate-100 text-slate-500" : "bg-slate-200 text-slate-400"}`}
                      >
                        {counts[key]}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative ml-auto">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    value={zoekterm}
                    onChange={(e) => setZoekterm(e.target.value)}
                    placeholder="Zoek op naam of email..."
                    className="pl-9 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-p/40 placeholder:text-slate-300 transition-all w-56"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_180px_120px_140px_160px] px-5 py-2.5 border-b border-slate-50 bg-slate-50/60">
                {["Gebruiker", "E-mail", "Status", "Aangevraagd", "Acties"].map(
                  (h) => (
                    <p
                      key={h}
                      className="text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </p>
                  ),
                )}
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <UserPlusIcon className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">
                      Geen aanvragen gevonden
                    </p>
                  </div>
                ) : (
                  filtered.map((a) => (
                    <div
                      key={a.id}
                      className="grid grid-cols-[1fr_180px_120px_140px_160px] items-center px-5 py-3.5"
                    >
                      {/* Naam */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4 text-p" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {a.naam ?? "—"}
                          </p>
                          {a.locaties_geselecteerd?.length ? (
                            <p className="text-xs text-slate-400">
                              {a.locaties_geselecteerd.length} locatie
                              {a.locaties_geselecteerd.length !== 1
                                ? "s"
                                : ""}{" "}
                              geselecteerd
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <p className="text-sm text-slate-500 truncate">
                          {a.email}
                        </p>
                      </div>

                      <div className="max-w-10">
                        <StapBadge stap={a.stap} />
                      </div>

                      <p className="text-sm text-slate-400">
                        {formatDate(a.aangemaakt_op)}
                      </p>

                      <div className="flex items-center gap-2">
                        {a.stap === "aangevraagd" &&
                          (confirm?.id === a.id ? (
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${confirm.type === "goedkeuren" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
                            >
                              <p
                                className={`text-xs font-semibold ${confirm.type === "goedkeuren" ? "text-emerald-700" : "text-red-600"}`}
                              >
                                Zeker?
                              </p>
                              <button
                                onClick={() => {
                                  confirm.type === "goedkeuren"
                                    ? goedkeurenStap1(a)
                                    : afwijzen(a);
                                  setConfirm(null);
                                }}
                                className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${confirm.type === "goedkeuren" ? "text-emerald-700 hover:bg-emerald-100" : "text-red-600 hover:bg-red-100"} transition-colors`}
                              >
                                Ja
                              </button>
                              <button
                                onClick={() => setConfirm(null)}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                              >
                                Nee
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  setConfirm({ id: a.id, type: "goedkeuren" })
                                }
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Goedkeuren
                              </button>
                              <button
                                onClick={() =>
                                  setConfirm({ id: a.id, type: "afwijzen" })
                                }
                                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ))}
                        {(a.stap === "locaties_kiezen" ||
                          a.stap === "locaties_gekozen") &&
                          (confirm?.id === a.id ? (
                            <div
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${confirm.type === "aanmaken" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}
                            >
                              <p
                                className={`text-xs font-semibold ${confirm.type === "aanmaken" ? "text-emerald-700" : "text-red-600"}`}
                              >
                                Zeker?
                              </p>
                              <button
                                onClick={() => {
                                  confirm.type === "aanmaken"
                                    ? accountAanmaken(a)
                                    : afwijzen(a);
                                  setConfirm(null);
                                }}
                                className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${confirm.type === "aanmaken" ? "text-emerald-700 hover:bg-emerald-100" : "text-red-600 hover:bg-red-100"} transition-colors`}
                              >
                                Ja
                              </button>
                              <button
                                onClick={() => setConfirm(null)}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                              >
                                Nee
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setLocatiePopup(a)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-p bg-p/8 hover:bg-p/15 border border-p/20 rounded-lg transition-colors cursor-pointer"
                              >
                                <MapPinIcon className="w-3.5 h-3.5" />
                                Locaties
                              </button>
                              {a.stap === "locaties_gekozen" && (
                                <button
                                  onClick={() =>
                                    setConfirm({ id: a.id, type: "aanmaken" })
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  <UserPlusIcon className="w-3.5 h-3.5" />
                                  Aanmaken
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setConfirm({ id: a.id, type: "afwijzen" })
                                }
                                className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ))}
                        {(a.stap === "goedgekeurd" ||
                          a.stap === "afgewezen") && (
                          <p className="text-xs text-slate-300 italic">
                            Geen acties
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                <p className="text-xs text-slate-400">
                  {filtered.length} aanvra{filtered.length === 1 ? "ag" : "gen"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
