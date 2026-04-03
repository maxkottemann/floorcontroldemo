"use client";

import Card from "@/components/card";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex">
      <Sidebar className="fixed top-0 left-0 h-screen" />

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Dashboard" />
        <main className="flex-1 overflow-auto p-6 bg-bg">
          <div className="grid grid-cols-2 lg:grid-cols-4 items-center justify-center gap-10">
            <Card>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
              <p className="text-2xl font-bold">92%</p>
            </Card>
            <Card>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
              <p className="text-2xl font-bold">92%</p>
            </Card>
            <Card>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
              <p className="text-2xl font-bold">92%</p>
            </Card>
            <Card>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
              <p className="text-2xl font-bold">92%</p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
