"use client";

import { useRouter } from "next/navigation";

export default function AanvraagSuccesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src="/floorcontrol.png"
            alt="Logo"
            className="w-100 object-contain"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none "
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Aanvraag verzonden
          </h1>

          <p className="text-sm text-gray-500 mb-6">
            Uw aanvraag is succesvol ingediend. U krijgt toegang zodra deze is
            goedgekeurd.
          </p>

          <button
            onClick={() => router.push("/login")}
            className="w-full bg-p hover:bg-ph text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            Terug naar login
          </button>
        </div>
      </div>
    </div>
  );
}
