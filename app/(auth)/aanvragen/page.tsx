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
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <img
            src="/duofortlogo.png"
            className="h-10 mx-auto mb-4 object-contain"
            alt="Duofort"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            Toegang aanvragen
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            FloorControl · Duofort B.V.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {done ? (
            <div className="px-8 py-10 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">
                  Aanvraag ingediend
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Uw aanvraag is ontvangen. U ontvangt een e-mail zodra uw
                  account is goedgekeurd.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  Volledige naam
                </p>
                <input
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Jan de Vries"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/50 focus:ring-2 focus:ring-p/10 transition-all placeholder:text-slate-300"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1">
                  E-mailadres
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jan@bedrijf.nl"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-p/50 focus:ring-2 focus:ring-p/10 transition-all placeholder:text-slate-300"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-p text-white text-sm font-bold hover:bg-p/90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <UserPlusIcon className="w-4 h-4" />
                )}
                Toegang aanvragen
              </button>

              <p className="text-xs text-slate-400 text-center">
                Al een account?{" "}
                <a
                  href="/login"
                  className="text-p font-semibold hover:underline"
                >
                  Inloggen
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
