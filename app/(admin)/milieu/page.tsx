"use client";

"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { reinigmethode } from "@/types/reinigmethodesduurzaamheid";
import { supabase } from "@/lib/supabase";
import Card from "@/components/layout/card";

export default function milieupage() {
  const { toast, showToast, hideToast } = useToast();

  const [reinigmethodes, setReinigMethodes] = useState<reinigmethode[]>([]);

  useEffect(() => {
    async function getReinigmethodes() {
      const { data, error } = await supabase
        .from("gewassen_vloeren_per_methode")
        .select("*");

      if (error) {
        showToast("Er ging iets mis,probeer het opnieuw", "error");
        console.log(error);
        return;
      }
      if (!data) {
        return;
      }
      console.log(data);

      setReinigMethodes(
        (data || []).map((d) => ({
          reinigmethode_id: d.reinigmethode_id,
          reinigmethode_naam: d.reinigmethode_naam,
          waterverbruik: d.waterverbruik,
          afvalwater: d.afvalwater,
          chemieverbruik: d.chemieverbruik,
          stroomverbruik: d.stroom,
          waterverbruik_old: d.waterverbruik_old,
          afvalwater_old: d.afvalwater_old,
          chemievebruik_old: d.chemieverbruik_old,
          stroom_old: d.stroom_old,
          vierkante_meter: d.totaal_vierkante_meter,
        })),
      );
    }
    getReinigmethodes();
  }, []);

  const safenumber = (v: any) => v ?? 0;

  function calcPercentageSave(old: number, newnum: number): number {
    if (!old) return 0;

    return ((old - newnum) / old) * 100;
  }

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Duurzaamheid" />

        <main className="flex-1 overflow-auto p-8">
          <Card>
            <div>
              <ul>
                {reinigmethodes.map((rm) => (
                  <li
                    key={rm.reinigmethode_id}
                    className="flex flex-row justify-between"
                  >
                    <div>
                      {rm.reinigmethode_naam} {""} {rm.vierkante_meter} {"m2"}
                    </div>
                    <div>
                      <div className="mb-3">
                        {!rm.waterverbruik_old ? (
                          <p>
                            {"Water gebruikt:"} {""}
                            {safenumber(rm.waterverbruik) *
                              safenumber(rm.vierkante_meter ?? 0)}
                            {"Liter"} {"Geen besparing"}
                          </p>
                        ) : (
                          <p>
                            {"Water gebruikt:"} {""}
                            {safenumber(rm.waterverbruik) *
                              safenumber(rm.vierkante_meter ?? 0)}
                            {"Liter"} {"Bespaard"}{" "}
                            {calcPercentageSave(
                              rm.waterverbruik_old,
                              rm.waterverbruik,
                            )}
                            {"%"}
                          </p>
                        )}
                        {!rm.afvalwater_old ? (
                          <p>
                            {"Afval water: "}
                            {safenumber(rm.afvalwater) *
                              safenumber(rm.vierkante_meter)}
                            {"Liter"}
                          </p>
                        ) : (
                          <p>
                            {" "}
                            {"Afval water: "}
                            {safenumber(rm.afvalwater) *
                              safenumber(rm.vierkante_meter)}
                            {"Liter"}{" "}
                            {calcPercentageSave(
                              rm.afvalwater_old,
                              rm.afvalwater,
                            )}
                            {"%"}
                          </p>
                        )}
                        {!rm.chemievebruik_old ? (
                          <p>
                            {"Chemicalien: "}
                            {safenumber(rm.chemieverbruik) *
                              safenumber(rm.vierkante_meter)}
                            {"Liter"}
                          </p>
                        ) : (
                          <p>
                            {" "}
                            {"Chemicalien: "}
                            {safenumber(rm.chemieverbruik) *
                              safenumber(rm.vierkante_meter)}
                            {"Liter"} {"Bespaard"}
                            {calcPercentageSave(
                              rm.chemievebruik_old,
                              rm.chemieverbruik,
                            )}
                            {"%"}
                          </p>
                        )}
                        {!rm.stroom_old ? (
                          <p>
                            {"Stroom: "}
                            {safenumber(rm.stroomverbruik) *
                              safenumber(rm.vierkante_meter)}
                            {"kwh"}
                          </p>
                        ) : (
                          <p>
                            {"Stroom: "}
                            {safenumber(rm.stroomverbruik) *
                              safenumber(rm.vierkante_meter)}
                            {"kwh"} {"bespaard:"}
                            {calcPercentageSave(
                              rm.stroom_old,
                              rm.stroomverbruik,
                            )}
                            {"%"}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
