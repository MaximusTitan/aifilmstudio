import { NextResponse } from "next/server";
import axios from "axios";
import LumaAI from "lumaai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 300;

export async function POST(request) {
  try {
    const { prompt, keyframes, aspect_ratio } = await request.json();
    const imageUrl = keyframes?.frame0?.url;

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "User not authenticated",
          error: userError?.message || "No user found",
        },
        { status: 403 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    if (!prompt || !imageUrl) {
      return NextResponse.json(
        { message: "Prompt and image URL are required" },
        { status: 400 }
      );
    }

    const client = new LumaAI({ authToken: process.env.LUMAAI_API_KEY });

    const generation = await client.generations.create({
      aspect_ratio,
      prompt,
      keyframes: {
        frame0: { type: "image", url: imageUrl },
      },
    });

    const generationId = generation.id;

    let isCompleted = false;
    let videoUrl = "";

    while (!isCompleted) {
      try {
        const response = await axios.get(
          `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
          {
            headers: {
              accept: "application/json",
              authorization: `Bearer ${process.env.LUMAAI_API_KEY}`,
            },
          }
        );

        const { state, assets } = response.data;

        if (state === "completed") {
          isCompleted = true;
          videoUrl = assets?.video || "";
        } else if (state === "failed") {
          return NextResponse.json(
            { message: "Video generation failed" },
            { status: 500 }
          );
        }
      } catch (pollingError) {
        console.error("Error during polling:", pollingError);
        return NextResponse.json(
          { message: "Error fetching generation status" },
          { status: 500 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (!videoUrl) {
      return NextResponse.json(
        { message: "Video URL not found" },
        { status: 404 }
      );
    }

    const creditsUsed = 5;

    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userCreditsError || !userData) {
      return NextResponse.json(
        {
          message: "Error fetching user data",
          error: userCreditsError?.message || "No user data found",
        },
        { status: 500 }
      );
    }

    const userCredits = userData.credits;

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
      return NextResponse.json(
        { message: "Error updating credits", error: deductError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        type: "video",
        user_email: userEmail,
        parameters: { prompt, imageUrl, aspect_ratio },
        result_path: videoUrl,
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

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error("Error generating or fetching video:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
