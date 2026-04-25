"use client";

import Card from "@/components/layout/card";
import Dropdown from "@/components/layout/dropdown";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import MainButton from "@/components/layout/mainbutton";
import {
  ChatBubbleBottomCenterTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import DropdownString from "@/components/layout/dropdownstrings";

interface locatie {
  id: string;
  naam: string;
  type: string;
  perceel: string;
  extra_checkin: boolean;
}

interface Perceel {
  id: string;
  naam: string;
}

export default function locatiePage() {
  const [active_perceelid, setActivePerceelid] = useState("");
  const [alleLocaties, setAlleLocaties] = useState<locatie[]>([]);
  const [zoekterm, setZoekTerm] = useState("");
  const [totalLocaties, setTotalLocaties] = useState<number>(0);
  const [allePercelen, setAllePercelen] = useState<Perceel[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locatieType, setLocatieType] = useState("");

  const filtered = alleLocaties.filter(
    (l) =>
      l.naam.toLowerCase().includes(zoekterm.toLowerCase()) &&
      l.type.toLowerCase().includes(locatieType.toLowerCase()),
  );

  useEffect(() => {
    async function getPercelen() {
      const { data, error } = await supabase
        .from("percelen")
        .select("id, naam")
        .order("naam", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      setAllePercelen(data || []);
      if (data && data.length > 0) setActivePerceelid(data[0].id);
    }
    getPercelen();
  }, []);

  useEffect(() => {
    if (!active_perceelid) return;
    async function getAllLocaties() {
      const { data, error } = await supabase
        .from("locaties")
        .select("id, naam, type, percelen!inner(naam), extra_checkin")
        .eq("perceel_id", active_perceelid);
      if (error) {
        console.error(error);
        return;
      }
      setTotalLocaties(data.length || 0);
      setAlleLocaties(
        (data || []).map((item: any) => ({
          id: item.id,
          naam: item.naam,
          type: item.type,
          extra_checkin: item.extra_checkin,
          perceel: item.percelen.naam || "",
        })),
      );
    }
    getAllLocaties();
  }, [active_perceelid]);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Locaties"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-6 bg-bg">
          <div className="hidden md:block">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Alle locaties
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Totaal</span>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                      {totalLocaties}
                    </span>
                  </div>
                </div>
                <MainButton
                  icon={<PlusIcon />}
                  href="/locaties/toevoegen"
                  label="Locatie toevoegen"
                />
              </div>

              <div className="border-t border-gray-100 mb-5" />

              <div className="flex flex-row items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    value={zoekterm || ""}
                    onChange={(e) => setZoekTerm(e.target.value)}
                    type="text"
                    placeholder="Zoeken op naam..."
                    className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 transition-all duration-150"
                  />
                </div>
                <DropdownString
                  className="w-52"
                  placeholder="Selecteer een perceel"
                  options={allePercelen.map((p) => p.naam)}
                  onChange={(naam) => {
                    const p = allePercelen.find((p) => p.naam === naam);
                    if (p) setActivePerceelid(p.id);
                  }}
                  value={
                    allePercelen.find((p) => p.id === active_perceelid)?.naam ??
                    ""
                  }
                />
                <DropdownString
                  placeholder="Locatie type"
                  className="w-40"
                  options={["Type 1", "Type 2", "Type 3"]}
                  value={locatieType}
                  onChange={(e) => setLocatieType(e)}
                />
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Geen locaties gevonden
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Pas je zoekopdracht aan of voeg een locatie toe
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {l.naam}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">
                              {l.type}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {l.perceel}
                            </span>
                          </div>
                        </div>
                        {l.extra_checkin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 text-xs font-medium border border-orange-100">
                            <ChatBubbleBottomCenterTextIcon className="w-3 h-3 mr-2"></ChatBubbleBottomCenterTextIcon>{" "}
                            Aanmeldprocedure
                          </span>
                        )}
                      </div>
                      <a href={`/locaties/bekijken/${l.id}`}>
                        <button className="text-xs font-medium text-gray-400 border border-gray-200 rounded-md px-3 py-1 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 active:scale-95 transition-all duration-150 cursor-pointer">
                          Bekijk
                        </button>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* ── Mobile layout (below md) ── */}
          <div className="md:hidden space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Locaties</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {totalLocaties} locaties
                </p>
              </div>
              <MainButton
                icon={<PlusIcon />}
                href="/locaties/toevoegen"
                label="Toevoegen"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={zoekterm || ""}
                onChange={(e) => setZoekTerm(e.target.value)}
                type="text"
                placeholder="Zoeken op naam..."
                className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Filters — scrollable row but dropdowns can overflow */}
            <div className="flex gap-2">
              <div className="flex gap-2 overflow-y-visible pb-1 flex-1 min-w-0">
                <div className="shrink-0 relative z-20">
                  <DropdownString
                    placeholder="Perceel"
                    options={allePercelen.map((p) => p.naam)}
                    onChange={(naam) => {
                      const p = allePercelen.find((p) => p.naam === naam);
                      if (p) setActivePerceelid(p.id);
                    }}
                    value={
                      allePercelen.find((p) => p.id === active_perceelid)
                        ?.naam ?? ""
                    }
                  />
                </div>
                <div className="shrink-0 relative z-20">
                  <DropdownString
                    placeholder="Type"
                    options={["Type 1", "Type 2", "Type 3"]}
                  />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Geen locaties gevonden
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pas je zoekopdracht aan of voeg een locatie toe
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`/locaties/bekijken/${l.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-100 rounded-xl active:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {l.naam}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {l.type}
                          </span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400">
                            {l.perceel}
                          </span>
                          {l.extra_checkin && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500 text-[10px] font-medium border border-orange-100">
                              Extra check-in
                            </span>
                          )}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
