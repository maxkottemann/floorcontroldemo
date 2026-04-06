"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Card from "@/components/layout/card";
import Dropdown from "@/components/layout/dropdown";
import Inputfield from "@/components/layout/inputfield";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import DropdownBig from "@/components/layout/dropdownbig";

export default function getKamersPage({}) {
  const { toast, showToast, hideToast } = useToast();
  const [alleVerdiepingen, setAlleVerdiepingen] = useState<any[]>([]);
  const { id } = useParams();

  useEffect(() => {
    async function getVerdiepingen() {
      if (!id) return;
      const { data } = await supabase
        .from("verdiepingen")
        .select("id,naam")
        .eq("locatie_id", id);
    }
    getVerdiepingen();
  }, [id]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Kamer" />

        <main className="flex-1 overflow-auto p-6 space-y-4">
          <Card>
            <div className="flex flex-col">
              <h2 className="mb-2 text-xl font-bold">Toevoegen</h2>
              <div className="flex flex-row gap-10 ">
                <div className="w-[85%]">
                  <Inputfield title="Naam"></Inputfield>
                </div>
                <div className="w-[20%]">
                  <DropdownBig title="verdieping" options={[]}></DropdownBig>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
