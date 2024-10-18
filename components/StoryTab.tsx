import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StoryTabProps = {
  story: string;
  loading: boolean;
  onGenerateScreenplay: () => void;
};

export function StoryTab({
  story,
  loading,
  onGenerateScreenplay,
}: StoryTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <ScrollArea className="h-[300px]">
          {story ? (
            <pre className="whitespace-pre-wrap">{story}</pre>
          ) : (
            <p className="text-gray-500">Story not generated yet!</p>
          )}
        </ScrollArea>
        <Button
          onClick={onGenerateScreenplay}
          disabled={loading || !story}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Screenplay"}
        </Button>
      </CardContent>
    </Card>
  );
}
