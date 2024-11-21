"use client";
import React, { useState, useEffect } from "react"; // Add missing imports
import { createClient } from "@/utils/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios";
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
  id?: string; // Add storyId
  originalPrompt: string; // Existing field
  fullprompt: string; // Changed from `fullPrompt` to `fullprompt`
  story: string;
  imagePrompts: string[];
  generatedImages: { url: string; error?: string }[]; // Modify to include error
  generatedVideo: { url: string; error?: string }[]; // Remove optional modifier
  narrationAudio?: string;
  narrations: { script: string; audioUrl?: string; error?: string }[]; // Make narrations non-optional
  generatedAudio: string[]; // Ensure this prop exists
};

export function StoryGeneratorComponent() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story>({
    originalPrompt: "", // Existing field
    fullprompt: "", // Changed from `fullPrompt` to `fullprompt`
    story: "",
    imagePrompts: [],
    generatedImages: [],
    generatedVideo: [], // Initialize as empty array
    narrations: [], // Initialize narrations as an empty array
    generatedAudio: [], // Initialize generatedAudio as an empty array
  });

  // Remove storyId state
  // const [storyId, setStoryId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("prompt");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null); // Add state for merged video
  const [generatedVideoError, setGeneratedVideoError] = useState<string | null>(
    null
  ); // Add state for video error

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
                          Provide the story in a narrative format, ensuring the story and characters are cinematic and immersive. It should be 1100 characters.`;

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
    if (!currentStory.story) return handleError("No story available!");

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentStory.fullprompt,
          story: currentStory.story,
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
    if (currentStory.imagePrompts.length === 0)
      return handleError("No image prompts available!");

    setLoading(true);
    setError(null);
    setActiveTab("generatedImages"); // Open Generated Images tab
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

      const imageResults = await Promise.all(
        responses.map(async (response) => {
          if (!response.ok) {
            return { url: "", error: "Failed to generate image." };
          }
          const data = await response.json();
          return { url: data.imageUrl, error: undefined };
        })
      );

      setCurrentStory((prev) => ({
        ...prev,
        generatedImages: imageResults,
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
      currentStory.generatedImages.some((img) => img.error) ||
      !currentStory.imagePrompts.length
    ) {
      return handleError("No valid images available to generate video.");
    }

    setLoading(true);
    setError(null);
    setActiveTab("generatedVideo"); // Open Generated Video tab
    try {
      // Collect video generation promises
      const videoPromises = currentStory.imagePrompts.map(
        async (prompt, index) => {
          const image = currentStory.generatedImages[index];
          const imageUrl = image.url; // Get corresponding image URL
          if (!imageUrl) {
            throw new Error(
              `Image URL for prompt ${index + 1} is not available.`
            );
          }

          const payload = {
            prompt: prompt,
            imageUrl: imageUrl,
          };

          const response = await fetch("/api/image-to-video-runway", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const data = await response.json();
            return { url: data.videoUrl, error: undefined }; // Return video object
          } else {
            const errorData = await response.json();
            return { url: "", error: errorData.message } as {
              url: string;
              error: string;
            };
          }
        }
      );

      // Wait for all video generation promises to resolve
      const videoResults = await Promise.all(videoPromises);
      setCurrentStory((prev) => ({
        ...prev,
        generatedVideo: videoResults, // Save generated video URLs as an array of objects
      }));
      setActiveTab("generatedVideo");
    } catch (error) {
      handleError("Error generating the video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the generateAudio function to handle raw audio data and create Blob URLs
  const generateAudio = async (index: number) => {
    const narration = currentStory.narrations?.[index];

    if (!narration || !narration.script) {
      handleError("No narration script available to generate audio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: narration.script,
          story: currentStory.story,
        }), // Use story instead of storyId
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio.");
      }

      const data = await response.json();
      const audioUrl = data.audioUrl; // Use the audioUrl returned by the API

      if (!audioUrl) {
        throw new Error("No audio URL returned from the API.");
      }

      // Update the specific narration's audioUrl
      setCurrentStory((prev) => {
        if (!prev.narrations) return prev; // Ensure narrations exist
        const updatedNarrations = [...prev.narrations];
        updatedNarrations[index] = {
          ...updatedNarrations[index],
          audioUrl: audioUrl, // Set to the public URL
        };
        return {
          ...prev,
          narrations: updatedNarrations,
        };
      });
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

  // Define generateNarrations function
  const generateNarrations = async (story: string, prompts: string[]) => {
    if (!story || prompts.length === 0) {
      handleError(
        "Story and image prompts are required to generate narrations."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, prompts }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate narrations.");
      }

      const data = await response.json();
      const scripts: string[] = data.scripts;

      if (!Array.isArray(scripts) || scripts.length !== prompts.length) {
        throw new Error("Mismatch in number of narrations returned.");
      }

      const newNarrations = scripts.map((script) => ({ script, audioUrl: "" }));

      setCurrentStory((prev) => ({
        ...prev,
        narrations: newNarrations,
      }));

      setActiveTab("audio");
    } catch (error) {
      handleError(
        error instanceof Error
          ? error.message
          : "An error occurred while generating narrations."
      );
    } finally {
      setLoading(false);
    }
  };

  // Ensure generateNarrations handles setting narrations and navigating
  const generateNarrationsAndNavigate = async () => {
    await generateNarrations(currentStory.story, currentStory.imagePrompts);
    // Optionally, you can ensure navigation happens after narrations are set
    setActiveTab("audio");
  };

  // Modify handleExport to open Export Video tab and set loading
  const handleExport = () => {
    setActiveTab("exportVideo"); // Open Export Video tab
    // Ensure mergedVideoUrl is set properly from ExportVideoTab onMergeComplete
  };

  // Save generated content to the database
  const saveGeneratedContent = async (): Promise<void> => {
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audio",
          story: currentStory.story,
          generated_audio: currentStory.narrations.map((n) => n.audioUrl),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save generated content.");
      }

      // No need to handle storyId
    } catch (error) {
      handleError(
        error instanceof Error
          ? error.message
          : "An error occurred while saving generated content."
      );
      throw error; // Re-throw the error to be handled in generateAllAudio
    }
  };

  // Call saveGeneratedContent after generating audio
  const generateAllAudio = async () => {
    if (!currentStory.narrations || currentStory.narrations.length === 0) {
      handleError("No narrations available to convert.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveGeneratedContent(); // Save without storyId

      const updatedNarrations = await Promise.all(
        currentStory.narrations.map(async (narration, index) => {
          if (!narration.audioUrl) {
            try {
              await generateAudio(index); // Remove storyId parameter
              return { ...narration, error: undefined };
            } catch (err: any) {
              return { ...narration, audioUrl: undefined, error: err.message };
            }
          }
          return narration;
        })
      );

      setCurrentStory((prev) => ({
        ...prev,
        narrations: updatedNarrations,
      }));
      // No need to call saveGeneratedContent again here if not required
    } catch (error) {
      handleError(
        error instanceof Error
          ? error.message
          : "An error occurred while converting narrations to audio."
      );
    } finally {
      setLoading(false);
    }
  };

  // Retry image generation
  const retryGenerateImage = async (index: number) => {
    setLoading(true);
    setError(null);
    try {
      const prompt = currentStory.imagePrompts[index];
      const response = await fetch("/api/generate-image-fal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image_size: "landscape_16_9",
          num_inference_steps: 4,
          num_images: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate image.");
      }

      const data = await response.json();
      setCurrentStory((prev) => {
        const updatedImages = [...prev.generatedImages];
        updatedImages[index] = { url: data.imageUrl, error: undefined };
        return { ...prev, generatedImages: updatedImages };
      });
    } catch (error) {
      setCurrentStory((prev) => {
        const updatedImages = [...prev.generatedImages];
        updatedImages[index] = { url: "", error: "Failed to generate image." };
        return { ...prev, generatedImages: updatedImages };
      });
      setError("An error occurred while retrying image generation.");
    } finally {
      setLoading(false);
    }
  };

  // Retry video generation
  const retryGenerateVideo = async () => {
    await generateVideo();
  };

  // Define a handler that excludes storyId
  const handleGenerateAudio = (index: number) => {
    generateAudio(index);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Generator</h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="imagePrompts">Image Prompts</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>{" "}
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
            onGenerateImagePrompts={generateImagePrompts} // Pass generateImagePrompts
            narrationLines={currentStory.narrations.map((n) => n.script)} // Ensure narrations are always defined
            generatedAudio={currentStory.generatedAudio} // Use generatedAudio instead of generated_audio
          />
        </TabsContent>

        <TabsContent value="imagePrompts">
          <ImagePromptsTab
            imagePrompts={currentStory.imagePrompts}
            loading={loading}
            onGenerateImages={generateImages} // Pass the generateImages function
            onGenerateNarrations={generateNarrationsAndNavigate} // Updated prop
            onImagePromptsChange={(newPrompts) => {
              setCurrentStory((prev) => ({
                ...prev,
                imagePrompts: newPrompts,
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="audio">
          <AudioTab
            story={currentStory.story} // Pass story prop
            imagePrompts={currentStory.imagePrompts} // Pass imagePrompts prop
            narrations={currentStory.narrations} // Pass narrations prop
            loading={loading}
            onGenerateAudio={handleGenerateAudio} // Pass index and handle internally
            onGenerateNarrations={generateNarrationsAndNavigate} // Update to pass the correct function
            onGenerateImages={generateImages} // Pass generateImages function
            generatedAudio={currentStory.generatedAudio} // Add this prop
          />
        </TabsContent>

        <TabsContent value="generatedImages">
          <GeneratedImagesTab
            generatedImages={currentStory.generatedImages}
            loading={loading}
            onGenerateVideo={generateVideo}
            onRetryImage={retryGenerateImage} // Add prop
          />
        </TabsContent>

        <TabsContent value="generatedVideo">
          <GeneratedVideoTab
            generatedVideo={currentStory.generatedVideo} // Pass as array
            onExport={handleExport}
            onRetryVideo={retryGenerateVideo}
          />
        </TabsContent>

        <TabsContent value="exportVideo">
          <ExportVideoTab
            generatedVideo={currentStory.generatedVideo || []} // Pass full array
            narrationAudios={
              currentStory.narrations?.map((n) => n.audioUrl || "") || []
            } // Pass array of audioUrls
            onMergeComplete={(url: string) => {
              setMergedVideoUrl(url);
            }}
            onRetryVideo={retryGenerateVideo} // Add the onRetryVideo prop
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
