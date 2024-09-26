// LatestGeneration.tsx
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

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
};

export default function LatestGeneration({
  latestGeneration,
  handleDownload,
  handleRegenerate,
}: LatestGenerationProps) {
  return (
    <div className="flex-1">
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
      <p className="text-sm mt-2">Prompt: {latestGeneration.prompt}</p>

      <div className="mt-2">
        <Button
          onClick={() => handleDownload(latestGeneration.url, `${latestGeneration.type}-${latestGeneration.id}`)}
          className="mr-2"
          variant={"outline"}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={handleRegenerate} variant={"outline"}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
