import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { id, email, naam, locaties_geselecteerd } = await req.json();

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: "welkom",
    });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message }, { status: 400 });
  }

  const gebruiker_id = authUser.user.id;

  const { data: profiel, error: profielError } = await supabaseAdmin
    .from("profielen")
    .insert({ gebruiker_id, naam, rol: "locatie_manager", email, actief: true })
    .select("id")
    .single();

  if (profielError || !profiel) {
    await supabaseAdmin.auth.admin.deleteUser(gebruiker_id);
    return NextResponse.json({ error: profielError?.message }, { status: 400 });
  }

  if (locaties_geselecteerd?.length) {
    const { error: locatieError } = await supabaseAdmin
      .from("profielen_locaties")
      .insert(
        locaties_geselecteerd.map((locatie_id: string) => ({
          profiel_id: profiel.id,
          locatie_id,
        })),
      );

    if (locatieError) {
      return NextResponse.json(
        { error: locatieError.message },
        { status: 400 },
      );
    }
  }

  await supabaseAdmin
    .from("account_aanvraag")
    .update({ stap: "goedgekeurd", goedgekeurd: true })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
