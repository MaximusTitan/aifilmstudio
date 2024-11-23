import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Ensure this import exists

export async function POST(request) {
  const { story, prompts } = await request.json();

  if (!story || !prompts || !Array.isArray(prompts)) {
    return NextResponse.json(
      { error: "Story and prompts are required" },
      { status: 400 }
    );
  }

  const supabase = createClient(); // Initialize Supabase client

  // Fetch story_length from settings
  const { data: settingsData, error: settingsError } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "story_length")
    .single();

  let storyLength = 12; // Default value
  if (!settingsError && settingsData) {
    const length = parseInt(settingsData.value, 10);
    if ([3, 6, 12].includes(length)) {
      storyLength = length;
    } else if (length > 0) {
      storyLength = length;
    }
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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `This is a request to create a simple, clear narration script that tells a story while matching the scenes shown in each image. The narration should focus on moving the story forward rather than describing what we can already see in the visuals. Think of the narration and visuals as partners - while the images show the scene, the narration shares the story's heart, the characters' feelings, or sets the mood. Generate exactly ${storyLength} narration lines and each one should not exceed 100-120 characters (approximately 5 seconds of speaking time at natural pace). Give just the narration lines without any titles or extra text. The entire script must be exactly 1100 characters long to keep the story tight and focused. Use everyday language that's easy to understand and speak naturally, as if telling a story to a friend. The narration should feel smooth and engaging, working together with the high-quality visuals to create a complete storytelling experience. Choose words that carry meaning and emotion while keeping the language simple and clear. The story should flow easily from one line to the next, making both good sense and staying within the required length.`,
          },
          {
            role: "user",
            content: `Story: ${story}\nPrompts:\n${prompts.join("\n")}`,
          },
        ],
        max_tokens: 1000 * storyLength, // Adjust tokens based on story length
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || "OpenAI API Error");
    }

    const data = await response.json();
    const scripts = data.choices[0].message.content
      .trim()
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, storyLength); // Ensure only the desired number of scripts

    // Fetch user to get email
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("User not authenticated.");
    }

    const userEmail = userData.user.email;

    // Save narration lines to the database
    const { error: updateError } = await supabase
      .from("story_generations")
      .update({
        narration_lines: scripts,
      })
      .eq("user_email", userEmail)
      .eq("story", story); // Use userEmail and story to identify the record

    if (updateError) {
      console.error("Error saving narration lines:", updateError.message);
      throw new Error("Failed to save narration lines.");
    }

    return NextResponse.json({ scripts }, { status: 200 });
  } catch (error) {
    console.error("Error generating narration scripts:", error);
    return NextResponse.json(
      { error: "Failed to generate narration scripts: " + error.message },
      { status: 500 }
    );
  }
}
