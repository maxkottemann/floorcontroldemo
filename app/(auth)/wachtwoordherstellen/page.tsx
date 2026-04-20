"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetupPaswoordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
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
    router.push("/klant/dashboard");
  }

  if (!ready)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="w-6 h-6 rounded-full border-2 border-p border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-8 space-y-5">
        <div className="text-center">
          <img
            src="/duofortlogo.png"
            className="h-8 mx-auto mb-4 object-contain"
          />
          <h1 className="text-xl font-bold text-slate-900">
            Wachtwoord instellen
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kies een wachtwoord voor uw account
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">Wachtwoord</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimaal 8 tekens"
              className="w-full px-4 text-slate-700 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/50 focus:ring-2 focus:ring-p/10 transition-all"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">
              Bevestig wachtwoord
            </p>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Herhaal wachtwoord"
              className="w-full px-4 py-2.5 text-sm text-slate-700 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/50 focus:ring-2 focus:ring-p/10 transition-all"
            />
          </div>
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              "Wachtwoord instellen"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
