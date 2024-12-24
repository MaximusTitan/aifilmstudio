import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Image, Video, Maximize2, X } from "lucide-react";

type LatestGenerationProps = {
  latestGeneration: {
    id: string;
    type: "image" | "video" | "image-to-video";
    url: string;
    prompt: string;
    created_at?: string;
  };
  handleDownload: (url: string, filename: string) => void;
  handleRegenerate: () => void;
  updateSelectedImage: (url: string) => void;
};

export default function LatestGeneration({
  latestGeneration,
  handleDownload,
  handleRegenerate,
  updateSelectedImage,
}: LatestGenerationProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handleFullscreen = (url: string) => {
    setFullscreenImage(url);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <div className="flex-1 relative">
      <h2 className="text-2xl font-semibold">Latest Generation</h2>
      <div className="mt-2">
        {latestGeneration.type === "image" && (
          <img
            src={latestGeneration.url}
            alt="Generated"
            className="rounded-lg shadow-lg"
          />
        )}
        {(latestGeneration.type === "video" ||
          latestGeneration.type === "image-to-video") && (
          <video controls className="rounded-lg shadow-lg">
            <source src={latestGeneration.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <p className="text-sm mt-2">Prompt: {latestGeneration.prompt}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const extension = latestGeneration.type === "image" ? "jpg" : "mp4";
            handleDownload(
              `${latestGeneration.url}?download=${latestGeneration.type}-${latestGeneration.id}.${extension}`,
              `${latestGeneration.type}-${latestGeneration.id}.${extension}`
            );
          }}
          className="mr-2"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button onClick={handleRegenerate} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>

        {latestGeneration.type === "image" && (
          <>
            <Button
              onClick={() => updateSelectedImage(latestGeneration.url)}
              variant="outline"
              size="sm"
            >
              <Image className="mr-2 h-4 w-4" />
              to
              <Video className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => handleFullscreen(latestGeneration.url)}
              variant="outline"
              size="sm"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
          onClick={closeFullscreen}
        >
          <Button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 hover:bg-white/20"
            size="icon"
            variant="ghost"
          >
            <X className="h-6 w-6 text-white" />
          </Button>
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
