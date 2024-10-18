import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ImagePromptsTabProps = {
  imagePrompts: string[];
  loading: boolean;
  onGenerateImages: () => void;
};

export function ImagePromptsTab({
  imagePrompts,
  loading,
  onGenerateImages,
}: ImagePromptsTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <ScrollArea className="h-[300px]">
          {imagePrompts.length > 0 ? (
            imagePrompts.map((prompt, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-bold">Scene {index + 1}</h3>
                <p className="w-full rounded-md border p-4">{prompt}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No image prompts generated yet!</p>
          )}
        </ScrollArea>
        <Button
          onClick={onGenerateImages}
          disabled={loading || imagePrompts.length === 0}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Images"}
        </Button>
      </CardContent>
    </Card>
  );
}
