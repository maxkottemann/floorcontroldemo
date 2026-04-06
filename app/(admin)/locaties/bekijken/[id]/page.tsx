"use client";
import Card from "@/components/layout/card";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/hooks/usetoasts";
import Toast from "@/components/layout/toast";
import { useParams } from "next/navigation";
import { Locatie } from "@/types/locatie";

function InfoBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

export default function LocatieBekijkenPage() {
  const { toast, showToast, hideToast } = useToast();
  const { id } = useParams();
  const [locatie, setLocatie] = useState<Locatie>();

  useEffect(() => {
    async function getData() {
      if (!id) return;
      const { data, error } = await supabase
        .from("locaties")
        .select(
          "naam, percelen(naam), plaats, adres, type, extra_checkin, contact_persoon, telefoonnummer",
        )
        .eq("id", id)
        .single();
      console.log(data);

      if (error) {
        console.error(error);
        return;
      }

      setLocatie({
        ...data,
        perceel:
          (data?.percelen as unknown as { naam: string } | null)?.naam ?? "",
      });
    }

    getData();
  }, [id]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Locatie bekijken" />

        <main className="flex-1 overflow-auto p-6 space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-2">
                  Locatie
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {locatie?.naam ?? "—"}
                  </h2>
                  {locatie?.extra_checkin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-500 border border-orange-100 uppercase tracking-wider">
                      Extra check-in
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                    {locatie?.type}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-medium text-gray-500">
                    {locatie?.perceel || "Onbekend"}
                  </span>
                </div>
              </div>

              <a href={`/locaties/bewerken/${id}`}>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Wijzigen
                </button>
              </a>
            </div>
          </Card>

          <Card>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <InfoBlock label="Plaats" value={locatie?.plaats} />
              <InfoBlock label="Adres" value={locatie?.adres} />
              <InfoBlock
                label="Contactpersoon"
                value={locatie?.contact_persoon}
              />
              <InfoBlock
                label="Telefoonnummer"
                value={locatie?.telefoonnummer}
              />
            </div>
          </Card>

          {/* Navigation card */}
          <Card>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium mb-4">
              Gerelateerd
            </p>
            <a
              href={`/locaties/${id}/kamers`}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Kamers</p>
                  <p className="text-xs text-gray-400">
                    Bekijk alle kamers van deze locatie
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </a>
          </Card>
        </main>
      </div>
    </div>
  );
}
