import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

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
        <ScrollArea className="h-[360px]">
          {loading ? ( // Show skeletons when loading
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="w-full h-48 rounded-md" />
              ))}
            </div>
          ) : generatedImages.length > 0 ? (
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
        <div className="flex justify-end">
          <Button
            onClick={onGenerateVideo}
            disabled={loading || generatedImages.length === 0}
            className="w-auto"
          >
            {loading ? "Generating..." : "Generate Video"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
