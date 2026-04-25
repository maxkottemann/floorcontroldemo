"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircleIcon, UserPlusIcon } from "@heroicons/react/24/outline";

export default function AccountAanvragenPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!naam || !email) {
      setError("Vul naam en e-mail in");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("account_aanvraag")
      .insert({ naam, email, stap: "aangevraagd" });
    setLoading(false);
    if (err) {
      if (err.code === "23505")
        setError("Dit e-mailadres heeft al een aanvraag ingediend.");
      else setError("Er ging iets mis. Probeer het opnieuw.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen flex">
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

      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-[#F5F6FA]">
        <div className="w-full max-w-sm">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
                Ontvangen
              </p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
                Aanvraag ingediend
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                Uw aanvraag is ontvangen. U ontvangt een e-mail zodra uw account
                is goedgekeurd.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#154273] hover:bg-[#0f2f52] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                Terug naar inloggen
              </a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div>
                  <img
                    src="/logo.png"
                    alt="FloorControl"
                    className="h-25 object-contain mb-8"
                  />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#154273]/60 mb-2">
                  Nieuw account
                </p>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Toegang aanvragen
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Vul uw gegevens in om toegang aan te vragen
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Volledige naam
                  </label>
                  <input
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder="Jan de Vries"
                    className="w-full px-4 py-3 text-slate-800 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#154273]/40 focus:ring-2 focus:ring-[#154273]/10 placeholder:text-slate-300 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                    E-mailadres
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@bedrijf.nl"
                    className="w-full px-4 py-3 text-slate-800 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-[#154273]/40 focus:ring-2 focus:ring-[#154273]/10 placeholder:text-slate-300 transition-all shadow-sm"
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
                      <UserPlusIcon className="w-4 h-4" />
                      Toegang aanvragen
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-400">
                  Al een account?{" "}
                  <a
                    href="/login"
                    className="text-[#154273] font-bold hover:text-[#154273]/70 transition-colors"
                  >
                    Inloggen
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
