import { NextResponse } from "next/server";

export async function POST(request) {
  const { story } = await request.json();

  if (!story) {
    return NextResponse.json({ error: "Story is required" }, { status: 400 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY; // Ensure your OpenAI API key is set
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Generate a very short narration script which can be told in around 30 seconds based on the following story.",
          },
          {
            role: "user",
            content: story,
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "OpenAI API Error");
    }

    const data = await response.json();
    const script = data.choices[0].message.content.trim();

    return NextResponse.json({ script }, { status: 200 });
  } catch (error) {
    console.error("Error generating narration script:", error);
    return NextResponse.json(
      { error: "Failed to generate narration script: " + error.message },
      { status: 500 }
    );
  }
}
