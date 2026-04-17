"use client";

import { supabase } from "@/lib/supabase";
import {
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type TopbarProps = { title: string };

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const [username, setUsername] = useState("Laden...");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profiel } = await supabase
        .from("profielen")
        .select("naam, email")
        .eq("gebruiker_id", user.id)
        .single();
      if (profiel) {
        setUsername(profiel.naam ?? "Gebruiker");
        setEmail(profiel.email ?? user.email ?? "");
      }
    }
    getUser();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = username
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-row w-full bg-p h-16 justify-between items-center px-6 shrink-0 z-40">
      <h2 className="text-white font-bold text-lg tracking-tight">{title}</h2>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="flex items-center gap-2.5  hover:bg-white/20 transition-colors rounded-xl px-3 py-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-white leading-tight">
              {username}
            </p>
            {email && (
              <p className="text-[10px] text-white/60 leading-tight truncate max-w-[140px]">
                {email}
              </p>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-white/60 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="fixed top-16 right-4 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl z-[999] overflow-hidden">
            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-p/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-p">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {username}
                  </p>
                  {email && (
                    <p className="text-xs text-slate-400 truncate">{email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <ArrowRightStartOnRectangleIcon className="w-4 h-4 shrink-0" />
                Uitloggen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
