"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/locaties-kiezen");
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (
          (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") &&
          session
        ) {
          router.push("/locaties-kiezen");
        }
      });

      return () => subscription.unsubscribe();
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-10 py-10 flex flex-col items-center gap-5 text-center max-w-sm w-full mx-4">
        <img
          src="/duofortlogo.png"
          className="h-8 object-contain"
          alt="Duofort"
        />
        <div className="w-10 h-10 rounded-full border-[3px] border-p border-t-transparent animate-spin" />
        <div>
          <p className="text-sm font-bold text-slate-800">
            Bezig met inloggen...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Even geduld, u wordt doorgestuurd
          </p>
        </div>
      </div>
    </div>
  );
}
