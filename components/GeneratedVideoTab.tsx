import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useState } from "react"; // Import useState

interface GeneratedVideoTabProps {
  generatedVideo?: string;
  narrationAudio?: string;
  onExport?: () => void;
  mergedVideoUrl?: string; // Ensure this prop is present
}

export const GeneratedVideoTab: React.FC<GeneratedVideoTabProps> = ({
  generatedVideo,
  narrationAudio, // Receive narrationAudio
  onExport,
  mergedVideoUrl, // Receive mergedVideoUrl
}) => {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {generatedVideo === undefined || generatedVideo === null ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {generatedVideo && generatedVideo.length > 0 ? (
                generatedVideo
                  .split(", ")
                  .map((videoUrl, index) => (
                    <video
                      key={index}
                      controls
                      src={videoUrl}
                      className="w-full h-48 rounded-md"
                    />
                  ))
              ) : (
                <p className="text-gray-500">No video generated yet!</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={onExport} className="w-auto">
                Export Video
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
