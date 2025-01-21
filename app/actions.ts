"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export const getImageProvider = async () => {

  const supabase = createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "image_provider")
    .single();

  if (error) {
    console.error("Error fetching image provider:", error);
    return null;
  }

  return data?.value;
};

export const getVideoProvider = async () => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "video_provider")
    .single();

  if (error) {
    console.error("Error fetching video provider:", error);
    return null;
  }

  return data?.value; 
};


export const signUpAction = async (formData: FormData) => {
  const supabase = createClient();
  
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const origin = headers().get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  // First check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select()
    .eq('email', email)
    .single();

  if (existingUser) {
    // If user exists, resend verification email
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (resendError) {
      return encodedRedirect("error", "/sign-up", resendError.message);
    }

    return encodedRedirect(
      "success",
      "/sign-up",
      "Verification email has been resent. Please check your inbox."
    );
  }

  let imageCredits = 25;
  let videoCredits = 10;

  const allowedDomains = ["igebra.ai", "prosoftpeople.com"];
  const emailDomain = email.split("@")[1];

  if (allowedDomains.includes(emailDomain)) {
    imageCredits = 50;
    videoCredits = 50;
  }

  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (signupError) {
    // Handle specific error cases
    if (signupError.message.includes('unique constraint')) {
      return encodedRedirect("error", "/sign-up", "This email is already registered. Please check your email for the verification link or try signing in.");
    }
    console.error(signupError.code + " " + signupError.message);
    return encodedRedirect("error", "/sign-up", signupError.message);
  }

  const userId = authData.user?.id;

  if (!userId) {
    return encodedRedirect("error", "/sign-up", "Unable to retrieve user ID");
  }

  const { error: insertError } = await supabase
    .from("users")
    .insert([{ id: userId, email, image_credits: imageCredits, video_credits: videoCredits }]);

  if (insertError) {
    console.error(insertError.message);
    return encodedRedirect("error", "/sign-up", insertError.message);
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link."
  );
};

export const signInAction = async (formData: FormData) => {
  const supabase = createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const email = formData.get("email")?.toString();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/dashboard/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect("success", "/dashboard/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = createClient();

  await supabase.auth.signOut();
  return redirect("/sign-in");
};
