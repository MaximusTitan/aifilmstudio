import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Make sure to set this in your environment variables
});

export async function POST(request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

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
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating or fetching image:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
