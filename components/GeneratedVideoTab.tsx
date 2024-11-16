import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        {generatedVideo && generatedVideo.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {generatedVideo.split(", ").map((videoUrl, index) => (
                <video
                  key={index}
                  controls
                  src={videoUrl}
                  className="w-full h-48 rounded-md"
                />
              ))}
              {/* 
              Removed mergedVideoUrl display
              {mergedVideoUrl && (
                <video
                  controls
                  src={mergedVideoUrl}
                  className="w-full h-48 rounded-md"
                />
              )}
              */}
            </div>
            <div className="flex justify-end">
              <Button onClick={onExport} className="w-auto">
                Export Video
              </Button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No video generated yet!</p>
        )}
      </CardContent>
    </Card>
  );
};
