import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AudioTabProps = {
  story: string;
  imagePrompts: string[];
  narrations?: { script: string; audioUrl?: string; error?: string }[];
  loading: boolean;
  onGenerateAudio: (index: number) => void;
  onGenerateNarrations: () => void; // Ensure this remains as () => void
  onGenerateImages: () => void;
  onConvertAllAudio: () => void;
};

export function AudioTab({
  story,
  imagePrompts,
  narrations = [],
  loading,
  onGenerateAudio,
  onGenerateNarrations,
  onGenerateImages,
  onConvertAllAudio,
}: AudioTabProps) {
  const [localNarrations, setLocalNarrations] = useState(narrations);

  useEffect(() => {
    setLocalNarrations(narrations);
  }, [narrations]);

  const allAudioGenerated = localNarrations.every(
    (narration) => narration.audioUrl
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {localNarrations.length > 0 ? (
          localNarrations.map((narration, index) => (
            <div key={index} className="space-y-2">
              <p>
                <strong> {index + 1}:</strong> {narration.script}
              </p>
              {narration.audioUrl ? (
                <audio src={narration.audioUrl} controls className="w-full" />
              ) : narration.error ? (
                <div className="flex items-center space-x-2">
                  <p className="text-red-500">Error: {narration.error}</p>
                  <Button
                    onClick={() => onGenerateAudio(index)}
                    disabled={loading}
                    className="w-auto"
                  >
                    {loading ? "Retrying..." : "Try Again"}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Audio not available.</p> // Ensure fallback message is present
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No narrations generated yet!</p>
        )}

        {/* Add Convert All to Audio button */}
        {!allAudioGenerated && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={onConvertAllAudio} // New prop for bulk conversion
              disabled={loading || localNarrations.length === 0}
              className="w-auto"
            >
              {loading ? "Converting All..." : "Convert All to Audio"}
            </Button>
          </div>
        )}

        {/* Conditionally display the "Generate Images" button */}
        {allAudioGenerated && (
          <div className="flex justify-end mt-4">
            <Button
              onClick={onGenerateImages}
              disabled={loading || imagePrompts.length === 0}
              className="w-auto"
            >
              {loading ? "Generating Images..." : "Generate Images"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
