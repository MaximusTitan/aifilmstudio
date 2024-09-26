"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Image, Loader2, Video, Download, RefreshCw } from "lucide-react";
import axios from "axios";

type Generation = {
  id: string;
  type: "image" | "video" | "image-to-video";
  url: string;
  prompt: string;
  created_at?: string;
};

export default function ContentGenerator() {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "image-to-video">("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const response = await axios.get("/api/get-generations");
        const fetchedGenerations = response.data.generations.map((gen: any) => ({
          id: gen.id,
          type: gen.type,
          url: gen.result_path,
          prompt: gen.parameters.prompt,
          created_at: gen.created_at,
        }));
        setGenerations(fetchedGenerations);
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

    console.log("Submitting data:", { prompt, aspectRatio }); // Debug statement

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
      console.error("Error in handleSubmit:", err); // Debug statement
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleImageToVideo = async () => {
    if (!selectedImage || !prompt) {
      console.log("Image or prompt is missing:", { selectedImage, prompt }); // Debug statement
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Converting image to video with data:", { aspectRatio, prompt, selectedImage }); // Debug statement
      const response = await axios.post("/api/image-to-video", {
        aspect_ratio: aspectRatio,
        prompt: prompt,
        keyframes: {
          frame0: {
            type: 'image',
            url: selectedImage,
          },
        },
        loop: false,
      });

      if (response.status !== 200) {
        throw new Error("Failed to convert image to video");
      }

      const newGeneration: Generation = {
        id: Date.now().toString(),
        type: "image-to-video",
        url: response.data.videoUrl,
        prompt: prompt,
        created_at: new Date().toISOString(),
      };

      setGenerations((prev) => [newGeneration, ...prev]);
      setLatestGeneration(newGeneration);
      setSelectedImage(null);
    } catch (err) {
      console.error("Error in handleImageToVideo:", err); // Debug statement
      setError("Failed to convert image to video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (latestGeneration) {
      setPrompt(latestGeneration.prompt);
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateSelectedImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="flex gap-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-center mb-4">AI Content Generator</h1>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "image" | "video" | "image-to-video")}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="image">
                <Image className="mr-2 h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video">
                <Video className="mr-2 h-4 w-4" />
                Video
              </TabsTrigger>
              <TabsTrigger value="image-to-video">
                <Image className="mr-2 h-4 w-4" />
                to
                <Video className="ml-2 h-4 w-4" />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="image-to-video" className="mt-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                {/* <Label htmlFor="picture">Picture</Label>
                <Input id="picture" type="file" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    setSelectedImage(url);
                    console.log("Selected image URL:", url); // Debug statement
                  }
                }} /> */}
              </div>
              <div>
                {activeTab === "image-to-video" && selectedImage && (
                  <div>
                    <Label htmlFor="selected-image">Selected Image</Label>
                    <img src={selectedImage} alt="Selected" className="w-1/4 h-auto rounded-lg shadow-lg mt-2" />
                  </div>
                )}
                <Label htmlFor="image-prompt">Prompt</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="Describe the video you want to generate from the image..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>
              <Button className="mt-4" onClick={handleImageToVideo} disabled={loading || !selectedImage || !prompt}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Generate Video"}
              </Button>
            </TabsContent>
          </Tabs>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {(activeTab === "image" || activeTab === "video") && (
              <>
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
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="3:4">3:4 (Portrait Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Generate"}
            </Button>
              </>
            )}

            {error && <div className="text-red-500">{error}</div>}
          </form>
          {latestGeneration && (
            <div className="mt-4">
              <h2 className="text-2xl font-semibold">Latest Generation</h2>
              <div className="mt-2">
                {latestGeneration.type === "image" && (
                  <img src={latestGeneration.url} alt="Generated" className="rounded-lg shadow-lg" />
                )}
                {latestGeneration.type === "video" && (
                  <video controls className="rounded-lg shadow-lg">
                    <source src={latestGeneration.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                {latestGeneration.type === "image-to-video" && (
                  <video controls className="rounded-lg shadow-lg">
                    <source src={latestGeneration.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              <div className="mt-2">
                <Button
                  onClick={() => handleDownload(latestGeneration.url, `${latestGeneration.type}-${latestGeneration.id}`)}
                  className="mr-2"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button onClick={handleRegenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Previous Generations</h2>
          <div className="space-y-4 mt-4">
            {generations.map((gen) => (
              <div key={gen.id} className="border rounded-lg p-4 shadow-md">
                {gen.type === "image" && (
                  <img src={gen.url} alt="Generated" className="rounded-lg shadow-lg" />
                )}
                {gen.type === "video" && (
                  <video controls className="rounded-lg shadow-lg">
                    <source src={gen.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                {gen.type === "image-to-video" && (
                  <video controls className="rounded-lg shadow-lg">
                    <source src={gen.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <div className="mt-2">
                  <Button onClick={() => updateSelectedImage(gen.url)}>Select Image</Button>
                  <Button
                    onClick={() => handleDownload(gen.url, `${gen.type}-${gen.id}`)}
                    className="ml-2"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">{gen.prompt}</p>
                <p className="mt-2 text-sm text-gray-400">{new Date(gen.created_at ?? "").toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
