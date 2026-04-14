"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/layout/toast";
import { useToast } from "@/components/hooks/usetoasts";
import Dropdown from "@/components/layout/dropdown";

export default function LoginPage() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof roles)[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    naam: false,
    email: false,
    role: false,
  });

  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const roles = [
    { label: "Locatie manager", value: "locatie_manager" },
    { label: "Regio manager", value: "regio_manager" },
    { label: "directie", value: "directie" },
  ];

  function validate() {
    const newErrors = {
      naam: !naam,
      email: !email,
      role: !role,
    };

    setErrors(newErrors);

    if (newErrors.naam) {
      showToast("Vul uw naam in", "error");
      return false;
    }

    if (newErrors.email) {
      showToast("Vul uw e-mailadres in", "error");
      return false;
    }

    if (newErrors.role) {
      showToast("Selecteer een rol", "error");
      return false;
    }

    return true;
  }

  async function addRequest() {
    if (!validate()) return;

    const { data: exists, error: checkError } = await supabase.rpc(
      "user_exists",
      { email_input: email },
    );

    if (checkError) {
      showToast("Er ging iets mis", "error");
      return;
    }

    if (exists) {
      showToast("Er bestaat al een account met dit e-mailadres", "error");
      return;
    }

    const { error } = await supabase.from("account_aanvraag").insert({
      naam: naam,
      email: email,
    });

    if (error) {
      console.log(error);
      if (error.code === "23505") {
        showToast("Er bestaat al een account met deze email", "error");
        return;
      } else {
        showToast("Er ging iets mis", "error");
        return;
      }
    }
    setTimeout(() => {
      router.push("/aanvragen/ingediend");
    }, 1000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] flex-col p-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="flex justify-center w-full mb-6 rounded-2xl">
        <img src="logo.png" alt="Logo" className="object-contain w-100" />
      </div>
      <div className="w-full max-w-lg p-8 bg-white shadow-2xl rounded-2xl">
        <h1 className="mb-2 text-2xl font-bold text-center text-gray-800">
          Floorcontrol
        </h1>
        <p className="mb-6 text-sm text-center text-gray-500">
          Voer uw gevens in om een account aan te vragen
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Naam
            </label>
            <input
              type="naam"
              placeholder="Jan Janssen"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              className="w-full mb-4 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-slate-900"
            />
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              E-mailadres
            </label>
            <input
              type="email"
              placeholder="janjansen@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 mb-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 text-slate-900"
            />

            <Dropdown
              title="Rol"
              options={roles}
              displayKey="label"
              value={role}
              placeholder="Selecteer een rol"
              onChange={(selected) => setRole(selected)}
              className="w-full"
            />
          </div>
          <button
            onClick={() => {
              addRequest();
              setLoading(true);
            }}
            disabled={loading}
            className="w-full bg-p hover:cursor-pointer hover:bg-ph text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Versturen..." : "Aanvragen"}
          </button>
        </div>
      </div>
    </div>
  );
}
