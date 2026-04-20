"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  BuildingOffice2Icon,
  BellAlertIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { BsLeaf, BsPassport } from "react-icons/bs";

interface SidebarProps {
  className?: string;
  open: boolean;
  onClose: () => void;
}

export default function SidebarClient({
  className,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `flex items-center gap-3 w-full font-medium px-4 py-3 rounded-lg mb-1 transition-all duration-150
     ${
       pathname.startsWith(href)
         ? "text-white bg-gradient-to-r from-[#00539f] to-[#0072e5] shadow-md"
         : "text-gray-700 hover:bg-[#e6f0ff] hover:text-[#00539f]"
     }`;

  const links = [
    {
      href: "/klant/dashboard",
      icon: <HomeIcon className="w-5 h-5" />,
      label: "Dashboard",
    },
    {
      href: "/klant/status",
      icon: <ChartBarIcon className="w-5 h-5" />,
      label: "Status",
    },
    {
      href: "/klant/projecten",
      icon: <ClipboardDocumentIcon className="w-5 h-5" />,
      label: "Projecten",
    },
    {
      href: "/klant/locaties",
      icon: <BuildingOffice2Icon className="w-5 h-5" />,
      label: "Locaties",
    },
    {
      href: "/klant/vloerenpaspoort",
      icon: <BsPassport className="w-5 h-5" />,
      label: "Vloerpaspoort",
    },
    {
      href: "/klant/rapporten",
      icon: <DocumentArrowUpIcon className="w-5 h-5" />,
      label: "Rapporten",
    },
    {
      href: "/klant/milieu",
      icon: <BsLeaf className="w-5 h-5" />,
      label: "Milieu",
    },
    {
      href: "/klant/steekproeven",
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      label: "Steekproeven",
    },
    {
      href: "/klant/meldingen",
      icon: <BellAlertIcon className="w-5 h-5" />,
      label: "Meldingen",
    },
  ];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <nav
        className={`
          fixed top-0 left-0 w-64 min-h-screen flex flex-col z-50
          bg-[#f2f3f4] border-r border-gray-200 shadow-lg
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:shadow-none
          ${className ?? ""}
        `}
      >
        <div className="px-4 pt-5 pb-2">
          <img src="/logo2.png" alt="Logo" className="w-full mx-auto" />
        </div>

        <div className="border-t border-gray-200 mx-4 my-3" />

        <div className="flex-1 px-3 overflow-y-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={linkClass(l.href)}
              onClick={onClose}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
