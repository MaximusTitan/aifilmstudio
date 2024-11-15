import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type GeneratedVideoTabProps = {
  generatedVideo?: string;
  onExport?: () => void;
};

export function GeneratedVideoTab({
  generatedVideo,
  onExport,
}: GeneratedVideoTabProps) {
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
            </div>
            <Button onClick={onExport} className="w-full mt-4">
              Export Video
            </Button>
          </>
        ) : (
          <p className="text-gray-500">No video generated yet!</p>
        )}
      </CardContent>
    </Card>
  );
}
