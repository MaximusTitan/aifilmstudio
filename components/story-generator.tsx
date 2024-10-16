"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function StoryGeneratorComponent() {
  type Story = {
    prompt: string;
    story: string;
    screenplay: string;
    imagePrompts: string[];
    generatedImages: string[];
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

  // Generate story
  const generateStory = async () => {
    if (!prompt) return alert("Please enter a story prompt!");

    setLoading(true);
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
      console.log("Generated Story Data:", data); // Debugging log

      const newStory = {
        ...currentStory,
        prompt,
        story: data.result,
      };

      setCurrentStory(newStory);
      setStories((prev) => [...prev, newStory]);
      setActiveTab("story");
    } catch (error) {
      console.error("Error generating story:", error);
      alert("An error occurred while generating the story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate screenplay
  const generateScreenplay = async () => {
    if (!currentStory.story) return;

    setLoading(true);
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
      console.log("Generated Screenplay Data:", data); // Debugging log

      setCurrentStory((prev) => ({
        ...prev,
        screenplay: data.result,
      }));
      setActiveTab("screenplay");
    } catch (error) {
      console.error("Error generating screenplay:", error);
      alert(
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
      console.log("Generated Image Prompts:", data); // Debugging log

      const imagePrompts = data.result
        .split("\n")
        .filter((prompt: string) => prompt.trim() !== "");

      setCurrentStory((prev) => ({
        ...prev,
        imagePrompts,
      }));
      setActiveTab("imagePrompts");
    } catch (error) {
      console.error("Error generating image prompts:", error);
      alert("An error occurred while generating image prompts.");
    } finally {
      setLoading(false);
    }
  };

  // Generate images using FAL API
  const generateImages = async () => {
    if (currentStory.imagePrompts.length === 0) return;

    setLoading(true);
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
      console.error("Error generating images:", error);
      alert("An error occurred while generating images.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Generator</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="screenplay">Screenplay</TabsTrigger>
          <TabsTrigger value="imagePrompts">Image Prompts</TabsTrigger>
          <TabsTrigger value="generatedImages">Generated Images</TabsTrigger>
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
                disabled={loading}
                className="w-full"
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
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {currentStory.story ? (
                  <pre className="whitespace-pre-wrap">
                    {currentStory.story}
                  </pre>
                ) : (
                  "Story not generated yet!"
                )}
              </ScrollArea>
              <Button
                onClick={generateScreenplay}
                disabled={!currentStory.story || loading}
                className="w-full"
              >
                {loading ? "Converting..." : "Convert to Screenplay"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Screenplay Tab */}
        <TabsContent value="screenplay">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {currentStory.screenplay ? (
                  <pre className="whitespace-pre-wrap">
                    {currentStory.screenplay}
                  </pre>
                ) : (
                  "Screenplay not generated yet!"
                )}
              </ScrollArea>
              <Button
                onClick={generateImagePrompts}
                disabled={!currentStory.screenplay || loading}
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
                  <p>No image prompts generated yet!</p>
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
                  <div className="grid grid-cols-2 gap-4">
                    {currentStory.generatedImages.map((url, index) => (
                      <div key={index} className="mb-2">
                        <h3 className="font-semibold text-sm mb-1">
                          Image {index + 1}
                        </h3>
                        <img
                          src={url}
                          alt={`Generated ${index + 1}`}
                          className="rounded-md w-full h-48 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No images generated yet!</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <h2 className="text-xl font-bold mt-8 mb-4">Your Past Stories</h2>
      {stories.length === 0 ? (
        <p className="text-gray-500">
          No stories created yet. Start by generating one!
        </p>
      ) : (
        <div className="space-y-4">
          {stories.map((story, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <h3 className="font-bold">{story.prompt}</h3>
                <p className="mt-2">
                  {story.story
                    ? story.story.substring(0, 100) + "..."
                    : "No story available"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
