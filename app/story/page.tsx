import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StoryGeneratorComponent } from "@/components/StoryGenerator";

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
      <StoryGeneratorComponent />
    </main>
  );
}
