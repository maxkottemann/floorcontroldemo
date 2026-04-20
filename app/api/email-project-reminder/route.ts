import { Resend } from "resend";
import { ProjectReminderEmail } from "@/components/layout/reminderEmailTemplate";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const { projectId } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("projecten")
    .select(
      "naam,locaties(id,naam,adres,contact_persoon,plaats),start_datum,eind_datum,beschrijving,opmerkingen",
    )
    .eq("id", projectId)
    .single();

  if (!data || error) {
    console.log("Error1:", error);
    return Response.json({ error }, { status: 500 });
  }

  const locatie_id = (data as any)?.locaties?.id;

  const { data: data2, error: error2 } = await supabaseAdmin
    .from("project_vloeren")
    .select("kamer_vloeren(vloer_types(naam),vierkante_meter)")
    .eq("project_id", projectId);

  if (!data2 || error2) {
    console.log("Error2:", error2);
    return Response.json({ error2 }, { status: 500 });
  }

  const vloertypeMap: Record<string, number> = {};

  for (const row of data2 ?? []) {
    const kv = row.kamer_vloeren as any;
    const naam = kv?.vloer_types?.naam ?? "Onbekend";
    const m2 = kv?.vierkante_meter ?? 0;
    vloertypeMap[naam] = (vloertypeMap[naam] ?? 0) + m2;
  }
  const vloertypes = Object.entries(vloertypeMap).map(([naam, m2]) => ({
    naam,
    m2,
  }));
  const totaalM2 = vloertypes.reduce((sum, vt) => sum + vt.m2, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startdatum = new Date(data.start_datum);
  startdatum.setHours(0, 0, 0, 0);

  const dagenTotStart = Math.ceil(
    (startdatum.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  {
    dagenTotStart <= 5 && dagenTotStart >= 0;

    const { data: data3, error: error3 } = await supabaseAdmin
      .from("project_bussen")
      .select(
        "bussen(naam,kenteken),project_bus_medewerkers(medewerkers(voornaam,achternaam))",
      )
      .eq("project_id", projectId);

    if (!data3 || error3) {
      console.log("Error3:", error3);
      return Response.json({ error: error3 }, { status: 500 });
    }

    const bussen = (data3 ?? []).map((pb: any) => ({
      naam: pb.bussen?.naam ?? "—",
      kenteken: pb.bussen?.kenteken ?? "—",
      crew: (pb.project_bus_medewerkers ?? []).map((pbm: any) =>
        `${pbm.medewerkers?.voornaam} ${pbm.medewerkers?.achternaam}`.trim(),
      ),
    }));

    const { data: contact_personen } = await supabaseAdmin
      .from("profielen")
      .select("email, profielen_locaties!inner(locatie_id)")
      .eq("profielen_locaties.locatie_id", locatie_id)
      .eq("is_contact_persoon", true);

    console.log(contact_personen);

    const emails = (contact_personen ?? [])
      .map((p: any) => p.email)
      .filter(Boolean) as string[];

    try {
      const { data: email, error: emailerror } = await resend.emails.send({
        from: "Duofort <no-reply@rso-floorcontrol.nl>",
        to: emails,
        subject: "Project herinnering",
        react: ProjectReminderEmail({
          projectNaam: data.naam,
          startDatum: data.start_datum,
          eindDatum: data.eind_datum,
          locatieNaam: (data as any)?.locaties.naam,
          locatieAdres: (data as any)?.locaties.adres,
          contactNaam: (data as any)?.locaties.contact_persoon,
          vloertypes: vloertypes,
          bussen: bussen,
          totaalM2: totaalM2,
        }),
      });

      if (emailerror) {
        return Response.json({ emailerror }, { status: 500 });
      }
      const { error: error5 } = await supabaseAdmin
        .from("projecten")
        .update({ reminder_verzonden: true })
        .eq("id", projectId);
      return Response.json(email);
    } catch (emailerror) {
      return Response.json({ emailerror }, { status: 500 });
    }
  }
}
