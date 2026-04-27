"use client";

import Topbar from "@/components/layout/topbar";
import Sidebar from "@/components/layout/sidebar";
import { useState } from "react";
import {
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import SidebarClient from "@/components/layout/sidebarclient";

export default function InProgressPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F5F6FA]">
      <SidebarClient
        className="fixed top-0 left-0 h-screen"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 h-screen">
        <Topbar
          title="In ontwikkeling"
          onMenuToggle={() => setSidebarOpen((p) => !p)}
        />

        <main className="flex-1 overflow-auto p-3 md:p-8 flex items-center justify-center">
          <div className="max-w-lg w-full">
            {/* Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Top accent */}
              <div className="h-1.5 bg-p" />

              <div className="p-8 md:p-10 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-p/10 flex items-center justify-center mx-auto mb-6">
                  <ClockIcon className="w-8 h-8 text-p" />
                </div>

                {/* Title */}
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-p/60 mb-2">
                  In ontwikkeling
                </p>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
                  Pagina wordt ingericht
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  De inhoud en functionaliteit van deze pagina wordt nader
                  bepaald in overleg met RSO. Na afstemming wordt deze module
                  verder ontwikkeld en ingericht.
                </p>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-8" />

                {/* Status steps */}
                <div className="space-y-3 text-left">
                  {[
                    {
                      icon: (
                        <DocumentTextIcon className="w-4 h-4 text-emerald-500" />
                      ),
                      bg: "bg-emerald-50",
                      label: "Functionele analyse",
                      sub: "Globale scope bepaald",
                      done: true,
                    },
                    {
                      icon: (
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-p" />
                      ),
                      bg: "bg-p/10",
                      label: "Overleg met RSO",
                      sub: "Wordt ingepland",
                      done: false,
                      active: true,
                    },
                    {
                      icon: <ClockIcon className="w-4 h-4 text-slate-300" />,
                      bg: "bg-slate-100",
                      label: "Ontwikkeling & implementatie",
                      sub: "Volgt na afstemming",
                      done: false,
                      active: false,
                    },
                  ].map(({ icon, bg, label, sub, done, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all
                      ${done ? "bg-emerald-50/50 border-emerald-100" : active ? "bg-p/5 border-p/15" : "bg-slate-50 border-slate-100"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p
                          className={`text-sm font-semibold ${done ? "text-emerald-700" : active ? "text-p" : "text-slate-400"}`}
                        >
                          {label}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${done ? "text-emerald-500" : active ? "text-p/60" : "text-slate-300"}`}
                        >
                          {sub}
                        </p>
                      </div>
                      {done && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Gereed
                        </span>
                      )}
                      {active && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-p bg-p/10 px-2 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-p animate-pulse shrink-0" />
                          Actief
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 my-8" />

                {/* Footer note */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  FloorControl · CM Software B.V. · Vragen? Neem contact op via{" "}
                  <a
                    href="mailto:info@cmsoftware.nl"
                    className="text-p/60 font-semibold hover:text-p transition-colors"
                  >
                    info@cmsoftware.nl
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
