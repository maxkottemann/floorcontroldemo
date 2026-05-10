"use client";

import Toast from "@/components/layout/toast";
import Topbar from "@/components/layout/topbar";
import SidebarClient from "@/components/layout/sidebarclient";
import { useToast } from "@/components/hooks/usetoasts";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "@/components/layout/sidebar";

interface Bericht {
  id: string;
  profiel_id: string;
  profiel_naam: string;
  bericht: string;
  gelezen: boolean;
  aangemaakt_op: string;
}

interface Thread {
  id: string;
  onderwerp: string;
  gestart_door: string;
  aangemaakt_op: string;
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function VraagThreadPage() {
  const router = useRouter();
  const { id } = useParams();
  const threadId = Array.isArray(id) ? id[0] : (id as string);
  const { toast, showToast, hideToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [thread, setThread] = useState<Thread | null>(null);
  const [berichten, setBerichten] = useState<Bericht[]>([]);
  const [profielId, setProfielId] = useState("");
  const [nieuwBericht, setNieuwBericht] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const profielIdRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchProfiel() {
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
      profielIdRef.current = data.id;
    }
    fetchProfiel();
  }, []);

  async function loadThread() {
    const { data, error } = await supabase
      .from("vraag_thread")
      .select("id, onderwerp, gestart_door, aangemaakt_op")
      .eq("id", threadId)
      .single();
    if (error || !data) {
      showToast("Gesprek niet gevonden", "error");
      return;
    }
    setThread(data);
  }

  async function loadBerichten() {
    const { data, error } = await supabase
      .from("vraag_berichten")
      .select(
        "id, profiel_id, profiel_naam:profielen(naam), bericht, gelezen, aangemaakt_op",
      )
      .eq("thread_id", threadId)
      .order("aangemaakt_op", { ascending: true });
    if (error) {
      showToast("Kon berichten niet laden", "error");
      return;
    }
    setBerichten(
      (data ?? []).map((d: any) => ({
        id: d.id,
        profiel_id: d.profiel_id,
        profiel_naam: d.profiel_naam?.naam ?? "Onbekend",
        bericht: d.bericht,
        gelezen: d.gelezen,
        aangemaakt_op: d.aangemaakt_op,
      })),
    );
    setLoading(false);
  }

  async function markeerGelezen() {
    if (!profielIdRef.current) return;
    await supabase
      .from("vraag_berichten")
      .update({ gelezen: true })
      .eq("thread_id", threadId)
      .eq("gelezen", false)
      .neq("profiel_id", profielIdRef.current);
  }

  useEffect(() => {
    if (!threadId) return;
    loadThread();
    loadBerichten();
  }, [threadId]);

  useEffect(() => {
    if (!profielId || berichten.length === 0) return;
    markeerGelezen();
  }, [profielId, berichten]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [berichten]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vraag_berichten",
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          loadBerichten();
          markeerGelezen();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  async function handleSend() {
    if (!nieuwBericht.trim() || sending) return;
    setSending(true);
    const { error } = await supabase.from("vraag_berichten").insert({
      thread_id: threadId,
      profiel_id: profielId,
      bericht: nieuwBericht.trim(),
      gelezen: false,
    });
    if (error) {
      showToast("Kon bericht niet verzenden", "error");
    } else {
      setNieuwBericht("");
      inputRef.current?.focus();
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groupedBerichten: { date: string; items: Bericht[] }[] = [];
  for (const b of berichten) {
    const last = groupedBerichten[groupedBerichten.length - 1];
    if (last && isSameDay(last.date, b.aangemaakt_op)) {
      last.items.push(b);
    } else {
      groupedBerichten.push({ date: b.aangemaakt_op, items: [b] });
    }
  }

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
          title="Bericht"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <div className="flex flex-col flex-1 overflow-hidden w-full mx-auto px-3 md:px-8 py-4 md:py-6 gap-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {thread?.onderwerp ?? "..."}
              </p>
              <p className="text-xs text-slate-400">
                {thread ? `Gestart op ${formatDate(thread.aangemaakt_op)}` : ""}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
              </div>
            ) : berichten.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-slate-300">Nog geen berichten</p>
              </div>
            ) : (
              groupedBerichten.map((group) => (
                <div key={group.date} className="space-y-3">
                  {/* Date divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <p className="text-[11px] font-semibold text-slate-400 shrink-0">
                      {formatDate(group.date)}
                    </p>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {group.items.map((b) => {
                    const isOwn = b.profiel_id === profielId;
                    return (
                      <div
                        key={b.id}
                        className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        {!isOwn && (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mb-0.5">
                            {b.profiel_naam.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div
                          className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}
                        >
                          {/* Name */}
                          {!isOwn && (
                            <p className="text-[11px] font-semibold text-slate-400 px-1">
                              {b.profiel_naam}
                            </p>
                          )}

                          {/* Bubble */}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isOwn
                                ? "bg-p text-white rounded-br-sm"
                                : "bg-white border border-slate-100 shadow-sm text-slate-800 rounded-bl-sm"
                            }`}
                          >
                            {b.bericht}
                          </div>

                          {/* Time + read */}
                          <div
                            className={`flex items-center gap-1 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <p className="text-[10px] text-slate-400">
                              {formatTime(b.aangemaakt_op)}
                            </p>
                            {isOwn && b.gelezen && (
                              <div className="flex">
                                <CheckIcon className="w-3 h-3 text-blue-400" />
                                <CheckIcon className="w-3 h-3 text-blue-400 -ml-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <textarea
              ref={inputRef}
              value={nieuwBericht}
              onChange={(e) => setNieuwBericht(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Typ een bericht... (Enter om te verzenden)"
              rows={3}
              className="w-full px-4 pt-3 pb-1 text-sm text-slate-800 outline-none resize-none placeholder:text-slate-300"
            />
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-50">
              <p className="text-[11px] text-slate-300">
                Shift + Enter voor nieuwe regel
              </p>
              <button
                onClick={handleSend}
                disabled={!nieuwBericht.trim() || sending}
                className="flex items-center gap-2 px-4 py-2 bg-p text-white text-sm font-bold rounded-xl hover:bg-p/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {sending ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-4 h-4" />
                )}
                Verstuur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
