import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { createClient } from "@/utils/supabase/server";

export async function POST(request) {
  try {
    const { prompt, imageUrl } = await request.json();

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "User authentication failed:",
        userError?.message || "No user found"
      );
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

    if (!prompt || !imageUrl) {
      console.error("Validation error: Prompt and image URL are required.");
      return NextResponse.json(
        { message: "Prompt and image URL are required" },
        { status: 400 }
      );
    }

    const client = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

    const params = {
      model: "gen3a_turbo",
      promptImage: imageUrl,
      promptText: prompt,
      duration: 5,
      watermark: false,
      ratio: "16:9",
    };

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

    const pollInterval = 5000;
    let taskStatus, taskResponse;

    do {
      taskResponse = await client.tasks.retrieve(taskId);
      taskStatus = taskResponse.status;

      if (taskStatus === "THROTTLED") {
        console.log("Task is throttled. Retrying in 5 seconds...");
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

    const response = await fetch(videoUrl);
    const videoBlob = await response.blob();

    const videoFileName = `generated_video_${userId}_${Date.now()}.mp4`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(videoFileName, videoBlob, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      console.error("Error uploading video to Supabase:", uploadError.message);
      return NextResponse.json(
        {
          message: "Error uploading video to Supabase",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const publicUrl = supabase.storage
      .from("generated-videos")
      .getPublicUrl(videoFileName).data.publicUrl;

    const { data: userData, error: userCreditsError } = await supabase
      .from("users")
      .select("video_credits")
      .eq("id", userId)
      .single();

    if (userCreditsError || !userData) {
      console.error(
        "Error fetching user data:",
        userCreditsError?.message || "No user data found"
      );
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

    if (userVideoCredits < creditsUsed) {
      console.warn("Not enough video credits.");
      return NextResponse.json(
        { message: "Not enough video credits" },
        { status: 403 }
      );
    }

    const { error: deductError } = await supabase
      .from("users")
      .update({ video_credits: userVideoCredits - creditsUsed })
      .eq("id", userId);

    if (deductError) {
      console.error("Error updating video credits:", deductError.message);
      return NextResponse.json(
        { message: "Error updating video credits", error: deductError.message },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("generations").insert([
      {
        user_id: userId,
        type: "video",
        user_email: userEmail,
        parameters: { prompt, imageUrl },
        result_path: publicUrl, // Save Supabase path
        credits_used: creditsUsed,
      },
    ]);

    if (insertError) {
      console.error("Error saving generation record:", insertError.message);
      return NextResponse.json(
        {
          message: "Error saving generation record",
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ videoUrl: publicUrl });
  } catch (error) {
    console.error("Error generating or fetching video:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
