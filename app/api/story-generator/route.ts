import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {

  const supabase = createClient();

  const { prompt, type } = await request.json();
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

  // Find the original entry based on type
  if (type === "screenplay") {
    systemMessage = "You are a screenwriter who converts stories into well-structured screenplays.";
    // For screenplay, search using the story content
    const { data: storyData, error: storyError } = await supabase
      .from("story_generations")
      .select("*")
      .eq("user_email", userEmail)
      .eq("story", prompt)
      .single();

    if (storyError) {
      console.error("Error finding original story:", storyError.message);
      return NextResponse.json(
        { message: "Original story not found", error: storyError.message },
        { status: 404 }
      );
    }
    
    searchPrompt = storyData.prompt;
  } else if (type === "imagePrompts") {
    systemMessage = "You are an expert in generating concise and realistic cinematic image prompts. Generate a minimum of 5 image prompts and limit each prompt to under 400 characters. All the prompts should be realistic and cinematic.";
    // For image prompts, search using the screenplay content
    const { data: screenplayData, error: screenplayError } = await supabase
      .from("story_generations")
      .select("*")
      .eq("user_email", userEmail)
      .eq("screenplay", prompt)
      .single();

    if (screenplayError) {
      console.error("Error finding original screenplay:", screenplayError.message);
      return NextResponse.json(
        { message: "Original screenplay not found", error: screenplayError.message },
        { status: 404 }
      );
    }
    
    searchPrompt = screenplayData.prompt;
  }

  let messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: prompt },
  ];

  if (type === "screenplay") {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Please convert this story to a screenplay: ${prompt}` },
    ];
  } else if (type === "imagePrompts") {
    messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Please generate very short image prompts under 400 characters based on the following screenplay: ${prompt}. 
              Ensure the prompts are realistic, cinematic, and describe characters in detail. Maintain consistency in each prompt. Do not include numbers or titles for the prompts, just send me the prompts. Generate a minimum of 5 prompts.` },
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

    // Find existing entry using the searchPrompt
    const { data: existingData, error: fetchError } = await supabase
      .from("story_generations")
      .select("*")
      .eq("user_email", userEmail)
      .eq("prompt", searchPrompt)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error("Error fetching existing entry:", fetchError.message);
      throw new Error("Failed to fetch existing story generation.");
    }

    if (existingData) {
      // Update existing entry
      const updateData: any = {};
      
      // Only update the relevant field based on type
      if (type === "story") {
        updateData.story = result;
      } else if (type === "screenplay") {
        updateData.screenplay = result;
      } else if (type === "imagePrompts") {
        updateData.image_prompts = result.split('\n').filter((line: string) => line.trim() !== '');
      }

      const { error: updateError } = await supabase
        .from("story_generations")
        .update(updateData)
        .eq("id", existingData.id);

      if (updateError) {
        console.error("Error updating database:", updateError.message);
        throw new Error("Failed to update generated content in database.");
      }
    } else if (type === "story") {
      // Only create new entry for initial story creation
      const { error: insertError } = await supabase
        .from("story_generations")
        .insert([{
          user_email: userEmail,
          prompt: prompt,
          story: result,
          screenplay: null,
          image_prompts: null,
        }]);

      if (insertError) {
        console.error("Error saving to database:", insertError.message);
        throw new Error("Failed to save generated content to database.");
      }
    } else {
      return NextResponse.json(
        { message: "Original entry not found" },
        { status: 404 }
      );
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