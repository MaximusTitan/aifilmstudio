import { NextResponse } from "next/server";
import axios from "axios";
import LumaAI from "lumaai";

export const maxDuration = 300;

export async function POST(request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    if (!prompt || !aspect_ratio) {
      return NextResponse.json(
        { message: "Prompt and aspect ratio are required" },
        { status: 400 }
      );
    }

    const client = new LumaAI({
      authToken: process.env.LUMAAI_API_KEY, // Ensure this is set in your .env.local
    });

    console.log("LumaAI client initialized");

    // Step 1: Create the generation with the given aspect ratio
    const generation = await client.generations.create({
      aspect_ratio: aspect_ratio,
      prompt,
    });

    console.log("Generation created:", generation);

    // Step 2: Retrieve the generation ID
    const generationId = generation.id;

    console.log("Generation ID:", generationId);

    // Poll for completion
    let isCompleted = false;
    let videoUrl = "";
    while (!isCompleted) {
      // Step 3: Fetch the current state of the generation
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
        videoUrl = assets?.video || ""; // Use optional chaining to avoid undefined error
      } else if (state === "failed") {
        return NextResponse.json(
          { message: "Video generation failed" },
          { status: 500 }
        );
      }

      // Wait before the next poll (you can adjust the timeout as needed)
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Step 4: Return the video URL
    if (videoUrl) {
      return NextResponse.json({ videoUrl });
    } else {
      return NextResponse.json(
        { message: "Video URL not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error generating or fetching video:", error);
    console.error("Error details:", error.response?.data || error.message);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
