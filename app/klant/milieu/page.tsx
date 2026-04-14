"use client";

"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { use } from "react";

export default function milieupage() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Milieu" />

        <main className="flex-1 overflow-auto p-8"></main>
      </div>
    </div>
  );
}
