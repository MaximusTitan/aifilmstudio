import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();

  const { prompt, type, story } = await request.json();
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

  const userEmail = user.email;

  if (!prompt) {
    console.warn("No prompt provided.");
    return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
  }

  let model = "gpt-4o";
  let systemMessage = "You are a creative assistant skilled in generating content.";
  let searchPrompt = prompt;
  let messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ];

  if (type === "imagePrompts") {
    systemMessage = `You are a master cinematographer and storyboard artist who excels at visual storytelling. For each image prompt, maintain meticulous character consistency by specifying key identifying features that remain constant throughout the sequence: their physical attributes (age, height, build, facial features, hair style/color), distinct clothing elements or accessories, and characteristic expressions or mannerisms. Track any changes to the character's appearance (like dirt, injuries, or outfit modifications) and carry these changes forward in subsequent scenes. Consider these character details alongside consistent lighting conditions, color palettes, and environmental details throughout the sequence. Each prompt should provide a clear connection to the previous scene's established elements while naturally progressing the visual narrative, as if crafting scenes for a high-end film production. Focus on photorealistic quality, precise camera angles, and emotional resonance while keeping descriptions under 400 characters. Treat the character as if casting a specific actor, maintaining their unique presence and ensuring they remain instantly recognizable from every angle and in every situation. Generate exactly ${storyLength} image prompts.`;
    
    if (!story) {
      console.error("No story provided for image prompts");
      return NextResponse.json(
        { 
          message: "No story provided for image prompts", 
          debug: { userEmail, prompt } 
        },
        { status: 400 }
      );
    }
    
    searchPrompt = story;
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Create a sequence of cinematic image prompts for this story: ${searchPrompt}. Each prompt must be under 400 characters and capture the scene in photorealistic detail. Include camera angles, lighting, character details, and environment specifications. Maintain strict visual consistency between prompts, especially in character appearances and lighting conditions. Generate exactly ${storyLength} prompts that flow like consecutive movie scenes. Provide only the prompts, without numbers or titles.` },
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
    const result = data.choices?.[0]?.message?.content?.trim();
    
    if (!result) {
      console.error("No valid response from OpenAI.");
      throw new Error("Response failed. No valid response from OpenAI.");
    }

    if (type === "story") {
      // Create new entry for story
      const { error: insertError } = await supabase
        .from("story_generations")
        .insert([{
          user_email: userEmail,
          prompt: prompt,
          story: result,
          image_prompts: [],
          fullprompt: prompt,
          generated_audio: [], // Initialize generated_audio
        }]);

      if (insertError) {
        console.error("Error saving to database:", insertError.message);
        throw new Error("Failed to save generated content to database.");
      }
    } else if (type === "imagePrompts") {
      // For image prompts, find and update the existing story
      const { data: existingStory, error: fetchError } = await supabase
        .from("story_generations")
        .select("*")
        .eq("user_email", userEmail)
        .eq("story", story)  // Match by the actual story content
        .single();

      if (fetchError) {
        console.error("Error fetching story:", fetchError.message);
        throw new Error("Failed to find existing story.");
      }

      if (!existingStory) {
        return NextResponse.json(
          { message: "Original story not found", debug: { userEmail, story: story.substring(0, 100) + "..." } },
          { status: 404 }
        );
      }

      // Update with image prompts
      const { error: updateError } = await supabase
        .from("story_generations")
        .update({
          image_prompts: result.split('\n').filter((line: string) => line.trim() !== '')
        })
        .eq("id", existingStory.id);

      if (updateError) {
        console.error("Error updating image prompts:", updateError.message);
        throw new Error("Failed to update image prompts.");
      }
    } else if (type === "narration" || type === "audio") {
      // Fetch the existing story to update
      const { data: existingStory, error: fetchError } = await supabase
        .from("story_generations")
        .select("*")
        .eq("user_email", userEmail)
        .eq("story", story) // Match by the actual story content
        .single();

      if (fetchError || !existingStory) {
        console.error(`Error fetching story for type ${type}:`, fetchError?.message);
        throw new Error(`Failed to find existing story for type ${type}.`);
      }

      if (type === "narration") {
        // Save narration lines to the database
        const narrationLines = result.split('\n').filter((line: string) => line.trim() !== '');
        const { error: updateError } = await supabase
          .from("story_generations")
          .update({
            narrations: narrationLines.map((script: string) => ({ script, audioUrl: null, error: null })),
          })
          .eq("id", existingStory.id);

        if (updateError) {
          console.error("Error updating narration lines:", updateError.message);
          throw new Error("Failed to update narration lines.");
        }
      } else if (type === "audio") {
        // Save generated audio URLs to the database
        const { error: updateError } = await supabase
          .from("story_generations")
          .update({
            generated_audio: result, // Rename to generated_audio
          })
          .eq("user_email", userEmail)
          .eq("story", story); // Use userEmail and story to identify the record

        if (updateError) {
          console.error("Error updating generated audio:", updateError.message);
          throw new Error("Failed to update generated audio.");
        }

        // No longer return the story ID
        return NextResponse.json(
          { message: "Audio generated and saved successfully." },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error("An error occurred:", errorMessage);
    return NextResponse.json(
      { message: "Error generating content", error: errorMessage },
      { status: 500 }
    );
  }
}
