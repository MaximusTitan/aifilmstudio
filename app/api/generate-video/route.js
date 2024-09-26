import { NextResponse } from "next/server";
import axios from "axios";
import LumaAI from "lumaai";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 300;

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

    const client = new LumaAI({
      authToken: process.env.LUMAAI_API_KEY,
    });

    console.log("LumaAI client initialized");

    const generation = await client.generations.create({
      aspect_ratio: aspect_ratio,
      prompt,
    });

    console.log("Generation created:", generation);

    const generationId = generation.id;

    console.log("Generation ID:", generationId);

    let isCompleted = false;
    let videoUrl = "";
    while (!isCompleted) {
      const options = {
        method: "GET",
        url: `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.LUMAAI_API_KEY}`,
        },
      };

      const response = await axios.request(options);
      console.log("Polling response:", response.data);

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
        parameters: { prompt, aspect_ratio },
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
