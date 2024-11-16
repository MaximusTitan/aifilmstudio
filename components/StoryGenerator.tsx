"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { createClient } from "@/utils/supabase/client";
import { PromptTab } from "./PromptTab";
import { StoryTab } from "./StoryTab";
import { ImagePromptsTab } from "./ImagePromptsTab";
import { GeneratedImagesTab } from "./GeneratedImagesTab";
import { GeneratedVideoTab } from "./GeneratedVideoTab";
import { ExportVideoTab } from "./ExportVideoTab";
import { AudioTab } from "./AudioTab"; // Add this import

// Initialize Supabase client
const supabase = createClient();

type Story = {
  originalPrompt: string; // Existing field
  fullprompt: string; // Changed from `fullPrompt` to `fullprompt`
  story: string;
  imagePrompts: string[];
  generatedImages: string[];
  generatedVideo?: string;
  narrationAudio?: string;
};

export function StoryGeneratorComponent() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story>({
    originalPrompt: "", // Existing field
    fullprompt: "", // Changed from `fullPrompt` to `fullprompt`
    story: "",
    imagePrompts: [],
    generatedImages: [],
  });
  const [activeTab, setActiveTab] = useState("prompt");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null); // Add state for merged video

  // Fetch authenticated user's email on component mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error fetching user:", error.message);
        setError("Failed to fetch user information.");
      }
    };

    fetchUserEmail();
  }, []);

  const handleError = (message: string) => {
    setError(message);
    setLoading(false);
  };

  // Generate story
  const generateStory = async () => {
    if (!prompt) return handleError("Please enter a story prompt!");

    setLoading(true);
    setError(null); // Reset error state
    try {
      const fullPrompt = `Write a small and captivating story based on the following idea: ${prompt}. 
                          Provide the story in a narrative format, ensuring the story and characters are cinematic and immersive. It should be 550 characters.`;

      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: "story", // Ensure type is correctly set
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate story: ${response.statusText}`);
      }

      const data = await response.json();

      const newStory = {
        ...currentStory,
        originalPrompt: prompt, // Set originalPrompt
        fullprompt: fullPrompt, // Changed from `fullPrompt` to `fullprompt`
        story: data.result,
      };

      setCurrentStory(newStory);
      setStories((prev) => [...prev, newStory]);
      setActiveTab("story");
    } catch (error) {
      handleError(
        "An error occurred while generating the story. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate image prompts
  const generateImagePrompts = async () => {
    if (!currentStory.story) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt, // Use the original prompt
          story: currentStory.story, // Pass the current story
          type: "imagePrompts",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image prompts.");
      }

      const data = await response.json();
      // Convert the string response into an array by splitting on newlines
      const imagePrompts = data.result
        .split("\n")
        .filter((line: string) => line.trim() !== "");

      setCurrentStory((prev) => ({
        ...prev,
        imagePrompts,
      }));
      setActiveTab("imagePrompts");
    } catch (error) {
      handleError("An error occurred while generating image prompts.");
    } finally {
      setLoading(false);
    }
  };

  // Generate images using FAL API
  const generateImages = async () => {
    if (currentStory.imagePrompts.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        currentStory.imagePrompts.map((prompt) =>
          fetch("/api/generate-image-fal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              image_size: "landscape_16_9",
              num_inference_steps: 4,
              num_images: 1,
            }),
          })
        )
      );

      const imageUrls = await Promise.all(
        responses.map(async (response) => {
          const data = await response.json();
          return data.imageUrl;
        })
      );

      setCurrentStory((prev) => ({
        ...prev,
        generatedImages: imageUrls,
      }));
      setActiveTab("generatedImages");
    } catch (error) {
      handleError("An error occurred while generating images.");
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (
      !currentStory.generatedImages.length ||
      !currentStory.imagePrompts.length
    ) {
      return handleError("No images or prompts available.");
    }

    setLoading(true);
    setError(null);

    try {
      // Collect video generation promises
      const videoPromises = currentStory.imagePrompts.map(
        async (prompt, index) => {
          const imageUrl = currentStory.generatedImages[index]; // Get corresponding image for each prompt
          if (!imageUrl) {
            throw new Error(
              `Image URL for prompt ${index + 1} is not available.`
            );
          }

          const payload = {
            prompt: prompt,
            imageUrl: imageUrl,
          };

          const response = await axios.post(
            "/api/image-to-video-runway",
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.status === 200) {
            return response.data.videoUrl; // Collect video URL
          } else {
            throw new Error(`Error: ${response.data.message}`);
          }
        }
      );

      // Wait for all video generation promises to resolve
      const videoUrls = await Promise.all(videoPromises);
      setCurrentStory((prev) => ({
        ...prev,
        generatedVideo: videoUrls.join(", "), // Save all generated video URLs as a single string
      }));
      setActiveTab("generatedVideo");
    } catch (error) {
      handleError("Error generating the video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add generateAudio function with error handling
  const generateAudio = async () => {
    if (!currentStory.story)
      return handleError("No story available to generate audio.");

    setLoading(true);
    setError(null);
    try {
      // Generate narration script using ChatGPT
      const response = await fetch("/api/generate-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: currentStory.story,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate narration script."
        );
      }

      const data = await response.json();
      const narrationScript = data.script;

      // Send script to generate-audio API
      const audioResponse = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narrationScript }),
      });

      if (!audioResponse.ok) {
        const errorData = await audioResponse.json();
        throw new Error(errorData.error || "Failed to generate audio.");
      }

      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setCurrentStory((prev) => ({
        ...prev,
        narrationAudio: audioUrl,
      }));
      setActiveTab("audio");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error.message
          : "An error occurred while generating audio. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Generator</h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="imagePrompts">Image Prompts</TabsTrigger>
          <TabsTrigger value="generatedImages">Generated Images</TabsTrigger>
          <TabsTrigger value="generatedVideo">Generated Video</TabsTrigger>
          <TabsTrigger value="exportVideo">Export Video</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <PromptTab
            prompt={prompt}
            loading={loading}
            onPromptChange={setPrompt}
            onGenerate={generateStory}
          />
        </TabsContent>

        <TabsContent value="story">
          <StoryTab
            story={currentStory.story}
            loading={loading}
            onStoryChange={(newStory) => {
              setCurrentStory((prev) => ({
                ...prev,
                story: newStory,
              }));
            }}
            onGenerateAudio={generateAudio} // Pass generateAudio instead
          />
        </TabsContent>

        <TabsContent value="imagePrompts">
          <ImagePromptsTab
            imagePrompts={currentStory.imagePrompts}
            loading={loading}
            onGenerateImages={generateImages}
            onImagePromptsChange={(newPrompts) => {
              setCurrentStory((prev) => ({
                ...prev,
                imagePrompts: newPrompts,
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="generatedImages">
          <GeneratedImagesTab
            generatedImages={currentStory.generatedImages}
            loading={loading}
            onGenerateVideo={generateVideo}
          />
        </TabsContent>

        <TabsContent value="generatedVideo">
          <GeneratedVideoTab
            generatedVideo={currentStory.generatedVideo}
            mergedVideoUrl={mergedVideoUrl || undefined} // Pass mergedVideoUrl
            onExport={() => setActiveTab("exportVideo")}
          />
        </TabsContent>

        <TabsContent value="audio">
          <AudioTab
            narrationAudio={currentStory.narrationAudio}
            loading={loading}
            onGenerateAudio={generateAudio}
            onGoToImagePrompts={generateImagePrompts} // Pass generateImagePrompts
          />
        </TabsContent>

        <TabsContent value="exportVideo">
          <ExportVideoTab
            videoUrls={currentStory.generatedVideo?.split(", ") || []}
            narrationAudio={currentStory.narrationAudio} // Ensure it's passed
            onMergeComplete={(url: string) => {
              setMergedVideoUrl(url); // Update merged video URL
              setActiveTab("exportVideo"); // Switch to Export Video tab
            }}
          />
        </TabsContent>
      </Tabs>
      <div className="mt-4 mb-4 p-4 bg-yellow-100/25 border-l-4 border-yellow-200 text-yellow-700">
        <p className="font-semibold">Important Note:</p>
        <p>
          You have limited credits for generating content. Please review each
          step carefully before proceeding to ensure optimal use of resources.
        </p>
      </div>
    </div>
  );
}
