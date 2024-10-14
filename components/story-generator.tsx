"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export function StoryGeneratorComponent() {
  type Story = {
    prompt: string;
    story: string;
    screenplay: string;
    imagePrompts: string[];
  };

  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story>({
    prompt: "",
    story: "",
    screenplay: "",
    imagePrompts: [],
  });
  const [activeTab, setActiveTab] = useState("prompt");
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const generateStory = async () => {
    if (!prompt) return alert("Please enter a story prompt!");

    setLoading(true);
    try {
      const fullPrompt = `Write a captivating story based on the following idea: ${prompt}`;
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, type: "story" }),
      });

      const data = await response.json();
      const newStory = data.result;

      const story = { ...currentStory, prompt, story: newStory };
      setCurrentStory(story);
      setStories([...stories, story]);
      setActiveTab("story");
    } catch (error) {
      console.error("Error generating story:", error);
      alert("An error occurred while generating the story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      const screenplay = data.result;

      setCurrentStory({ ...currentStory, screenplay });
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

  const generateImagePrompts = async () => {
    if (!currentStory.story) return;

    setLoading(true);
    try {
      const response = await fetch("/api/story-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentStory.story,
          type: "imagePrompts",
        }),
      });

      const data = await response.json();
      const imagePrompts = data.result
        .split("\n")
        .filter((prompt: string) => prompt.trim() !== "");

      setCurrentStory({ ...currentStory, imagePrompts });
      setActiveTab("imagePrompts");
    } catch (error) {
      console.error("Error generating image prompts:", error);
      alert(
        "An error occurred while generating image prompts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Story Generator</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="screenplay">Screenplay</TabsTrigger>
          <TabsTrigger value="imagePrompts">Image Prompts</TabsTrigger>
        </TabsList>

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

        <TabsContent value="story">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <p>{currentStory.story}</p>
              </ScrollArea>
              <Button
                onClick={generateScreenplay}
                disabled={!currentStory.story || loading}
                className="w-full"
              >
                Convert to Screenplay
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screenplay">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <pre className="font-courier whitespace-pre-wrap">
                  {currentStory.screenplay}
                </pre>
              </ScrollArea>
              <Button
                onClick={generateImagePrompts}
                disabled={!currentStory.screenplay || loading}
                className="w-full"
              >
                Generate Image Prompts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imagePrompts">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {currentStory.imagePrompts.map((prompt, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-bold">Scene {index + 1}</h3>
                    <p>{prompt}</p>
                  </div>
                ))}
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
