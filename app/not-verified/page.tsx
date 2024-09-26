"use client";

import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotVerifiedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const checkVerification = async () => {
    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Error fetching user:", error);
      setLoading(false);
      return;
    }

    const { data, error: verificationError } = await supabase
      .from("users")
      .select("verified")
      .eq("id", user.id)
      .single();

    if (verificationError || !data) {
      console.error("Error fetching verification status:", verificationError);
      setLoading(false);
      return;
    }

    if (data.verified) {
      router.push("/dashboard");
    } else {
      alert(
        "Your account is still not verified. Please contact an administrator."
      );
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex justify-center mt-24 bg-background">
      <div className="text-center">
        <h1 className="text-2xl mb-4 font-semibold">Account Not Verified</h1>
        <p>
          Your account has not been verified yet. Please contact an
          administrator to get your account verified.
        </p>
        <Button
          onClick={checkVerification}
          className={`mt-4 px-4 py-2 rounded ${loading ? "bg-gray-500 cursor-not-allowed" : ""}`}
          disabled={loading}
          variant={"outline"}
        >
          {loading ? "Checking..." : "Check Verification"}
        </Button>
      </div>
    </main>
  );
}
