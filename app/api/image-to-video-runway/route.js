import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(request) {
  try {
    // Parse the request JSON
    const { prompt, imageUrl } = await request.json();

    // Initialize Supabase client
    const supabase = createClient();

    // Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "User not authenticated",
          error: userError?.message || "No user found",
        },
        { status: 403 }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Validate input parameters
    if (!prompt || !imageUrl) {
      return NextResponse.json(
        { message: "Prompt and image URL are required" },
        { status: 400 }
      );
    }

    // Initialize RunwayML client
    const client = new RunwayML({
      apiKey: process.env.RUNWAYML_API_SECRET,
    });

    // Define parameters for video generation
    const params = {
      model: "gen3a_turbo",
      promptImage: imageUrl,
      promptText: prompt,
      duration: 5,
      watermark: false, // Optional
      ratio: "16:9", // Optional
    };

    console.log("Request Parameters:", params);

    // Start video generation
    const imageToVideo = await client.imageToVideo
      .create(params)
      .catch((err) => {
        if (err instanceof RunwayML.APIError) {
          console.error("API Error:", err.name, err.status);
          return NextResponse.json(
            { message: "Error during video generation", error: err.name },
            { status: err.status }
          );
        } else {
          console.error("Unexpected Error:", err);
          throw err;
        }
      });

    const taskId = imageToVideo.id;

    // Poll for task completion
    const pollInterval = 5000;
    let taskStatus;
    let taskResponse;

    do {
      taskResponse = await client.tasks.retrieve(taskId);
      taskStatus = taskResponse.status;

      if (taskStatus === "THROTTLED") {
        console.log("Task is throttled. Retrying...");
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else if (taskStatus === "RUNNING") {
        console.log(
          `Task is running... Progress: ${taskResponse.progress * 100}%`
        );
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else if (taskStatus === "FAILED") {
        console.error(
          `Task failed: ${taskResponse.failure} (Code: ${taskResponse.failureCode})`
        );
        return NextResponse.json(
          {
            message: "Video generation failed",
            error: taskResponse.failure,
            code: taskResponse.failureCode,
          },
          { status: 500 }
        );
      }
    } while (taskStatus !== "SUCCEEDED");

    const videoUrl = taskResponse.output[0];

    // Step to upload video to Supabase bucket
    const videoFileName = `generated_video_${userId}_${Date.now()}.mp4`;
    const response = await fetch(videoUrl);
    const videoBlob = await response.blob();

    // Upload video to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(videoFileName, videoBlob, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          message: "Error uploading video to Supabase",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Fetch user video credits
    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("video_credits")
      .eq("id", userId)
      .single();

    if (userCreditsError || !userData) {
      return NextResponse.json(
        {
          message: "Error fetching user data",
          error: userCreditsError?.message || "No user data found",
        },
        { status: 500 }
      );
    }

    const userVideoCredits = userData.video_credits;
    const creditsUsed = 5;

    // Check for sufficient video credits
    if (userVideoCredits < creditsUsed) {
      return NextResponse.json(
        { message: "Not enough video credits" },
        { status: 403 }
      );
    }

    // Deduct video credits from user
    const { error: deductError } = await supabase
      .from("users")
      .update({ video_credits: userVideoCredits - creditsUsed })
      .eq("id", userId);

    if (deductError) {
      return NextResponse.json(
        { message: "Error updating video credits", error: deductError.message },
        { status: 500 }
      );
    }

    // Save generation record in the database
    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        type: "video",
        user_email: userEmail,
        parameters: { prompt, imageUrl },
        result_path: videoUrl, // You can store the new Supabase path if desired
        credits_used: creditsUsed,
      },
    ]);

    if (insertError) {
      return NextResponse.json(
        {
          message: "Error saving generation record",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    // Return the URL of the generated video
    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error("Error generating or fetching video:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
