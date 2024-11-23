import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";
import { createClient } from "@/utils/supabase/server";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, image_size, num_inference_steps, num_images, story } = body; // Added 'story'

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

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: image_size || "landscape_16_9",
        num_inference_steps: num_inference_steps || 4,
        num_images: num_images || 1,
        enable_safety_checker: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    if (!result || !result.images || result.images.length === 0) {
      return NextResponse.json(
        { message: "Image URL not found" },
        { status: 404 }
      );
    }

    const imageUrl = result.images[0].url;

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

    if (!publicURL) {
      return NextResponse.json(
        { message: "Error getting public URL", error: "Public URL is null" },
        { status: 500 }
      );
    }

    const creditsUsed = 1;
    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("image_credits")
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

    const userImageCredits = userData[0].image_credits;
    if (userImageCredits < creditsUsed) {
      return NextResponse.json(
        { message: "Not enough image credits" },
        { status: 403 }
      );
    }

    const { error: deductError } = await supabase
      .from("users")
      .update({ image_credits: userImageCredits - creditsUsed })
      .eq("id", userId);

    if (deductError) {
      return NextResponse.json(
        { message: "Error updating image credits", error: deductError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        user_email: userEmail,
        type: "image",
        parameters: { prompt, image_size, num_inference_steps, num_images },
        result_path: publicURL,
        credits_used: creditsUsed,
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        {
          message: "Error saving generation record",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // Check if the request came from the story flow
    if (story) {
      const { data: currentData, error: fetchError } = await supabase
        .from("story_generations")
        .select("generated_images")
        .eq("user_email", userEmail)
        .eq("story", story)
        .single();

      if (fetchError) {
        console.error(
          "Error fetching current generated_images:",
          fetchError.message
        );
        throw new Error("Failed to fetch current generated_images.");
      }

      const existingImages = currentData.generated_images || [];
      const updatedImages = [...existingImages, publicURL];

      // Update the generated_images array
      const { error: updateError } = await supabase
        .from("story_generations")
        .update({
          generated_images: updatedImages, // Directly set the updated array
        })
        .eq("user_email", userEmail)
        .eq("story", story);

      if (updateError) {
        console.error("Error updating generated images:", updateError.message);
        // Optionally handle the error
      }
    }

    return NextResponse.json({ imageUrl: publicURL });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
