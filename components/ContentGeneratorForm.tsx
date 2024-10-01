import React, { useEffect, useState } from "react";
import { getImageProvider } from "@/app/actions";
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
}: ContentGeneratorFormProps) {
  const [imageProvider, setImageProvider] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);

  useEffect(() => {
    const fetchImageProvider = async () => {
      const provider = await getImageProvider();
      setImageProvider(provider);
      setLoadingProvider(false);
    };

    if (activeTab === "image") {
      fetchImageProvider();
    }
  }, [activeTab]);

  if (loadingProvider) {
    return <div>Loading...</div>;
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
