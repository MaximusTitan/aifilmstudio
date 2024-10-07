import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { Image, Video } from "lucide-react";

export default async function AuthButton() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <div className="flex flex-col gap-4 items-center md:flex-row md:justify-between">
        <div>
          <Badge
            variant={"default"}
            className="font-normal pointer-events-none"
          >
            Please update .env.local file with anon key and url
          </Badge>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <Button
            asChild
            size="sm"
            variant={"outline"}
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={"default"}
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  const adminEmails = ["yohan@igebra.ai", "chirans@gmail.com"];

  let userImageCredits = 0;
  let userVideoCredits = 0;
  if (user) {
    const { data, error: creditsError } = await supabase
      .from("users")
      .select("image_credits, video_credits")
      .eq("email", user.email)
      .single();

    if (creditsError) {
      console.error("Error fetching user credits:", creditsError.message);
    } else if (data) {
      userImageCredits = data.image_credits;
      userVideoCredits = data.video_credits;
    }
  }

  return user ? (
    <div className="flex flex-col md:flex-row items-center justify-between w-full p-4">
      <span className="text-sm">Hey, {user.email}!</span>
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        <span className="flex items-center mr-4">
          <Image className="mr-2 h-4 w-4" />
          Credits: {userImageCredits}
        </span>
        <span className="flex items-center">
          <Video className="mr-2 h-4 w-4" />
          Credits: {userVideoCredits}
        </span>

        {user.email && adminEmails.includes(user.email) && (
          <Link href="/admin">
            <Button variant="outline">Admin</Button>
          </Link>
        )}

        <Link href="/credits">
          <Button variant="outline">Credits</Button>
        </Link>

        <form action={signOutAction}>
          <Button type="submit" variant={"outline"}>
            Sign out
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
