"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";

export function StoryGeneratorComponent() {
  type Story = {
    prompt: string;
    story: string;
    screenplay: string;
    imagePrompts: string[];
    generatedImages: string[];
    generatedVideo?: string;
  };

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

        {/* Prompt Tab */}
        <TabsContent value="prompt">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <Input
                placeholder="Enter your story prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={generateStory}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Story"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Story Tab */}
        <TabsContent value="story">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px]">
                {currentStory.story ? (
                  <pre className="whitespace-pre-wrap">
                    {currentStory.story}
                  </pre>
                ) : (
                  <p className="text-gray-500">Story not generated yet!</p>
                )}
              </ScrollArea>
              <Button
                onClick={generateScreenplay}
                disabled={loading || !currentStory.story}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate Screenplay"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screenplay Tab */}
        <TabsContent value="screenplay">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px]">
                {currentStory.screenplay ? (
                  <pre className="whitespace-pre-wrap">
                    {currentStory.screenplay}
                  </pre>
                ) : (
                  <p className="text-gray-500">Screenplay not generated yet!</p>
                )}
              </ScrollArea>
              <Button
                onClick={generateImagePrompts}
                disabled={loading || !currentStory.screenplay}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate Image Prompts"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Prompts Tab */}
        <TabsContent value="imagePrompts">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px]">
                {currentStory.imagePrompts.length > 0 ? (
                  currentStory.imagePrompts.map((prompt, index) => (
                    <div key={index} className="mb-4">
                      <h3 className="font-bold">Scene {index + 1}</h3>
                      <p className="w-full rounded-md border p-4">{prompt}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No image prompts generated yet!
                  </p>
                )}
              </ScrollArea>
              <Button
                onClick={generateImages}
                disabled={loading || currentStory.imagePrompts.length === 0}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate Images"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generated Images Tab */}
        <TabsContent value="generatedImages">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px]">
                {currentStory.generatedImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentStory.generatedImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="rounded-md overflow-hidden shadow-lg"
                      >
                        <img
                          src={imageUrl}
                          alt={`Generated Image ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No images generated yet!</p>
                )}
              </ScrollArea>
              <Button
                onClick={generateVideo}
                disabled={loading || currentStory.generatedImages.length === 0}
                className="w-full"
              >
                {loading ? "Generating..." : "Generate Video"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generated Video Tab */}
        <TabsContent value="generatedVideo">
          <Card>
            <CardContent className="space-y-4 pt-4">
              {currentStory.generatedVideo &&
              currentStory.generatedVideo.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {" "}
                  {/* Use grid with 2 columns */}
                  {currentStory.generatedVideo
                    .split(", ")
                    .map((videoUrl, index) => (
                      <video
                        key={index}
                        controls
                        src={videoUrl}
                        className="w-full h-48 rounded-md"
                      />
                    ))}
                </div>
              ) : (
                <p className="text-gray-500">No video generated yet!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
