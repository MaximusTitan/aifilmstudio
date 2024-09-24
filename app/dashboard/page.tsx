import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import  ContentGenerator  from "@/components/content-generator";

export default async function ProtectedPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
<main className="min-h-screen bg-background">
      <ContentGenerator />
    </main>
  );
}
