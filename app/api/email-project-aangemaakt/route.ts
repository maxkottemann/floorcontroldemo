import { Resend } from "resend";
import { ProjectAangemaaktEmail } from "@/components/layout/emailtemplate";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const { projectId } = await req.json()

    const { data,error  } = await supabaseAdmin
    .from("projecten")
    .select("naam,locaties(naam,adres,contact_persoon,plaats),start_datum,eind_datum,beschrijving,opmerkingen")
    .eq("id",projectId).single()

    if(!data|| error){
        console.log("Error1:", error)
        return Response.json({error},{status: 500})
    }


    const {data: data2, error: error2} = await supabaseAdmin
    .from("project_vloeren")
    .select("kamer_vloeren(vloer_types(naam),vierkante_meter)")
    .eq("project_id",projectId)

    if (!data2 || error2) {
      console.log("Error2:", error2)
  return Response.json({ error2 }, { status: 500 });
} 

    const vloertypeMap: Record<string, number> = {};

for (const row of data2 ?? []) {
  const kv = row.kamer_vloeren as any;
  const naam = kv?.vloer_types?.naam ?? "Onbekend";
  const m2 = kv?.vierkante_meter ?? 0;
  vloertypeMap[naam] = (vloertypeMap[naam] ?? 0) + m2;
}
const vloertypes = Object.entries(vloertypeMap).map(([naam, m2]) => ({ naam, m2 }));
const totaalM2 = vloertypes.reduce((sum, vt) => sum + vt.m2, 0);


try {
    const { data:data3, error:error3 } = await resend.emails.send({
      from: "Duofort FloorControl <no-reply@rso-floorcontrol.nl>",
      to: ["maxkotteman@gmail.com"],
      subject: "Nieuw project ingepland door Duofort",
      react: ProjectAangemaaktEmail({
        projectNaam: data?.naam,
        opmerking: data?.opmerkingen,
        beschrijving:data?.beschrijving,
        locatieNaam:(data as any )?.locaties?.naam,
        locatieAdres:(data as any)?.locaties?.adres,
        locatieplaats:(data as any)?.locaties?.plaats,
        contactPersoon:(data as any)?.locaties?.contact_persoon,
        startDatum:data?.start_datum,
        eindDatum: data?.eind_datum,
        vloertypes:vloertypes,
        totaalM2:totaalM2
     }),
    });
    if (error3) {
      console.log("Resend error:", error3);
      return Response.json({ error3 }, { status: 500 });
    }
    return Response.json(data3);
} catch(error){
    return Response.json({error},{status:500})
}
}
