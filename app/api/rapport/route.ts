export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts, PageSizes } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Duofort brand colors
const PRIMARY = rgb(0.42, 0.18, 0.58); // purple
const PRIMARY2 = rgb(0.32, 0.12, 0.46); // darker purple for group headers
const ACCENT = rgb(0.23, 0.72, 0.75); // teal from shield
const LIGHT = rgb(0.97, 0.95, 0.99); // light purple tint bg
const DARK = rgb(0.1, 0.06, 0.16); // deep text
const MUTED = rgb(0.45, 0.4, 0.52); // muted purple-grey
const BORDER = rgb(0.86, 0.82, 0.91); // light purple border
const WHITE = rgb(1, 1, 1);

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (!projectId)
    return NextResponse.json({ error: "missing project_id" }, { status: 400 });

  // Fetch project
  const { data: project } = await supabase
    .from("projecten")
    .select(
      "id, naam, start_datum, eind_datum, locaties(naam, adres, plaats, contact_persoon)",
    )
    .eq("id", projectId)
    .single();

  if (!project)
    return NextResponse.json({ error: "project not found" }, { status: 404 });

  const locatie = project.locaties as any;

  // Fetch gewassen vloeren
  const { data: gewassen } = await supabase
    .from("gewassen_vloeren")
    .select(
      "id, vierkante_meter, opmerking, reinigings_methodes(naam), kamer_vloeren(vloer_types(naam), kamers(naam, verdiepingen(naam)))",
    )
    .eq("project_id", projectId)
    .order("aangemaakt_op", { ascending: true });

  // Group by vloertype → methode → sum m2
  const groepMap: Record<
    string,
    {
      vloertype: string;
      totaal_m2: number;
      methodes: Record<string, number>;
    }
  > = {};

  for (const g of gewassen ?? []) {
    const kv = g.kamer_vloeren as any;
    const vloertype = kv?.vloer_types?.naam ?? "Onbekend";
    const methode = (g.reinigings_methodes as any)?.naam ?? "Niet opgegeven";
    const m2 = g.vierkante_meter ?? 0;
    if (!groepMap[vloertype])
      groepMap[vloertype] = { vloertype, totaal_m2: 0, methodes: {} };
    groepMap[vloertype].totaal_m2 += m2;
    groepMap[vloertype].methodes[methode] =
      (groepMap[vloertype].methodes[methode] ?? 0) + m2;
  }

  const groepen = Object.values(groepMap);
  const totaal_m2 = groepen.reduce((s, g) => s + g.totaal_m2, 0);

  // Fetch signature
  let handtekeningBytes: Uint8Array | null = null;
  const { data: ht } = await supabase
    .from("handtekeningen")
    .select("url")
    .eq("project_id", projectId)
    .single();
  if (ht?.url) {
    const { data: signed } = await supabase.storage
      .from("handtekeningen")
      .createSignedUrl(ht.url, 60);
    if (signed?.signedUrl) {
      const res = await fetch(signed.signedUrl);
      if (res.ok) handtekeningBytes = new Uint8Array(await res.arrayBuffer());
    }
  }

  // ── Build PDF ─────────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed logo
  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  let logoDims = { width: 0, height: 0 };
  try {
    const logoPath = path.join(process.cwd(), "public", "duofortlogo.png");
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
    logoDims = logoImage.scaleToFit(120, 36);
  } catch {
    /* logo optional */
  }

  const margin = 44;
  const pageW = PageSizes.A4[0]; // 595
  const pageH = PageSizes.A4[1]; // 842
  const usable = pageW - margin * 2;
  const HEADER_H = 64;

  let page = pdfDoc.addPage(PageSizes.A4);
  let y = pageH - margin;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function newPage() {
    page = pdfDoc.addPage(PageSizes.A4);
    y = pageH - margin;
    drawFooter();
  }

  function checkBreak(needed: number) {
    if (y - needed < margin + 50) newPage();
  }

  function drawFooter() {
    page.drawText(`Pagina ${pdfDoc.getPageCount()}`, {
      x: margin,
      y: 22,
      size: 7,
      font: fontR,
      color: MUTED,
    });
    page.drawText("Duofort B.V. · Toonaangevend in Vloeronderhoud", {
      x: pageW - margin - 170,
      y: 22,
      size: 7,
      font: fontR,
      color: MUTED,
    });
    // accent line at bottom
    page.drawRectangle({ x: 0, y: 0, width: pageW, height: 6, color: ACCENT });
  }

  function txt(
    t: string,
    x: number,
    yy: number,
    size = 9,
    font = fontR,
    color = DARK,
  ) {
    page.drawText(String(t ?? ""), { x, y: yy, size, font, color });
  }

  function line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color = BORDER,
    thickness = 0.5,
  ) {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      color,
      thickness,
    });
  }

  function rect(
    x: number,
    yy: number,
    w: number,
    h: number,
    color: ReturnType<typeof rgb>,
    border?: ReturnType<typeof rgb>,
  ) {
    page.drawRectangle({
      x,
      y: yy,
      width: w,
      height: h,
      color,
      ...(border ? { borderColor: border, borderWidth: 0.5 } : {}),
    });
  }

  if (logoImage) {
    page.drawImage(logoImage, {
      x: margin,
      y: pageH - margin - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
  } else {
    txt("Duofort B.V.", margin, pageH - margin - 20, 15, fontB, PRIMARY);
  }

  txt(
    "OPLEVERBON",
    pageW - margin - 115,
    pageH - margin - 16,
    16,
    fontB,
    PRIMARY,
  );
  txt(
    `#${project.id.slice(0, 8).toUpperCase()}`,
    pageW - margin - 75,
    pageH - margin - 28,
    8,
    fontR,
    MUTED,
  );

  const headerBottom = pageH - margin - logoDims.height - 12;
  line(margin, headerBottom, margin + usable, headerBottom, PRIMARY, 2);

  y = headerBottom - 18;
  drawFooter();

  // ── Info boxes ────────────────────────────────────────────────────────────
  const boxW = (usable - 9) / 4;
  const boxH = 52;
  const boxes = [
    { label: "PROJECT", value: project.naam, sub: "" },
    {
      label: "LOCATIE",
      value: locatie?.naam ?? "—",
      sub: [locatie?.adres, locatie?.plaats].filter(Boolean).join(", "),
    },
    {
      label: "PERIODE",
      value: formatDate(project.start_datum),
      sub: project.eind_datum ? `t/m ${formatDate(project.eind_datum)}` : "",
    },
    {
      label: "GEGENEREERD",
      value: formatDate(new Date().toISOString()),
      sub: locatie?.contact_persoon
        ? `Contact: ${locatie.contact_persoon}`
        : "",
    },
  ];

  boxes.forEach((box, i) => {
    const bx = margin + i * (boxW + 3);
    rect(bx, y - boxH, boxW, boxH, LIGHT, BORDER);
    // top accent bar per box
    rect(bx, y - 3, boxW, 3, ACCENT);
    txt(box.label, bx + 8, y - 16, 6, fontB, MUTED);
    const maxC = Math.floor(boxW / 5.2);
    const val =
      box.value.length > maxC ? box.value.slice(0, maxC - 2) + "…" : box.value;
    txt(val, bx + 8, y - 28, 8.5, fontB, DARK);
    if (box.sub) {
      const sub =
        box.sub.length > maxC ? box.sub.slice(0, maxC - 2) + "…" : box.sub;
      txt(sub, bx + 8, y - 40, 7, fontR, MUTED);
    }
  });
  y -= boxH + 20;

  // ── Section heading ───────────────────────────────────────────────────────
  txt("UITGEVOERD ONDERHOUD", margin, y, 8, fontB, PRIMARY);
  y -= 8;
  line(margin, y, margin + usable, y, PRIMARY, 1.5);
  y -= 14;

  // ── Tables per vloertype ──────────────────────────────────────────────────
  const colW = [usable * 0.7, usable * 0.3];
  const colX = [margin, margin + colW[0]];
  const rowH = 18;

  for (const groep of groepen) {
    const methodeRijen = Object.entries(groep.methodes);
    checkBreak(rowH * (methodeRijen.length + 2) + 20);

    // Group header bar — vloertype + totaal m²
    rect(margin, y - 24, usable, 24, PRIMARY2);
    rect(margin, y - 24, 4, 24, ACCENT);
    txt(groep.vloertype, margin + 12, y - 15, 10, fontB, WHITE);
    txt(`${groep.totaal_m2}m²`, pageW - margin - 38, y - 15, 11, fontB, WHITE);
    y -= 24;

    // Column headers
    rect(margin, y - rowH, usable, rowH, rgb(0.93, 0.9, 0.96));
    txt("REINIGINGSMETHODE", colX[0] + 8, y - 12, 6.5, fontB, PRIMARY);
    txt("TOTAAL M²", colX[1] + 8, y - 12, 6.5, fontB, PRIMARY);
    line(margin, y - rowH, margin + usable, y - rowH, BORDER);
    y -= rowH;

    // Methode rows
    methodeRijen.forEach(([methode, m2], i) => {
      checkBreak(rowH + 2);
      if (i % 2 === 1) rect(margin, y - rowH, usable, rowH, LIGHT);
      txt(methode, colX[0] + 8, y - 12, 9, fontR, DARK);
      txt(`${m2}m²`, colX[1] + 8, y - 12, 9, fontB, PRIMARY);
      line(margin, y - rowH, margin + usable, y - rowH, BORDER);
      y -= rowH;
    });

    y -= 14;
  }

  // ── Totaal row ────────────────────────────────────────────────────────────
  checkBreak(28);
  rect(margin, y - 26, usable, 26, PRIMARY);
  rect(margin, y - 26, 6, 26, ACCENT);
  txt("TOTAAL ONDERHOUDEN OPPERVLAK", margin + 14, y - 16, 9, fontB, WHITE);
  txt(`${totaal_m2}m²`, pageW - margin - 38, y - 16, 11, fontB, WHITE);
  y -= 42;

  // ── Signatures ────────────────────────────────────────────────────────────
  checkBreak(140);
  y -= 8;
  txt("AKKOORDVERKLARING", margin, y, 8, fontB, PRIMARY);
  y -= 8;
  line(margin, y, margin + usable, y, PRIMARY, 1.5);
  y -= 12;
  txt(
    "Ondergetekenden verklaren dat het beschreven onderhoud naar tevredenheid is uitgevoerd en opgeleverd.",
    margin,
    y,
    7.5,
    fontR,
    MUTED,
  );
  y -= 22;

  const sigW = (usable - 12) / 2;
  const sigH = 85;

  // Uitvoerder
  rect(margin, y - sigH, sigW, sigH, WHITE, BORDER);
  rect(margin, y - sigH, sigW, 3, ACCENT);
  txt("UITVOERDER (DUOFORT)", margin + 8, y - 14, 6, fontB, MUTED);
  if (handtekeningBytes) {
    try {
      const img = await pdfDoc.embedPng(handtekeningBytes);
      const scaled = img.scaleToFit(sigW - 24, sigH - 32);
      page.drawImage(img, {
        x: margin + 12,
        y: y - sigH + 20,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {
      /* skip */
    }
  }
  line(margin + 8, y - sigH + 20, margin + sigW - 8, y - sigH + 20, BORDER);
  txt("Handtekening uitvoerder", margin + 8, y - sigH + 10, 7, fontR, MUTED);

  // Opdrachtgever
  const rx = margin + sigW + 12;
  rect(rx, y - sigH, sigW, sigH, WHITE, BORDER);
  rect(rx, y - sigH, sigW, 3, ACCENT);
  txt("OPDRACHTGEVER", rx + 8, y - 14, 6, fontB, MUTED);
  line(rx + 8, y - sigH + 20, rx + sigW - 8, y - sigH + 20, BORDER);
  txt(
    locatie?.contact_persoon ?? "Handtekening opdrachtgever",
    rx + 8,
    y - sigH + 10,
    7,
    fontR,
    MUTED,
  );

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="opleverbon-${project.naam.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
