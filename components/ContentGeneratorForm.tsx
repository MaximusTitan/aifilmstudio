import React, { useEffect, useState } from "react";
import { getImageProvider, getVideoProvider } from "@/app/actions";
import ImageGeneratorForm from "./ImageGeneratorForm";
import VideoGeneratorForm from "./VideoGeneratorForm";
import GenerateImageFal from "./GenerateImageFal";
import axios from "axios";

type Generation = {
  id: string;
  type: "image" | "video" | "image-to-video";
  url: string;
  prompt: string;
  created_at: string;
};

type ContentGeneratorFormProps = {
  activeTab: "image" | "video" | "image-to-video";
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  aspectRatio: string;
  setAspectRatio: React.Dispatch<React.SetStateAction<string>>;
  imageSize: string;
  setImageSize: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setLatestGeneration: React.Dispatch<React.SetStateAction<Generation | null>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  selectedImage: string | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<string | null>>;
  handleImageToVideo: () => Promise<void>;
};

export default function ContentGeneratorForm({
  activeTab,
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  imageSize,
  setImageSize,
  loading,
  setLoading,
  setError,
  setLatestGeneration,
}: ContentGeneratorFormProps) {
  const [imageProvider, setImageProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [generations, updateGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const [imageProviderResult, videoProviderResult] = await Promise.all([
          getImageProvider(),
          getVideoProvider(),
        ]);

        setImageProvider(imageProviderResult);
      } catch (err) {
        console.error("Error fetching providers:", err);
        setLocalError("Failed to load providers. Please try again.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError("");

    try {
      let endpoint = "";
      let requestBody: any = { prompt, aspect_ratio: aspectRatio };

      if (activeTab === "image") {
        if (imageProvider === "fal") {
          endpoint = "/api/generate-image-fal";
          requestBody = {
            prompt,
            image_size: imageSize,
            num_inference_steps: 4,
            num_images: 1,
          };
        } else {
          endpoint = "/api/generate-image";
        }
      } else if (activeTab === "video") {
        endpoint = "/api/generate-video";
      }

      console.log("Sending request to:", endpoint, "with body:", requestBody);
      const response = await axios.post(endpoint, requestBody);
      if (response.status !== 200) {
        throw new Error("Failed to generate content");
      }

      const newGeneration: Generation = {
        id: Date.now().toString(),
        type: activeTab,
        url: response.data.videoUrl || response.data.imageUrl,
        prompt: prompt,
        created_at: new Date().toISOString(),
      };

      const updatedGenerations = [...generations, newGeneration];
      // setGenerations(updatedGenerations); // Pass the updated array directly
      updateGenerations(updatedGenerations); // Update the local state of generations

      setLatestGeneration(newGeneration);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setLocalError(err.response.data.message);
      } else {
        setLocalError("Failed to generate content. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProviders) {
    return <div>Loading...</div>;
  }

  if (localError) {
    return (
      <div
        className="flex items-center p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg mt-4"
        role="alert"
      >
        <svg
          className="flex-shrink-0 inline w-4 h-4 mr-3"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.993.883L9 8v3a1 1 0 001.993.117L11 11V8a1 1 0 00-1-1zm0 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only">Error</span>
        <div className="flex-1">
          <span className="font-medium">{localError}</span>
          <button
            onClick={() => (window.location.href = "/credits")}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Recharge Credits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {activeTab === "image" && (
        <>
          {imageProvider === "replicate" && (
            <ImageGeneratorForm
              prompt={prompt}
              setPrompt={setPrompt}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              loading={loading}
              handleSubmit={handleSubmit}
            />
          )}
          {imageProvider === "fal" && (
            <GenerateImageFal
              prompt={prompt}
              setPrompt={setPrompt}
              imageSize={imageSize}
              setImageSize={setImageSize}
              loading={loading}
              handleSubmit={handleSubmit}
            />
          )}
        </>
      )}

      {activeTab === "video" && (
        <VideoGeneratorForm
          prompt={prompt}
          setPrompt={setPrompt}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          loading={loading}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
