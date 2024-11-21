import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useState } from "react"; // Import useState

interface GeneratedVideoTabProps {
  generatedVideo: { url: string; error?: string }[];
  narrationAudio?: string;
  onExport?: () => void;
  onRetryVideo?: () => void; // Add prop for retry
}

export const GeneratedVideoTab: React.FC<GeneratedVideoTabProps> = ({
  generatedVideo, // Ensure it's always defined
  onExport,
  onRetryVideo, // Destructure prop
}) => {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {generatedVideo.length === 0 ? (
          <Skeleton className="h-48 w-full" />
        ) : generatedVideo.some((video) => video.error) ? ( // Check if any video has an error
          <div className="flex flex-col items-center justify-center h-48 bg-red-100">
            <p className="text-red-500">
              One or more videos failed to generate.
            </p>
            <Button onClick={onRetryVideo} className="mt-2">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedVideo.map((video, index) => (
              <div key={index} className="relative">
                <video src={video.url} controls className="w-full rounded-md" />
                {video.error && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
                    Error
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Button: Merge All Videos */}
        {generatedVideo.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={onExport}
              disabled={generatedVideo.some((video) => video.error)}
            >
              {generatedVideo.some((video) => video.error)
                ? "Cannot Merge Due to Errors"
                : "Merge All Videos"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
