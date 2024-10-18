import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ScreenplayTabProps = {
  screenplay: string;
  loading: boolean;
  onGenerateImagePrompts: () => void;
};

export function ScreenplayTab({
  screenplay,
  loading,
  onGenerateImagePrompts,
}: ScreenplayTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <ScrollArea className="h-[300px]">
          {screenplay ? (
            <pre className="whitespace-pre-wrap">{screenplay}</pre>
          ) : (
            <p className="text-gray-500">Screenplay not generated yet!</p>
          )}
        </ScrollArea>
        <Button
          onClick={onGenerateImagePrompts}
          disabled={loading || !screenplay}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Image Prompts"}
        </Button>
      </CardContent>
    </Card>
  );
}
