import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AudioTabProps = {
  narrationAudio?: string;
  loading: boolean;
  onGenerateAudio: () => void;
  onGoToImagePrompts: () => void; // Make this prop required
};

export function AudioTab({
  narrationAudio,
  loading,
  onGenerateAudio,
  onGoToImagePrompts, // Destructure the required prop
}: AudioTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {narrationAudio ? (
          <>
            <div className="rounded-lg overflow-hidden border">
              <audio src={narrationAudio} controls className="w-full" />
            </div>
            <Button onClick={onGenerateAudio} className="w-full">
              Regenerate Audio
            </Button>
            <Button
              onClick={onGoToImagePrompts} // Update handler to trigger API call
              className="w-full mt-2"
              variant="secondary"
            >
              Generate Image Prompts {/* Rename button */}
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-500">No narration audio generated yet!</p>
            <Button
              onClick={onGenerateAudio}
              className="w-full"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Narration Audio"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
