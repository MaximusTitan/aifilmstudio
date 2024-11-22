import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

type GeneratedImagesTabProps = {
  generatedImages: { url: string; error?: string }[];
  loading: boolean;
  onGenerateVideo: () => void;
  onRetryImage: (index: number) => void; // Add prop for retry
  onGenerateImages: () => void; // Add this line to the props
};

export function GeneratedImagesTab({
  generatedImages,
  loading,
  onGenerateVideo,
  onRetryImage, // Destructure prop
  onGenerateImages, // Destructure the prop
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
              {generatedImages.map((image, index) => (
                <div key={index} className="relative">
                  {image.error ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-red-100">
                      <p className="text-red-500">{image.error}</p>
                      <Button
                        onClick={() => onRetryImage(index)}
                        disabled={loading}
                        className="mt-2"
                      >
                        {loading ? "Retrying..." : "Retry"}
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={image.url}
                      alt={`Generated Image ${index + 1}`}
                      className="w-full h-auto rounded-md"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No images generated yet!</p>
          )}
        </ScrollArea>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={onGenerateVideo}
            disabled={
              loading ||
              generatedImages.some((img) => img.error) ||
              generatedImages.length === 0
            }
            className="w-auto"
          >
            {loading ? "Generating..." : "Generate Video"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
