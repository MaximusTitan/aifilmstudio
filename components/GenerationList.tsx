// GenerationList.tsx
import { Button } from "@/components/ui/button";
import { Download, Image, Video } from "lucide-react";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <p className="text-sm mt-2">Prompt: {gen.prompt}</p>

          {/* Conditionally render the Image to Video button */}
          {gen.type !== "video" && (
            <Button
              onClick={() => updateSelectedImage(gen.url)}
              className="mt-2 mr-2"
              size="sm"
              variant={"outline"}
            >
              <Image className="mr-2 h-4 w-4" />
              to
              <Video className="ml-2 h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={() => handleDownload(gen.url, `${gen.type}-${gen.id}`)}
            className="mt-2"
            size="sm"
            variant={"outline"}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
