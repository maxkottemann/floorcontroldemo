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

const PRIMARY = rgb(0.42, 0.18, 0.58);
const PRIMARY2 = rgb(0.32, 0.12, 0.46);
const ACCENT = rgb(0.23, 0.72, 0.75);
const LIGHT = rgb(0.97, 0.95, 0.99);
const DARK = rgb(0.1, 0.06, 0.16);
const MUTED = rgb(0.45, 0.4, 0.52);
const BORDER = rgb(0.86, 0.82, 0.91);
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

  const { data: gewassen } = await supabase
    .from("gewassen_vloeren")
    .select(
      "id, vierkante_meter, opmerking, reinigings_methodes(naam), kamer_vloeren(vloer_types(naam), kamers(naam, verdiepingen(naam)))",
    )
    .eq("project_id", projectId)
    .order("aangemaakt_op", { ascending: true });

  const groepMap: Record<
    string,
    { vloertype: string; totaal_m2: number; methodes: Record<string, number> }
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

  const { data: handtekeningen } = await supabase
    .from("handtekeningen")
    .select("url, type")
    .eq("project_id", projectId);

  const werknemerHt = handtekeningen?.find((h) => h.type === "werknemer");
  const klantHt = handtekeningen?.find((h) => h.type === "klant");

  async function fetchSignatureBytes(url: string): Promise<Uint8Array | null> {
    const { data: signed } = await supabase.storage
      .from("handtekeningen")
      .createSignedUrl(url, 60);
    if (!signed?.signedUrl) return null;
    const res = await fetch(signed.signedUrl);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  }

  const werknemerBytes = werknemerHt?.url
    ? await fetchSignatureBytes(werknemerHt.url)
    : null;
  const klantBytes = klantHt?.url
    ? await fetchSignatureBytes(klantHt.url)
    : null;

  const pdfDoc = await PDFDocument.create();
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  let logoDims = { width: 0, height: 0 };
  try {
    const logoBytes = fs.readFileSync(
      path.join(process.cwd(), "public", "duofortlogo.png"),
    );
    logoImage = await pdfDoc.embedPng(logoBytes);
    logoDims = logoImage.scaleToFit(120, 36);
  } catch {}

  const margin = 44;
  const pageW = PageSizes.A4[0];
  const pageH = PageSizes.A4[1];
  const usable = pageW - margin * 2;

  let page = pdfDoc.addPage(PageSizes.A4);
  let y = pageH - margin;

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

  function drawWrapped(
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    size: number,
    font: typeof fontR,
    color: ReturnType<typeof rgb>,
    lineHeight = size + 3,
  ): number {
    const words = String(text ?? "").split(" ");
    let currentLine = "";
    let currentY = startY;
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && currentLine) {
        page.drawText(currentLine, { x, y: currentY, size, font, color });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, { x, y: currentY, size, font, color });
      currentY -= lineHeight;
    }
    return currentY;
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
    pageW - margin - 92,
    pageH - margin - 16,
    16,
    fontB,
    PRIMARY,
  );
  txt(
    `#${project.id.slice(0, 8).toUpperCase()}`,
    pageW - margin - 56,
    pageH - margin - 28,
    8,
    fontR,
    MUTED,
  );

  const headerBottom = pageH - margin - logoDims.height - 12;
  line(margin, headerBottom, margin + usable, headerBottom, PRIMARY, 2);
  y = headerBottom - 18;
  drawFooter();

  const boxW = (usable - 9) / 4;
  const boxH = 64;
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
    rect(bx, y - 3, boxW, 3, ACCENT);
    txt(box.label, bx + 8, y - 16, 6, fontB, MUTED);
    const afterVal = drawWrapped(
      box.value,
      bx + 8,
      y - 28,
      boxW - 16,
      8.5,
      fontB,
      DARK,
      11,
    );
    if (box.sub)
      drawWrapped(box.sub, bx + 8, afterVal, boxW - 16, 7, fontR, MUTED, 10);
  });
  y -= boxH + 20;

  txt("UITGEVOERD ONDERHOUD", margin, y, 8, fontB, PRIMARY);
  y -= 8;
  line(margin, y, margin + usable, y, PRIMARY, 1.5);
  y -= 14;

  const colW = [usable * 0.7, usable * 0.3];
  const colX = [margin, margin + colW[0]];
  const rowH = 20;

  for (const groep of groepen) {
    const methodeRijen = Object.entries(groep.methodes);
    checkBreak(rowH * (methodeRijen.length + 2) + 20);

    rect(margin, y - 28, usable, 28, PRIMARY2);
    rect(margin, y - 28, 4, 28, ACCENT);
    drawWrapped(
      groep.vloertype,
      margin + 12,
      y - 13,
      colW[0] - 24,
      10,
      fontB,
      WHITE,
      12,
    );
    txt(`${groep.totaal_m2}m²`, pageW - margin - 40, y - 16, 11, fontB, WHITE);
    y -= 28;

    rect(margin, y - rowH, usable, rowH, rgb(0.93, 0.9, 0.96));
    txt("REINIGINGSMETHODE", colX[0] + 8, y - 13, 6.5, fontB, PRIMARY);
    txt("TOTAAL M²", colX[1] + 8, y - 13, 6.5, fontB, PRIMARY);
    line(margin, y - rowH, margin + usable, y - rowH, BORDER);
    y -= rowH;

    methodeRijen.forEach(([methode, m2], i) => {
      const words = methode.split(" ");
      let testLine = "";
      let lineCount = 1;
      for (const word of words) {
        const test = testLine ? `${testLine} ${word}` : word;
        if (fontR.widthOfTextAtSize(test, 9) > colW[0] - 16 && testLine) {
          lineCount++;
          testLine = word;
        } else {
          testLine = test;
        }
      }
      const dynamicRowH = rowH + (lineCount - 1) * 12;
      checkBreak(dynamicRowH + 2);
      if (i % 2 === 1)
        rect(margin, y - dynamicRowH, usable, dynamicRowH, LIGHT);
      drawWrapped(
        methode,
        colX[0] + 8,
        y - 8,
        colW[0] - 16,
        9,
        fontR,
        DARK,
        12,
      );
      txt(`${m2}m²`, colX[1] + 8, y - 12, 9, fontB, PRIMARY);
      line(margin, y - dynamicRowH, margin + usable, y - dynamicRowH, BORDER);
      y -= dynamicRowH;
    });

    y -= 14;
  }

  checkBreak(28);
  rect(margin, y - 26, usable, 26, PRIMARY);
  rect(margin, y - 26, 6, 26, ACCENT);
  txt("TOTAAL ONDERHOUDEN OPPERVLAK", margin + 14, y - 16, 9, fontB, WHITE);
  txt(`${totaal_m2}m²`, pageW - margin - 40, y - 16, 11, fontB, WHITE);
  y -= 42;

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

  rect(margin, y - sigH, sigW, sigH, WHITE, BORDER);
  rect(margin, y - sigH, sigW, 3, ACCENT);
  txt("UITVOERDER (DUOFORT)", margin + 8, y - 14, 6, fontB, MUTED);
  if (werknemerBytes) {
    try {
      const img = await pdfDoc.embedPng(werknemerBytes);
      const scaled = img.scaleToFit(sigW - 24, sigH - 32);
      page.drawImage(img, {
        x: margin + 12,
        y: y - sigH + 22,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {}
  }
  line(margin + 8, y - sigH + 20, margin + sigW - 8, y - sigH + 20, BORDER);
  txt("Handtekening uitvoerder", margin + 8, y - sigH + 10, 7, fontR, MUTED);
  const rx = margin + sigW + 12;
  rect(rx, y - sigH, sigW, sigH, WHITE, BORDER);
  rect(rx, y - sigH, sigW, 3, ACCENT);
  txt("OPDRACHTGEVER", rx + 8, y - 14, 6, fontB, MUTED);
  if (klantBytes) {
    try {
      const img = await pdfDoc.embedPng(klantBytes);
      const scaled = img.scaleToFit(sigW - 24, sigH - 32);
      page.drawImage(img, {
        x: rx + 12,
        y: y - sigH + 22,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {}
  }
  line(rx + 8, y - sigH + 20, rx + sigW - 8, y - sigH + 20, BORDER);
  drawWrapped(
    locatie?.contact_persoon ?? "Handtekening opdrachtgever",
    rx + 8,
    y - sigH + 10,
    sigW - 16,
    7,
    fontR,
    MUTED,
    9,
  );

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="opleverbon-${project.naam.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
