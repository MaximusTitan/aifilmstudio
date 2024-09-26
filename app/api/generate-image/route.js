import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/utils/supabase/server";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "User not authenticated",
          error: userError ? userError.message : "No user found",
        },
        { status: 403 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log("Authenticated user ID:", userId);

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: prompt,
        aspect_ratio: aspect_ratio,
      },
    });

    if (!output || output.length === 0) {
      return NextResponse.json(
        { message: "Image URL not found" },
        { status: 404 }
      );
    }

    const imageUrl = output[0];

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch the image from the generated URL");
    }

    const imageBlob = await imageResponse.blob();

    const fileName = `generated-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, imageBlob, {
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return NextResponse.json(
        { message: "Error uploading image", error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    const publicURL = publicUrlData.publicUrl;

    console.log("Generated Public URL:", publicURL);
    if (!publicURL) {
      console.error("Public URL is null");
      return NextResponse.json(
        { message: "Error getting public URL", error: "Public URL is null" },
        { status: 500 }
      );
    }

    const creditsUsed = 1;

    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .limit(1);

    if (userCreditsError || !userData || userData.length === 0) {
      return NextResponse.json(
        {
          message: "Error fetching user data",
          error: userCreditsError
            ? userCreditsError.message
            : "No user data found",
        },
        { status: 500 }
      );
    }

    const userCredits = userData[0].credits;

    if (userCredits < creditsUsed) {
      return NextResponse.json(
        { message: "Not enough credits" },
        { status: 403 }
      );
    }

    const { error: deductError } = await supabase
      .from("users")
      .update({ credits: userCredits - creditsUsed })
      .eq("id", userId);

    if (deductError) {
      console.error("Deduct credits error:", deductError.message);
      return NextResponse.json(
        { message: "Error updating credits", error: deductError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        user_email: userEmail,
        type: "image",
        parameters: { prompt, aspect_ratio },
        result_path: publicURL,
        credits_used: creditsUsed,
      },
    ]);

    if (insertError) {
      console.error("Insert generation record error:", insertError.message);
      return NextResponse.json(
        {
          message: "Error saving generation record",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return the generated image URL as a response
    return NextResponse.json({ imageUrl: publicURL });
  } catch (error) {
    console.error("Error generating or fetching image:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
