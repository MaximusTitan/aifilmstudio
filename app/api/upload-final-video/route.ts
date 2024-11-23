import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Adjust the limit as needed
    },
  },
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const videoFile = formData.get("video") as File;
  const story = formData.get("story") as string;
  const prompt = formData.get("prompt") as string;

  if (!videoFile || !story || !prompt) {
    return NextResponse.json(
      { error: "Video file, story, and prompt are required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `final_video_${timestamp}.mp4`;

    // Upload the video file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("generated-videos")
      .upload(filename, videoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "video/mp4",
      });

    if (uploadError) {
      console.error("Error uploading video to storage:", uploadError.message);
      throw new Error("Failed to upload video to storage.");
    }

    // Get the public URL of the uploaded video
    const { data } = supabase.storage
      .from("generated-videos")
      .getPublicUrl(filename);

    if (!data.publicUrl) {
      console.error("Error retrieving public URL: publicUrl is undefined");
      throw new Error("Failed to retrieve public URL for video.");
    }

    const publicURL = data.publicUrl;

    // Fetch user to get email
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new Error("User not authenticated.");
    }

    const userEmail = userData.user.email;

    // Prepare the upsert data (only final_video_url)
    const upsertData = {
      user_email: userEmail,
      story: story,
      prompt: prompt || "",
      final_video_url: publicURL, // Only updating this field
    };

    // Attempt to insert or update the row
    const { data: insertData, error: insertError } = await supabase
      .from("story_generations")
      .upsert(upsertData, {
        onConflict: "user_email,story", // Define the uniqueness
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error upserting story generation:", insertError.message);
      throw new Error("Failed to save story generation.");
    }

    console.log("Updated final_video_url:", insertData);

    // Return the video URL
    return NextResponse.json({ videoUrl: publicURL }, { status: 200 });
  } catch (error) {
    console.error("Error uploading final video:", error);
    return NextResponse.json(
      {
        error:
          "Failed to upload final video: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
