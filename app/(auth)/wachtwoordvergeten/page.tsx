"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function AccountAanvragenPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError("Vul je e-mailadres in");
      return;
    }

    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "/wachtwoordherstellen",
    });

    setLoading(false);

    if (err) {
      if (err.code === "23505") {
        setError("Dit e-mailadres heeft al een aanvraag ingediend.");
      } else {
        setError("Er ging iets mis. Probeer opnieuw.");
      }
      return;
    }

    setDone(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f6fa] to-[#eef1f7] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="/duofortlogo.png"
            className="h-12 mx-auto mb-5 object-contain"
            alt="Duofort"
          />
          <h1 className="text-2xl font-semibold text-slate-900">
            Wachtwoord vergeten
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            FloorControl · Duofort B.V.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-8">
          <div className="mb-6 text-center">
            <p className="text-sm text-slate-500 leading-relaxed">
              Vul je e-mailadres in en we sturen je een link om je wachtwoord
              opnieuw in te stellen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@bedrijf.nl"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 outline-none transition-all
                focus:border-p focus:ring-2 focus:ring-p/10 placeholder:text-slate-300"
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 font-medium -mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-p text-white text-sm font-semibold
              hover:bg-p/90 active:scale-[0.99]
              transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeyIcon className="w-4 h-4" />
              )}
              Wachtwoord herstellen
            </button>

            <p className="text-xs text-slate-400 text-center pt-2">
              Al een account?{" "}
              <a href="/login" className="text-p font-medium hover:underline">
                Inloggen
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
