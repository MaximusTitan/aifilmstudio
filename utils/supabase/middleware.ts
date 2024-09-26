import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      return response;
    }

    if (user) {
      const { data: userData, error: verificationError } = await supabase
        .from("users")
        .select("verified")
        .eq("id", user.id)
        .single();

      if (verificationError || !userData) {
        console.error("Error fetching verification status:", verificationError);
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }

      if (request.nextUrl.pathname === "/" && user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        if (!userData.verified) {
          return NextResponse.redirect(new URL("/not-verified", request.url));
        }
      }
    }

    return response;
  } catch (e) {
    console.error("Error in middleware:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
