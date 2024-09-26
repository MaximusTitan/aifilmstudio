import { createClient } from "@/utils/supabase/server";

export async function GET(req) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ message: "User not authenticated" }), {
      status: 403,
    });
  }

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user.id);

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
