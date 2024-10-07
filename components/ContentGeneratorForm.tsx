import React, { useEffect, useState } from "react";
import { getImageProvider, getVideoProvider } from "@/app/actions"; // Assuming getVideoProvider is available
import ImageGeneratorForm from "./ImageGeneratorForm";
import VideoGeneratorForm from "./VideoGeneratorForm";
import GenerateImageFal from "./GenerateImageFal";

type ContentGeneratorFormProps = {
  activeTab: "image" | "video" | "image-to-video";
  prompt: string;
  setPrompt: (prompt: string) => void;
  aspectRatio: string;
  setAspectRatio: (aspectRatio: string) => void;
  imageSize: string;
  setImageSize: (aspectRatio: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  handleImageToVideo: () => void;
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
  handleSubmit,
  selectedImage,
  setSelectedImage,
  handleImageToVideo,
}: ContentGeneratorFormProps) {
  const [imageProvider, setImageProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState<string | null>(null); // To hold error messages

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
        setError("Failed to load providers. Please try again.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  if (loadingProviders) {
    return <div>Loading...</div>; // Keep this loading state while fetching providers
  }

  if (error) {
    return <div className="text-red-500">{error}</div>; // Show error if fetching fails
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
