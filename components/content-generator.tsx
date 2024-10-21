"use client";

import { useState, useEffect, SetStateAction } from "react";
import ContentTabs from "./ContentTabs";
import ContentGeneratorForm from "./ContentGeneratorForm";
import LatestGeneration from "./LatestGeneration";
import GenerationList from "./GenerationList";
import axios from "axios";
import { getImageProvider } from "@/app/actions";

type Generation = {
  id: string;
  type: "image" | "video" | "image-to-video";
  url: string;
  prompt: string;
  created_at: string;
};

export default function ContentGenerator() {
  const [activeTab, setActiveTab] = useState<
    "image" | "video" | "image-to-video"
  >("image");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [imageSize, setImageSize] = useState("landscape_16_9");
  const [loading, setLoading] = useState(false); // State to handle loading
  const [error, setError] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenerations = async () => {
      try {
        const response = await axios.get("/api/get-generations");
        const fetchedGenerations = response.data.generations.map(
          (gen: any) => ({
            id: gen.id,
            type: gen.type,
            url: gen.result_path,
            prompt: gen.parameters.prompt,
            created_at: gen.created_at,
          })
        );
        setGenerations(fetchedGenerations.reverse());
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
      let endpoint =
        activeTab === "image" ? "/api/generate-image" : "/api/generate-video";
      const imageProvider = await getImageProvider();
      let requestBody: any = { prompt, aspect_ratio: aspectRatio };

      if (imageProvider === "fal") {
        endpoint = "/api/generate-image-fal";
        requestBody = {
          prompt,
          image_size: imageSize,
          num_inference_steps: 4,
          num_images: 1,
        };
      }

      console.log("Sending request to:", endpoint, "with body:", requestBody);
      const response = await axios.post(endpoint, requestBody);

      if (response.status !== 200) {
        throw new Error("Failed to generate content");
      }

      const newGeneration: Generation = {
        id: Date.now().toString(),
        type: activeTab,
        url:
          activeTab === "image"
            ? response.data.imageUrl
            : response.data.videoUrl,
        prompt: prompt,
        created_at: new Date().toISOString(),
      };

      setGenerations((prev) => [newGeneration, ...prev]);
      setLatestGeneration(newGeneration);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (axios.isAxiosError(err) && err.response) {
        console.error("Server responded with:", err.response.data);
      }
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
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/image-to-video", {
        aspect_ratio: aspectRatio,
        prompt: prompt,
        keyframes: {
          frame0: {
            type: "image",
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
      console.error("Error in handleImageToVideo:", err);
      setError("Failed to convert image to video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (latestGeneration) {
      setPrompt(latestGeneration.prompt);
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateSelectedImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setActiveTab("image-to-video");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-3xl font-semibold">Content Generator</h1>
      <div className="flex gap-8">
        <div className="flex-1 min-w-96">
          <ContentTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            prompt={prompt}
            setPrompt={setPrompt}
            handleImageToVideo={handleImageToVideo}
            loading={loading}
            setLoading={setLoading} // Pass the actual setLoading function here
            videoProvider={null}
          />
          <ContentGeneratorForm
            activeTab={activeTab}
            prompt={prompt}
            setPrompt={setPrompt}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            imageSize={imageSize}
            setImageSize={setImageSize}
            loading={loading}
            handleSubmit={handleSubmit}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            handleImageToVideo={handleImageToVideo}
            setLoading={setLoading} // Correct: Use actual state updater function
            setError={setError} // Correct: Use actual state updater function
            setLatestGeneration={setLatestGeneration} // Correct: Use actual state updater function
          />
        </div>
        {latestGeneration && (
          <LatestGeneration
            latestGeneration={latestGeneration}
            handleDownload={handleDownload}
            handleRegenerate={handleRegenerate}
            updateSelectedImage={updateSelectedImage}
          />
        )}
      </div>
      <GenerationList
        generations={generations}
        updateSelectedImage={updateSelectedImage}
        handleDownload={handleDownload}
      />
    </div>
  );
}
