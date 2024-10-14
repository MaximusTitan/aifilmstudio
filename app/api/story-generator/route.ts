// /app/api/story-generator/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, type } = await request.json();

  if (!prompt) {
    return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
  }

  // Set the model and additional context based on the type of request
  let messages = [{ role: "user", content: prompt }];
  let model = "gpt-4o";  // Update with the latest model name
  
  // Add clear instructions for each type of request
  if (type === "screenplay") {
    messages = [{ role: "user", content: `Please convert this story to a screenplay: ${prompt}` }];
  } else if (type === "imagePrompts") {
    messages = [{ role: "user", content: `Please generate image prompts for the following story: ${prompt}` }];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // Ensure the 'choices' array and 'message' property exist
    const result = data.choices?.[0]?.message?.content?.trim();
    if (!result) {
      throw new Error("Response failed. No valid response from OpenAI.");
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      { message: "Error generating content", error: errorMessage },
      { status: 500 }
    );
  }
}
