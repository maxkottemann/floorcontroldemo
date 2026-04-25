"use client";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/hooks/usetoasts";
import Toast from "@/components/layout/toast";
import { useParams } from "next/navigation";
import { Locatie } from "@/types/locatie";
import {
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UserIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { BsHouse, BsHouseAdd, BsPassport } from "react-icons/bs";

function InfoBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#154273] shrink-0" />}
        <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function LocatieBekijkenPage() {
  const { toast, hideToast } = useToast();
  const { id } = useParams();
  const [locatie, setLocatie] = useState<Locatie>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function getData() {
      if (!id) return;
      const { data, error } = await supabase
        .from("locaties")
        .select(
          "id, naam, percelen(naam), plaats, adres, type, extra_checkin, contact_persoon, telefoonnummer",
        )
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setLocatie({
        id: data.id,
        naam: data.naam,
        type: data.type,
        plaats: data.plaats,
        adres: data.adres,
        extra_checkin: data.extra_checkin,
        contact_persoon: data.contact_persoon,
        telefoonnummer: data.telefoonnummer,
        perceel:
          (data?.percelen as unknown as { naam: string } | null)?.naam ?? "",
      });
    }
    getData();
  }, [id]);

  const relatedLinks = [
    {
      href: `/locaties/kamertoevoegen/${id}`,
      icon: <BsHouseAdd className="w-4 h-4 text-[#154273]" />,
      label: "Kamers toevoegen",
      sub: "Bekijk alle kamers van deze locatie",
    },
    {
      href: `/vloerenpaspoort`,
      icon: <BsPassport className="w-4 h-4 text-[#154273]" />,
      label: "Vloerenpaspoort",
      sub: "Bekijk vloerenpaspoort van deze locatie",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Locatie bekijken"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className="flex flex-col gap-4 md:gap-6">
            {/* ── Header ── */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#154273] uppercase mb-1">
                Locatie
              </p>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight truncate">
                    {locatie?.naam ?? "—"}
                  </h1>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {locatie?.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#154273]/10 text-[#154273] border border-[#154273]/20">
                        {locatie.type}
                      </span>
                    )}
                    {locatie?.extra_checkin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-emerald-100">
                        <CheckBadgeIcon className="w-3.5 h-3.5" />
                        Aanmeldprocedure
                      </span>
                    )}
                  </div>

                  {/* Info chips — wrap on mobile */}
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                    {locatie?.adres && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <MapPinIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">{locatie.adres}</span>
                        {locatie.plaats && (
                          <span className="text-gray-400 hidden sm:inline">
                            · {locatie.plaats}
                          </span>
                        )}
                      </div>
                    )}
                    {locatie?.perceel && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <BuildingOfficeIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">{locatie.perceel}</span>
                      </div>
                    )}
                    {locatie?.contact_persoon && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <UserIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">
                          {locatie.contact_persoon}
                        </span>
                      </div>
                    )}
                    {locatie?.telefoonnummer && (
                      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg shadow-sm text-sm text-gray-700">
                        <PhoneIcon className="w-4 h-4 text-[#154273] shrink-0" />
                        <span className="font-medium">
                          {locatie.telefoonnummer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit button — icon only on mobile */}
                <a href={`/locaties/bewerken/${id}`} className="shrink-0">
                  <button className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-semibold text-gray-700 rounded-xl shadow-sm transition-colors whitespace-nowrap">
                    <PencilSquareIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Wijzigen</span>
                  </button>
                </a>
              </div>
            </div>

            {/* ── Locatiegegevens ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Locatiegegevens
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Contactinformatie en adresgegevens
                </p>
              </div>
              <div className="p-4 md:p-6">
                {/* 1 col on mobile, 2 col on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8 md:gap-y-6">
                  <InfoBlock
                    label="Plaats"
                    value={locatie?.plaats}
                    icon={MapPinIcon}
                  />
                  <InfoBlock
                    label="Adres"
                    value={locatie?.adres}
                    icon={MapPinIcon}
                  />
                  <InfoBlock
                    label="Contactpersoon"
                    value={locatie?.contact_persoon}
                    icon={UserIcon}
                  />
                  <InfoBlock
                    label="Telefoonnummer"
                    value={locatie?.telefoonnummer}
                    icon={PhoneIcon}
                  />
                </div>
              </div>
            </div>

            {/* ── Gerelateerd ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 md:px-5 py-4 border-b border-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Gerelateerd
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Navigeer naar gerelateerde pagina's
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {relatedLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 md:px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#154273]/10 flex items-center justify-center shrink-0 group-hover:bg-[#154273]/20 transition-colors">
                      {link.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {link.label}
                      </p>
                      <p className="text-xs text-gray-400 hidden sm:block">
                        {link.sub}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-200 group-hover:text-[#154273] shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
