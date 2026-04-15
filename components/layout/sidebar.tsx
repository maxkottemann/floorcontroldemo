"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { BsLeaf, BsPassport } from "react-icons/bs";
import { DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { BiNotification } from "react-icons/bi";
import { FaSeedling } from "react-icons/fa";
import { GiPlantRoots } from "react-icons/gi";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `flex items-center gap-3 w-full font-medium px-4 py-3 rounded-lg mb-2 transition
     ${
       pathname.startsWith(href)
         ? "text-white bg-gradient-to-r from-[#00539f] to-[#0072e5] shadow-md"
         : "text-gray-800 hover:bg-[#e6f0ff] hover:text-[#00539f]"
     }`;

  return (
    <>
      <button
        className="fixed p-3 text-gray-800 rounded-lg lg:hidden top-1.5 left-4 z-50 bg-white shadow"
        onClick={() => setOpen(!open)}
        aria-label="Toggle Sidebar"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className={`
          fixed top-0 left-0 w-64 lg:w-45 xl:w-64 min-h-screen flex flex-col z-50
          bg-[#f2f3f4] shadow-lg border-r border-gray-200
          transition-transform duration-300 pr-1
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static
          ${className ?? ""}
        `}
      >
        <img src="/logo2.png" alt="Logo" className="px-1 mx-auto mb-1 w-53" />

        <div className="border-t border-gray-200 my-4" />

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <HomeIcon className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/status" className={linkClass("/status")}>
          <ChartBarIcon className="w-5 h-5" />
          Status
        </Link>
        <Link href="/projecten" className={linkClass("/projecten")}>
          <ClipboardDocumentIcon className="w-5 h-5" />
          Projecten
        </Link>
        <Link href="/locaties" className={linkClass("/locaties")}>
          <BuildingOffice2Icon className="w-5 h-5" />
          Locaties
        </Link>
        <Link href="/vloerenpaspoort" className={linkClass("/vloerenpaspoort")}>
          <BsPassport className="w-5 h-5" />
          Vloerpaspoort
        </Link>
        <Link href="/rapporten" className={linkClass("/rapporten")}>
          <DocumentArrowUpIcon className="w-5 h-5" />
          Rapporten
        </Link>
        <Link href="/milieu" className={linkClass("/milieu")}>
          <BsLeaf className="w-5 h-5" />
          Duurzaamheid
        </Link>
        <Link href="/meldingen" className={linkClass("/meldingen")}>
          <BellAlertIcon className="w-5 h-5" />
          Meldingen
        </Link>
        <Link href="/gebruikers" className={linkClass("/gebruikers")}>
          <UserCircleIcon className="w-5 h-5" />
          Gebruikers
        </Link>
      </nav>
    </>
  );
}
