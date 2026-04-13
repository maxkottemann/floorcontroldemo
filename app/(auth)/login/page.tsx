"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleLogin() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(true);
      setLoading(false);
      return;
    }

    const { data: profiel } = await supabase
      .from("profielen")
      .select("rol")
      .eq("gebruiker_id", data.user.id)
      .single();

    if (profiel?.rol === "locatie_manager") {
      router.push("/status");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] flex-col p-4">
      <div className="flex justify-center w-full mb-6 rounded-2xl">
        <img src="logo.png" alt="Logo" className="object-contain w-100" />
      </div>
      <div className="w-full max-w-lg p-8 bg-white shadow-2xl rounded-2xl">
        <h1 className="mb-2 text-2xl font-bold text-center text-gray-800">
          Floorcontrol
        </h1>
        <p className="mb-6 text-sm text-center text-gray-500">
          Log in op uw dashboard
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              E-mailadres
            </label>
            <input
              type="email"
              placeholder="janjansen@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Wachtwoord
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-slate-900"
            />
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">
              E-mailadres of wachtwoord incorrect, probeer het opnieuw
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-p hover:cursor-pointer hover:bg-ph text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Inloggen..." : "Inloggen"}
          </button>

          <div className="flex flex-row justify-center items-center">
            <a
              href="/wachtwoordvergeten"
              className="text-[#00539f] underline underline-offset-4 hover:cursor-pointer hover:text-[#00538e]"
            >
              Wacthwoord vergeten?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
