// app/api/locaties-goedkeuren/route.ts
// Step 4: Admin approves locatie selection — creates profiel + profielen_locaties

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { id, email, naam, locaties_geselecteerd } = await req.json();

  if (!id || !email || !naam || !locaties_geselecteerd?.length) {
    return NextResponse.json(
      { error: "Ontbrekende gegevens" },
      { status: 400 },
    );
  }

  const { data: users, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError)
    return NextResponse.json({ error: listError.message }, { status: 400 });

  const authUser = users.users.find((u) => u.email === email);
  if (!authUser)
    return NextResponse.json(
      { error: "Auth gebruiker niet gevonden" },
      { status: 404 },
    );

  const gebruiker_id = authUser.id;

  const { data: profiel, error: profielError } = await supabaseAdmin
    .from("profielen")
    .insert({ gebruiker_id, naam, rol: "locatie_manager", email, actief: true })
    .select("id")
    .single();

  if (profielError || !profiel) {
    return NextResponse.json({ error: profielError?.message }, { status: 400 });
  }

  const { error: locatieError } = await supabaseAdmin
    .from("profielen_locaties")
    .insert(
      locaties_geselecteerd.map((locatie_id: string) => ({
        profiel_id: profiel.id,
        locatie_id,
      })),
    );

  if (locatieError) {
    return NextResponse.json({ error: locatieError.message }, { status: 400 });
  }

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: "https://floor-control.vercel.app/wachtwoordveranderen",
    });

  if (linkError) {
    console.error("Link failed:", linkError.message);
  }

  await supabaseAdmin
    .from("account_aanvraag")
    .update({ stap: "goedgekeurd", goedgekeurd: true })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
