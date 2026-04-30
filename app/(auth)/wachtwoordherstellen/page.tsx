"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/hooks/usetoasts";
import Toast from "@/components/layout/toast";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function SetupPaswoordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) setReady(true);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Wachtwoorden komen niet overeen");
      return;
    }
    if (password.length < 8) {
      setError("Minimaal 8 tekens");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    showToast("Wachtwoord hersteld", "success");
    setTimeout(() => router.push("/login"), 1000);
  }

  if (!ready)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="w-6 h-6 rounded-full border-2 border-[#154273] border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen flex">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Left banner */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/loginbg2.jpg"
          alt="FloorControl"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#154273]/80 via-[#154273]/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <img
              src="/floorcontrol.png"
              alt="FloorControl"
              className="h-10 object-contain"
            />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Duofort B.V.
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Floor<span className="text-[#3AB8BF]">Control</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed max-w-xs">
              Beheer uw locaties, projecten en vloeren vanuit één platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-white/30" />
            <p className="text-white/40 text-xs">
              Vloerbeheer · Projectplanning · Rapportage
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-[#F5F6FA]">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
              Nieuw wachtwoord
            </p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Wachtwoord instellen
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Kies een sterk wachtwoord voor uw account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 8 tekens"
                className="w-full px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#154273]/40 focus:ring-2 focus:ring-[#154273]/10 placeholder:text-slate-300 transition-all shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Bevestig wachtwoord
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Herhaal wachtwoord"
                className="w-full px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#154273]/40 focus:ring-2 focus:ring-[#154273]/10 placeholder:text-slate-300 transition-all shadow-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs font-semibold text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#154273] hover:bg-[#0f2f52] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <KeyIcon className="w-4 h-4" />
                  Wachtwoord instellen
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <a
              href="/login"
              className="text-sm text-slate-400 hover:text-[#154273] font-semibold transition-colors"
            >
              Terug naar inloggen
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
