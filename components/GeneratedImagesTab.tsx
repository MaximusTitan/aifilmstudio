import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GeneratedImagesTabProps = {
  generatedImages: string[];
  loading: boolean;
  onGenerateVideo: () => void;
};

export function GeneratedImagesTab({
  generatedImages,
  loading,
  onGenerateVideo,
}: GeneratedImagesTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <ScrollArea className="h-[300px]">
          {generatedImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="rounded-md overflow-hidden shadow-lg"
                >
                  <img
                    src={imageUrl}
                    alt={`Generated Image ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No images generated yet!</p>
          )}
        </ScrollArea>
        <Button
          onClick={onGenerateVideo}
          disabled={loading || generatedImages.length === 0}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Video"}
        </Button>
      </CardContent>
    </Card>
  );
}
