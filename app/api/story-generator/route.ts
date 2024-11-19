import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();

  const { prompt, type, story } = await request.json();
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
    systemMessage = "You are an expert in generating concise and realistic cinematic image prompts. Generate a minimum of 12 image prompts and limit each prompt to under 400 characters. All the prompts should be realistic and cinematic.";
    
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
      { role: "user", content: `Please generate very short image prompts under 400 characters based on the following story: ${searchPrompt}. 
Ensure the prompts are realistic, cinematic, and describe characters in detail. Maintain consistency in each prompt. Do not include numbers or titles for the prompts, just send me the prompts. Generate a minimum of 12 prompts.` },
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
