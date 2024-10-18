"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { PromptTab } from "./PromptTab";
import { StoryTab } from "./StoryTab";
import { ScreenplayTab } from "./ScreenplayTab";
import { ImagePromptsTab } from "./ImagePromptsTab";
import { GeneratedImagesTab } from "./GeneratedImagesTab";
import { GeneratedVideoTab } from "./GeneratedVideoTab";

type Story = {
  prompt: string;
  story: string;
  screenplay: string;
  imagePrompts: string[];
  generatedImages: string[];
  generatedVideo?: string;
};

export function StoryGeneratorComponent() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story>({
    prompt: "",
    story: "",
    screenplay: "",
    imagePrompts: [],
    generatedImages: [],
  });
  const [activeTab, setActiveTab] = useState("prompt");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      const fullPrompt = `Write a captivating story based on the following idea: ${prompt}. 
                          Provide the story in a narrative format, ensuring the story and characters are cinematic and immersive.`;

      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          type: "story",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate story: ${response.statusText}`);
      }

      const data = await response.json();

      const newStory = {
        ...currentStory,
        prompt,
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

  // Generate screenplay
  const generateScreenplay = async () => {
    if (!currentStory.story) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentStory.story,
          type: "screenplay",
        }),
      });

      const data = await response.json();

      setCurrentStory((prev) => ({
        ...prev,
        screenplay: data.result,
      }));
      setActiveTab("screenplay");
    } catch (error) {
      handleError(
        "An error occurred while generating the screenplay. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate image prompts
  const generateImagePrompts = async () => {
    if (!currentStory.screenplay) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentStory.screenplay,
          type: "imagePrompts",
        }),
      });

      const data = await response.json();

      const imagePrompts = data.result
        .split("\n")
        .filter((prompt: string) => prompt.trim() !== "");

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Generator</h1>

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="screenplay">Screenplay</TabsTrigger>
          <TabsTrigger value="imagePrompts">Image Prompts</TabsTrigger>
          <TabsTrigger value="generatedImages">Generated Images</TabsTrigger>
          <TabsTrigger value="generatedVideo">Generated Video</TabsTrigger>
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
            onGenerateScreenplay={generateScreenplay}
          />
        </TabsContent>

        <TabsContent value="screenplay">
          <ScreenplayTab
            screenplay={currentStory.screenplay}
            loading={loading}
            onGenerateImagePrompts={generateImagePrompts}
          />
        </TabsContent>

        <TabsContent value="imagePrompts">
          <ImagePromptsTab
            imagePrompts={currentStory.imagePrompts}
            loading={loading}
            onGenerateImages={generateImages}
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
          <GeneratedVideoTab generatedVideo={currentStory.generatedVideo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
