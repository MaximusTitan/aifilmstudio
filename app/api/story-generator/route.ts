// /app/api/story-generator/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt, type } = await request.json();

  if (!prompt) {
    return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
  }

  // Set the model and additional context based on the type of request
  let model = "gpt-4o";  // Updated with the correct model name
  let systemMessage = "You are a creative assistant skilled in generating content.";

  // Add clear instructions for each type of request
  if (type === "screenplay") {
    systemMessage = "You are a screenwriter who converts stories into well-structured screenplays.";
  } else if (type === "imagePrompts") {
    systemMessage = "You are an expert in generating concise and realistic cinematic image prompts. Generate a minimum of 5 image prompts and limit each prompt to under 400 characters. All the prompts should be realistic and cinematic";
  }

  let messages = [
    { role: "system", content: systemMessage }, // System message defines the AI's role
    { role: "user", content: prompt } // User's input
  ];

  if (type === "screenplay") {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Please convert this story to a screenplay: ${prompt}` }
    ];
  } else if (type === "imagePrompts") {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Please generate very short image prompts under 400 characters based on the following story: ${prompt}. 
              Ensure the prompts are realistic, cinematic, and describe characters in detail. Maintain consistency in each prompt. Do not include numbers or titles for the prompts, just send me the prompts. Generate a minimum of 5 prompts` }
    ];
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
