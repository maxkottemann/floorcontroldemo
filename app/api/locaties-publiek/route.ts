// app/api/locaties-publiek/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const { data } = await supabaseAdmin
    .from("locaties")
    .select("id, naam, type, plaats, percelen(naam)")
    .order("naam");

  return NextResponse.json(data ?? []);
}
