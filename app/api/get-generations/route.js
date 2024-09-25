// app/api/get-generations/route.js
import { createClient } from "@/utils/supabase/server";

// Named export for the GET method
export async function GET(req) {
  const supabase = createClient();

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ message: "User not authenticated" }), {
      status: 403,
    });
  }

  // Fetch generations for the authenticated user using their user_id
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id); // Use user.id to query by user ID

  if (error) {
    return new Response(
      JSON.stringify({
        message: "Error fetching generations",
        error: error.message,
      }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ generations: data }), { status: 200 });
}
