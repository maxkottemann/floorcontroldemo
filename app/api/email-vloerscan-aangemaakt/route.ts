// app/api/email-vloerscan-aangemaakt/route.ts
import { Resend } from "resend";
import {
  VloerscanAangemaaktEmail,
  VloerscanAangemaaktEmailProps,
} from "@/components/layout/vloerscanEmailAangemaakt";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const { scanId } = await req.json();

  // Fetch vloerscan
  const { data, error } = await supabaseAdmin
    .from("vloerscans")
    .select(
      "naam, beschrijving, start_datum, eind_datum, medewerker_id, locaties(id, naam, adres, plaats)",
    )
    .eq("id", scanId)
    .single();

  if (!data || error) {
    console.log("Error fetching vloerscan:", error);
    return Response.json({ error }, { status: 500 });
  }

  const locatie_id = (data.locaties as any)?.id;

  // Fetch medewerker naam
  let medewerkerNaam: string | undefined;
  if (data.medewerker_id) {
    const { data: medewerker } = await supabaseAdmin
      .from("medewerkers")
      .select("voornaam, achternaam")
      .eq("id", data.medewerker_id)
      .single();
    if (medewerker) {
      medewerkerNaam = `${medewerker.voornaam} ${medewerker.achternaam}`;
    }
  }

  // Fetch contact personen
  const { data: contact_personen } = await supabaseAdmin
    .from("profielen")
    .select("email, profielen_locaties!inner(locatie_id)")
    .eq("profielen_locaties.locatie_id", locatie_id)
    .eq("is_contact_persoon", true);

  const emails = (contact_personen ?? [])
    .map((p: any) => p.email)
    .filter(Boolean) as string[];

  try {
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Duofort <no-reply@rso-floorcontrol.nl>",
      to: ["maxkotteman@gmail.com"],
      subject: "Nieuwe vloerscan ingepland door Duofort",
      react: VloerscanAangemaaktEmail({
        scanNaam: data.naam,
        beschrijving: data.beschrijving ?? undefined,
        startDatum: data.start_datum,
        eindDatum: data.eind_datum ?? undefined,
        locatieNaam: (data.locaties as any)?.naam ?? "—",
        locatieAdres: (data.locaties as any)?.adres ?? undefined,
        locatieplaats: (data.locaties as any)?.plaats ?? undefined,
        medewerkerNaam,
      }),
    });

    if (emailError) {
      console.log("Resend error:", emailError);
      return Response.json({ emailError }, { status: 500 });
    }

    return Response.json({ success: true, emailData });
  } catch (err) {
    console.log("Unexpected error:", err);
    return Response.json({ error: err }, { status: 500 });
  }
}
