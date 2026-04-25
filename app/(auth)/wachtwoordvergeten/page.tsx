"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { KeyIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function WachtwoordVergetenPage() {
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
      redirectTo: "https://rso-floorcontrol.nl/wachtwoordherstellen",
    });
    setLoading(false);
    if (err) {
      setError("Er ging iets mis. Probeer opnieuw.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left banner — matches login page */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/logingbg.png"
          alt="FloorControl"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#154273]/80 via-[#154273]/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <img
              src="/logo.png"
              alt="FloorControl"
              className="h-0 object-contain brightness-0 invert"
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-[#F5F6FA]">
        <div className="w-full max-w-sm">
          {done ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <KeyIcon className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
                Verstuurd
              </p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
                Check je inbox
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                We hebben een herstelLink gestuurd naar{" "}
                <span className="font-semibold text-slate-600">{email}</span>.
                Controleer ook je spamfolder.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#154273] hover:bg-[#0f2f52] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Terug naar inloggen
              </a>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="flex flex-row w-full">
                <img
                  src="/logo.png"
                  alt="FloorControl"
                  className="h-25 object-contain  mb-10"
                />
              </div>
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
                  Toegang herstellen
                </p>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Wachtwoord vergeten
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  We sturen je een link om je wachtwoord opnieuw in te stellen
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@bedrijf.nl"
                    className="w-full px-4 py-3 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#154273]/40 focus:ring-2 focus:ring-[#154273]/10 placeholder:text-slate-300 transition-all shadow-sm"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-xs font-semibold text-red-600">
                      {error}
                    </p>
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
                      Verstuur herstelLink
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#154273] font-semibold transition-colors"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" />
                  Terug naar inloggen
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
