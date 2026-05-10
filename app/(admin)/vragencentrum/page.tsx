"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import { useToast } from "@/components/hooks/usetoasts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import SidebarClient from "@/components/layout/sidebarclient";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ClockIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/layout/sidebar";

interface VraagThread {
  id: string;
  profiel_id: string;
  profiel_naam: string;
  onderwerp: string;
  aangemaakt_op: string;
  ongelezen: number;
  laatsteBericht?: string;
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0)
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diffDays === 1) return "Gisteren";
  if (diffDays < 7)
    return date.toLocaleDateString("nl-NL", { weekday: "long" });
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function VragenPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allThreads, setAllThreads] = useState<VraagThread[]>([]);
  const [activeProfielid, setActiveProfielid] = useState("");
  const [loading, setLoading] = useState(true);
  const [zoek, setZoek] = useState("");

  useEffect(() => {
    async function fetchProfielId() {
      const user = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from("profielen")
        .select("id")
        .eq("gebruiker_id", user)
        .single();
      if (!data || error) {
        showToast("U bent niet ingelogd", "error");
        setTimeout(() => supabase.auth.signOut(), 1000);
        router.push("/login");
        return;
      }
      setActiveProfielid(data.id);
    }
    fetchProfielId();
  }, []);

  useEffect(() => {
    async function getAllThreads() {
      if (!activeProfielid) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("vraag_thread")
        .select(
          "id, profielen(naam), gestart_door, onderwerp, aangemaakt_op, vraag_berichten(id, gelezen, profiel_id, bericht, aangemaakt_op)",
        )
        .order("aangemaakt_op", { ascending: false });

      if (error) {
        showToast("Kon geen chats laden", "error");
        setLoading(false);
        return;
      }

      setAllThreads(
        (data || []).map((d: any) => {
          const berichten = d.vraag_berichten ?? [];
          const ongelezen = berichten.filter(
            (b: any) => b.gelezen === false && b.profiel_id !== activeProfielid,
          ).length;
          const sorted = [...berichten].sort(
            (a: any, b: any) =>
              new Date(b.aangemaakt_op).getTime() -
              new Date(a.aangemaakt_op).getTime(),
          );
          return {
            id: d.id,
            profiel_id: d.gestart_door,
            profiel_naam: d.profielen?.naam ?? "Onbekend",
            onderwerp: d.onderwerp,
            aangemaakt_op: sorted[0]?.aangemaakt_op ?? d.aangemaakt_op,
            ongelezen,
            laatsteBericht: sorted[0]?.bericht ?? null,
          };
        }),
      );
      setLoading(false);
    }
    getAllThreads();
  }, [activeProfielid]);

  const filtered = allThreads.filter(
    (t) =>
      t.onderwerp.toLowerCase().includes(zoek.toLowerCase()) ||
      t.profiel_naam.toLowerCase().includes(zoek.toLowerCase()),
  );

  const totalOngelezen = allThreads.reduce((s, t) => s + t.ongelezen, 0);

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
          title="Berichten"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className=" mx-auto space-y-4 md:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                  Communicatie
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  Berichten
                  {totalOngelezen > 0 && (
                    <span className="ml-2.5 inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-blue-500 text-white text-xs font-bold px-1.5">
                      {totalOngelezen}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  {allThreads.length} gesprek
                  {allThreads.length !== 1 ? "ken" : ""}
                </p>
              </div>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                value={zoek}
                onChange={(e) => setZoek(e.target.value)}
                placeholder="Zoek op onderwerp..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all shadow-sm"
              />
            </div>

            {/* Thread list */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {filtered.map((thread, i) => (
                  <div
                    key={thread.id}
                    onClick={() => router.push(`/vragencentrum/${thread.id}`)}
                    className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${thread.ongelezen > 0 ? "bg-blue-50/40" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${thread.ongelezen > 0 ? "bg-p text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {thread.profiel_naam.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={`text-sm truncate ${thread.ongelezen > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}
                        >
                          {thread.onderwerp}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-[11px] text-slate-400">
                            {formatDate(thread.aangemaakt_op)}
                          </p>
                          {thread.ongelezen > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold px-1">
                              {thread.ongelezen > 9 ? "9+" : thread.ongelezen}
                            </span>
                          )}
                        </div>
                      </div>
                      {thread.laatsteBericht && (
                        <p
                          className={`text-xs truncate ${thread.ongelezen > 0 ? "text-slate-600 font-medium" : "text-slate-400"}`}
                        >
                          {thread.laatsteBericht}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
