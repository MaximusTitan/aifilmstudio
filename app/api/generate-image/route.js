import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@/utils/supabase/server";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN, // Ensure this is set in your environment variables
});

export async function POST(request) {
  try {
    const { prompt, aspect_ratio } = await request.json();

    // Get Supabase client
    const supabase = createClient();

    // Retrieve the authenticated user
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

    const userId = user.id; // Fetch the user's UUID
    console.log("Authenticated user ID:", userId); // Debugging output

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    // Call the Replicate API to generate the image
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

    // Deduct credits and insert into the generations table
    const creditsUsed = 1; // Adjust this value based on your business logic

    // Fetch user's credits (remove .single() to avoid the error)
    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .limit(1); // Use limit(1) to get the first matching row

    console.log("Querying credits for user ID:", userId); // Debugging output
    console.log("User credits query result:", userData); // Debugging output

    if (userCreditsError || !userData || userData.length === 0) {
      return NextResponse.json(
        {
          message: "Error fetching user data",
          error: userCreditsError
            ? userCreditsError.message
            : "No user data found",
        },
        { status: 500 }
      );
    }

    const userCredits = userData[0].credits;
    console.log("User credits found:", userCredits); // Debugging output

    // Check if the user has enough credits
    if (userCredits < creditsUsed) {
      return NextResponse.json(
        { message: "Not enough credits" },
        { status: 403 }
      );
    }

    // Deduct credits from the user's account
    const { error: deductError } = await supabase
      .from("users")
      .update({ credits: userCredits - creditsUsed })
      .eq("id", userId);

    if (deductError) {
      console.error(deductError.message);
      return NextResponse.json(
        { message: "Error updating credits", error: deductError.message },
        { status: 500 }
      );
    }

    // Insert generation record into the 'generations' table
    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId, // Use the UUID
        type: "image",
        parameters: { prompt, aspect_ratio }, // Store the parameters as JSON
        result_url: imageUrl,
        credits_used: creditsUsed,
      },
    ]);

    if (insertError) {
      console.error(insertError.message);
      return NextResponse.json(
        {
          message: "Error saving generation record",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return the generated image URL as a response
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error generating or fetching image:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
