import { NextResponse } from "next/server";

export async function POST(request) {
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  try {
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceId = "9BWtsMINqrJLrRacOk9x";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "ElevenLabs API Error");
    }

    const audioBuffer = await response.arrayBuffer();

    // Return raw audio buffer directly
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: "Failed to generate audio: " + error.message },
      { status: 500 }
    );
  }
}
