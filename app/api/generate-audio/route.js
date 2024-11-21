import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Ensure this import exists

export async function POST(request) {
  const { text, story } = await request.json(); // Replace storyId with story

  if (!text || !story) {
    return NextResponse.json(
      { error: "Text and story are required" },
      { status: 400 }
    );
  }

  const supabase = createClient(); // Initialize Supabase client

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

    const audioBlob = await response.blob(); // Receive raw audio as Blob

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `audio_${timestamp}.mp3`;

    // Upload the audio blob to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-audio")
      .upload(filename, audioBlob, {
        cacheControl: "3600",
        upsert: false,
        contentType: "audio/mpeg",
      });

    if (uploadError) {
      console.error("Error uploading audio to storage:", uploadError.message);
      throw new Error("Failed to upload audio to storage.");
    }

    // Get the public URL of the uploaded audio
    const { data, error: urlError } = supabase.storage
      .from("generated-audio")
      .getPublicUrl(filename); // Correct method to retrieve public URL

    if (urlError || !data.publicUrl) {
      // Check for errors and ensure publicUrl exists
      console.error(
        "Error getting public URL:",
        urlError ? urlError.message : "publicUrl is undefined"
      );
      throw new Error("Failed to retrieve public URL for audio.");
    }

    const publicURL = data.publicUrl; // Correctly assign publicUrl to publicURL variable

    console.log("Public URL obtained:", publicURL); // Debug log

    // Fetch user to get email
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("User not authenticated.");
    }

    const userEmail = userData.user.email;

    // Fetch current generated_audio
    const { data: currentData, error: fetchError } = await supabase
      .from("story_generations")
      .select("generated_audio")
      .eq("user_email", userEmail)
      .eq("story", story)
      .single();

    if (fetchError) {
      console.error(
        "Error fetching current generated_audio:",
        fetchError.message
      );
      throw new Error("Failed to fetch current generated_audio.");
    }

    // Filter out nulls before appending
    const existingAudio = currentData.generated_audio
      ? currentData.generated_audio.filter((url) => url !== null)
      : [];

    const updatedAudio = [...existingAudio, publicURL];

    console.log("Updated generated_audio:", updatedAudio); // Debug log

    const { error: updateError } = await supabase
      .from("story_generations")
      .update({
        generated_audio: updatedAudio,
      })
      .eq("user_email", userEmail)
      .eq("story", story); // Use userEmail and story to identify the record

    if (updateError) {
      console.error("Error saving generated audio:", updateError.message);
      throw new Error("Failed to save generated audio.");
    }

    // Return the audio URL
    return NextResponse.json({ audioUrl: publicURL }, { status: 200 });
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate audio: " +
          (error instanceof Error ? error.message : error),
      },
      { status: 500 }
    );
  }
}
