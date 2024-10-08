import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { Image, Video, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getAdminEmails = () => {
  const emails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return emails.split(",").map((email) => email.trim());
};

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

  const adminEmails = getAdminEmails();

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
    <div className="flex items-center justify-end w-full p-4">
      <div className="flex items-center gap-4">
        <span className="flex items-center mr-4">
          <Image className="mr-2 h-4 w-4" />
          <span className="text-sm">{userImageCredits}</span>
        </span>
        <span className="flex items-center mr-4">
          <Video className="mr-2 h-4 w-4" />
          <span className="text-sm">{userVideoCredits}</span>
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0"
            >
              {" "}
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt={user.email || ""}
                  className="rounded-full"
                />
                <AvatarFallback>
                  {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.email && adminEmails.includes(user.email) && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <User className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/credits">
                <Settings className="mr-2 h-4 w-4" />
                <span>Credits</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOutAction} className="w-full">
                <button type="submit" className="flex w-full items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
