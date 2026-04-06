"use client";

import Card from "@/components/layout/card";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default function DashboardPage() {
  const planning = [
    { regio: "Perceel 2", locaties: 79, gepland: 64, afgerond: 51, risico: 4 },
    {
      regio: "Type 2 locaties",
      locaties: 22,
      gepland: 18,
      afgerond: 13,
      risico: 3,
    },
    {
      regio: "Type 3 locaties",
      locaties: 11,
      gepland: 9,
      afgerond: 6,
      risico: 2,
    },
  ];

  const tasks = [
    {
      locatie: "PI Lelystad",
      type: "Planbaar in overleg",
      status: "In afstemming",
      datum: "08 apr",
      owner: "Projectleider",
    },
    {
      locatie: "Rijkskantoor Arnhem",
      type: "Plint tot plint",
      status: "Uitvoering vandaag",
      datum: "27 mrt",
      owner: "Team Oost",
    },
    {
      locatie: "Brugbedieningscentrale Zwolle",
      type: "Additioneel",
      status: "Offerte akkoord",
      datum: "02 apr",
      owner: "Regisseur",
    },
    {
      locatie: "DV&O Grave",
      type: "Type 3",
      status: "Begeleiding ontbreekt",
      datum: "05 apr",
      owner: "Contractmanager",
    },
  ];

  const sustainability = [
    { label: "CO₂-reductie mobiliteit", value: 18, target: 25, suffix: "%" },
    { label: "Afvalreductie", value: 42, target: 50, suffix: "%" },
    { label: "Chemiereductie", value: 61, target: 70, suffix: "%" },
    { label: "Elektrische ritten", value: 74, target: 80, suffix: "%" },
  ];

  const kpis = [
    {
      title: "Jaarplanning gereed",
      value: "92%",
      sub: "Voor volgend kalenderjaar",
    },
    {
      title: "Uitvoering op schema",
      value: "87%",
      sub: "Binnen afgesproken venster",
    },
    {
      title: "Kwaliteit oplevering",
      value: "96,4%",
      sub: "Boven KPI-norm 95%",
    },
    { title: "Open meldingen", value: "7", sub: "2 kritisch, 5 regulier" },
  ];

  const ring = (value: number) => ({
    background: `conic-gradient(#2563eb 0 ${value}%, #e5e7eb ${value}% 100%)`,
  });

  const barWidth = (value: number, max = 100) =>
    `${Math.min(100, (value / max) * 100)}%`;
  return (
    <div className="min-h-screen flex">
      <Sidebar className="fixed top-0 left-0 h-screen" />

      <div className="flex flex-col flex-1 h-screen">
        <Topbar title="Dashboard" />
        <main className="flex-1 overflow-auto p-6 bg-bg">
          <div className="grid grid-cols-2 lg:grid-cols-4 items-center justify-center gap-5 mb-2">
            <Card>
              <p className="text-slate-500 text-sm mb-2">Jaarplanning gereed</p>
              <p className="text-3xl font-bold mb-2">92%</p>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
            </Card>
            <Card>
              <p className="text-slate-500 text-sm mb-2">Jaarplanning gereed</p>
              <p className="text-3xl font-bold mb-2 ">92%</p>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
            </Card>
            <Card>
              <p className="text-slate-500 text-sm mb-2">Jaarplanning gereed</p>
              <p className="text-3xl font-bold mb-2">92%</p>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
            </Card>
            <Card clickable={true}>
              <p className="text-slate-500 text-sm mb-2">Jaarplanning gereed</p>
              <p className="text-3xl font-bold mb-2">92%</p>
              <p className="text-slate-500 text-sm">Jaarplanning gereed</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <Card className="col-span-3 mt-5">
              <div className="flex flex-row justify-between">
                <div>
                  <p className="text-lg font-bold">Planningsoverzicht</p>
                  <p className="text-sm text-slate-500">
                    Jaarplanning, voortgang en locaties met verhoogd risico
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  Eis 43 gekoppeld
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {planning.map((row) => (
                  <div
                    key={row.regio}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.regio}</div>
                        <div className="text-sm text-slate-500">
                          {row.locaties} locaties in scope
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        Risicolocaties:{" "}
                        <span className="font-semibold text-slate-900">
                          {row.risico}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>Gepland</span>
                          <span>
                            {row.gepland}/{row.locaties}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200">
                          <div
                            className="h-3 rounded-full bg-slate-900"
                            style={{
                              width: barWidth(row.gepland, row.locaties),
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>Afgerond</span>
                          <span>
                            {row.afgerond}/{row.locaties}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200">
                          <div
                            className="h-3 rounded-full bg-blue-600"
                            style={{
                              width: barWidth(row.afgerond, row.locaties),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="col-span-2 mt-5">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold">Duurzaamheid</h2>
                  <p className="text-sm text-slate-600">
                    Actuele contractprestaties t.o.v. doelstelling
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-5">
                  {sustainability.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 p-4 text-center"
                    >
                      <div
                        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full p-2"
                        style={ring(item.value)}
                      >
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl font-semibold">
                          {item.value}
                          {item.suffix}
                        </div>
                      </div>
                      <div className="mt-3 text-sm font-medium">
                        {item.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Doel: {item.target}
                        {item.suffix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="col-span-3">
              <div className="flex flex-row justify-between">
                <div>
                  <p className="text-lg font-bold">Actuele uitvoeringen</p>
                  <p className="text-sm text-slate-500">
                    Werkvoorraad, voortgang en afwijkingen
                  </p>
                </div>
                <div className="inline-flex items-center justify-center rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                  2 escalaties
                </div>
              </div>
            </Card>
            <Card className="col-span-2"></Card>
          </div>
        </main>
      </div>
    </div>
  );
}
