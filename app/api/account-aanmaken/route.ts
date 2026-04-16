import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { id, email, naam } = await req.json();

  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { naam },
      redirectTo: "http://localhost:3000/confirm",
    });
  if (authError || !authUser.user) {
    console.error("Auth error:", authError?.message);
    return NextResponse.json({ error: authError?.message }, { status: 400 });
  }

  const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  if (linkError) {
    console.error("Link generation failed:", linkError.message);
  }

  await supabaseAdmin
    .from("account_aanvraag")
    .update({ stap: "account_aangemaakt" })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
