import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image, Video, Maximize2, X } from "lucide-react";

type GenerationListProps = {
  generations: Array<{
    id: string;
    type: "image" | "video" | "image-to-video";
    url: string;
    prompt: string;
    created_at?: string;
  }>;
  updateSelectedImage: (url: string) => void;
  handleDownload: (url: string, filename: string) => void;
};

export default function GenerationList({
  generations,
  updateSelectedImage,
  handleDownload,
}: GenerationListProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const handleFullscreen = (url: string) => {
    setFullscreenImage(url);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <div className="relative">
      {generations.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Your Generations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="border rounded-lg p-4 shadow-md bg-white"
              >
                <div className="relative">
                  {gen.type === "image" && (
                    <img
                      src={gen.url}
                      alt="Generated"
                      className="rounded-lg shadow-lg"
                    />
                  )}
                  {(gen.type === "video" || gen.type === "image-to-video") && (
                    <video controls className="rounded-lg shadow-lg">
                      <source src={gen.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2 justify-between">
                  <Button
                    onClick={() =>
                      handleDownload(gen.url, `${gen.type}-${gen.id}`)
                    }
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {fullscreenImage === gen.url && (
                    <Button
                      onClick={closeFullscreen}
                      size="sm"
                      variant="outline"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  )}

                  {gen.type === "image" && (
                    <>
                      <Button
                        onClick={() => updateSelectedImage(gen.url)}
                        size="sm"
                        variant="outline"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        to
                        <Video className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => handleFullscreen(gen.url)}
                        size="sm"
                        variant="outline"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-sm mt-2">Prompt: {gen.prompt}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(gen.created_at ?? "").toLocaleString()}
                </p>
              </div>
            ))}
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
        </>
      )}
    </div>
  );
}
