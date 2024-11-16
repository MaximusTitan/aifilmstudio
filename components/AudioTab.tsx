import React, { useState } from "react"; // Add useState import
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
  const [imagePromptsLoading, setImagePromptsLoading] = useState(false); // New state

  const handleGenerateImagePrompts = async () => {
    setImagePromptsLoading(true);
    await onGoToImagePrompts();
    setImagePromptsLoading(false);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {narrationAudio ? (
          <>
            <div className="rounded-lg overflow-hidden border">
              <audio src={narrationAudio} controls className="w-full" />
            </div>
            {/* <Button
              onClick={onGenerateAudio}
              className="w-full"
              variant="secondary"
            >
              Regenerate Audio
            </Button> */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerateImagePrompts} // Update handler
                className="mt-2"
                disabled={imagePromptsLoading}
              >
                {imagePromptsLoading ? "Loading..." : "Generate Image Prompts"}
              </Button>
            </div>
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
