import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const allowedEmails = [
  "yohan@igebra.ai",
  "chirans@gmail.com",
  // Add more emails as needed
];

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
      // Check if user is allowed to access the /admin route
      if (request.nextUrl.pathname.startsWith("/admin")) {
        if (user.email && !allowedEmails.includes(user.email)) {
          return NextResponse.redirect(new URL("/", request.url)); // Redirect to home for unauthorized users
        }
      }

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

      if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/story")) {
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
