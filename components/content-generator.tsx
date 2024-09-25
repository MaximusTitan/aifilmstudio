"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Image, Loader2, Video } from "lucide-react";
import axios from "axios";

type Generation = {
  id: string;
  type: "image" | "video";
  url: string;
  prompt: string;
  created_at: string;
};

export default function ContentGenerator() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(null);

  // Fetch user's past generations
  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const response = await axios.get("/api/get-generations"); // Fetch generations from your API
        const fetchedGenerations = response.data.generations.map((gen: any) => ({
          id: gen.id,
          type: gen.type,
          url: gen.result_url,  // Use result_url for displaying the generated image/video
          prompt: gen.parameters.prompt, // Access the prompt from parameters
          created_at: gen.created_at,
        }));
        setGenerations(fetchedGenerations); // Update state with mapped generations
      } catch (err) {
        console.error("Failed to load past generations", err);
      }
    };

    fetchGenerations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = activeTab === "image" ? "/api/generate-image" : "/api/generate-video";
      const response = await axios.post(endpoint, {
        prompt,
        aspect_ratio: aspectRatio,
      });

      if (response.status !== 200) {
        throw new Error("Failed to generate content");
      }

      const newGeneration: Generation = {
        id: Date.now().toString(),
        type: activeTab,
        url: activeTab === "image" ? response.data.imageUrl : response.data.videoUrl,
        prompt: prompt,
        created_at: new Date().toISOString(),
      };

      setGenerations((prev) => [newGeneration, ...prev]);
      setLatestGeneration(newGeneration);
    } catch (err) {
      console.error(err);
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center">AI Content Generator</h1>
      <div className="flex gap-8">
        <div className="flex-1">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "image" | "video")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image">
                <Image className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="mr-2 h-4 w-4" />
                Video
              </TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Generate stunning images with AI
              </p>
            </TabsContent>
            <TabsContent value="video" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Create amazing videos using AI technology
              </p>
            </TabsContent>
          </Tabs>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the image or video you want to generate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger id="aspect-ratio">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="3:4">3:4 (Vertical)</SelectItem>
                  <SelectItem value="21:9">21:9 (Ultra-Widescreen)</SelectItem>
                  <SelectItem value="9:21">9:21 (Ultra-Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate {activeTab === "image" ? "Image" : "Video"}
            </Button>
          </form>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
        {latestGeneration && (
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-4">Latest Generation</h2>
            {latestGeneration.type === "image" ? (
              <img
                src={latestGeneration.url}
                alt="Generated content"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <video
                src={latestGeneration.url}
                controls
                className="w-full h-auto rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Prompt: {latestGeneration.prompt}
            </p>
          </div>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Generations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generations.map((gen) => (
            <div key={gen.id} className="border rounded-lg p-4">
              {gen.type === "image" ? (
                <img
                  src={gen.url}
                  alt="Generated content"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <video
                  src={gen.url}
                  controls
                  className="w-full h-auto rounded-lg shadow-lg"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Prompt: {gen.prompt}
              </p>
              <p className="text-xs text-gray-500">
                Created At: {new Date(gen.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
