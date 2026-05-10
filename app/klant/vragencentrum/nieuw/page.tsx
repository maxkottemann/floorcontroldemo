"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import Inputfield from "@/components/layout/inputfield";
import { useToast } from "@/components/hooks/usetoasts";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function NieuweVraagPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onderwerp, setOnderwerp] = useState("");
  const [bericht, setBericht] = useState("");
  const [profielId, setProfielId] = useState("");
  const [saving, setSaving] = useState(false);

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
      setProfielId(data.id);
    }
    fetchProfielId();
  }, []);

  async function handleSubmit() {
    if (!onderwerp.trim() || !bericht.trim()) {
      showToast("Vul een onderwerp en bericht in", "error");
      return;
    }
    console.log(profielId);
    setSaving(true);
    try {
      const { data: thread, error: threadError } = await supabase
        .from("vraag_thread")
        .insert({ gestart_door: profielId, onderwerp: onderwerp.trim() })
        .select("id")
        .single();

      if (threadError || !thread) {
        showToast("Kon gesprek niet aanmaken", "error");
        setSaving(false);
        console.log(threadError);
        return;
      }

      const { error: berichtError } = await supabase
        .from("vraag_berichten")
        .insert({
          thread_id: thread.id,
          profiel_id: profielId,
          bericht: bericht.trim(),
          gelezen: false,
        });

      if (berichtError) {
        showToast("Kon bericht niet verzenden", "error");
        console.log(berichtError);
        setSaving(false);
        return;
      }

      showToast("Bericht verzonden", "success");
      setTimeout(() => router.push(`/klant/vragen/${thread.id}`), 800);
    } catch {
      showToast("Er ging iets mis", "error");
      setSaving(false);
    }
  }

  const canSubmit =
    onderwerp.trim().length > 0 && bericht.trim().length > 0 && !saving;

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="Nieuw bericht"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8">
          <div className=" mx-auto space-y-5">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-3"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug naar berichten
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-p/60 mb-1">
                Nieuw
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Bericht sturen
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Stel een vraag aan Duofort
              </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
                <div className="w-9 h-9 rounded-xl bg-p/10 flex items-center justify-center shrink-0">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-p" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Nieuw gesprek
                  </p>
                  <p className="text-xs text-slate-400">
                    Duofort reageert zo snel mogelijk
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <Inputfield
                  title="Onderwerp"
                  value={onderwerp}
                  onChange={setOnderwerp}
                  placeholder="Waar gaat uw vraag over?"
                />

                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                    Bericht
                  </p>
                  <textarea
                    value={bericht}
                    onChange={(e) => setBericht(e.target.value)}
                    placeholder="Typ uw bericht hier..."
                    rows={6}
                    className="w-full px-4 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-p/40 focus:ring-2 focus:ring-p/10 placeholder:text-slate-300 transition-all resize-none"
                  />
                  <p className="text-[11px] text-slate-300 text-right">
                    {bericht.length} tekens
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-p text-white shadow-sm hover:bg-p/90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Verstuur bericht
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 px-4 py-3.5 bg-p/5 border border-p/15 rounded-xl">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-p shrink-0 mt-0.5" />
              <p className="text-xs text-p/80 font-medium leading-relaxed">
                Uw bericht wordt direct doorgestuurd naar Duofort. U ontvangt
                een melding zodra er een reactie is.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
