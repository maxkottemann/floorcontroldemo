import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/account-aanvragen", "/auth/callback"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Not logged in
  if (error || !user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Allow locaties-kiezen for logged in users without profiel
  if (pathname.startsWith("/locaties-kiezen")) {
    return res;
  }

  // Check profiel
  const { data: profiel } = await supabase
    .from("profielen")
    .select("id, rol")
    .eq("gebruiker_id", user.id)
    .single();

  // No profiel → must pick locaties first
  if (!profiel) {
    return NextResponse.redirect(new URL("/locaties-kiezen", req.url));
  }

  const rol = profiel.rol;

  // locatie_manager → only /klant routes
  if (rol === "locatie_manager" && !pathname.startsWith("/klant")) {
    return NextResponse.redirect(new URL("/klant/dashboard", req.url));
  }

  // admin → no /klant routes
  if (rol === "admin" && pathname.startsWith("/klant")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
