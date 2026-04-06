"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useToast } from "@/components/hooks/usetoasts";
import Card from "@/components/layout/card";
export default function getKamersPage() {
  const { toast, showToast, hideToast } = useToast();
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar className="fixed top-0 left-0 h-screen" />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Kamers" />

        <main className="flex-1 overflow-auto p-6 space-y-4">
          <Card>
            <div className="flex flex-col">
              <h2>Alle kamers</h2>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
