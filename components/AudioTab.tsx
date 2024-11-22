import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AudioTabProps = {
  story: string;
  imagePrompts: string[];
  narrations: { script: string; audioUrl?: string; error?: string }[];
  loading: boolean;
  onGenerateAudio: (index: number) => void;
  onGenerateNarrations: () => Promise<void>;
  onGenerateImages: () => Promise<void>;
  generatedAudio: string[];
};

export function AudioTab({
  story,
  imagePrompts,
  narrations = [],
  loading,
  onGenerateAudio,
  onGenerateNarrations,
  onGenerateImages,
  generatedAudio,
}: AudioTabProps) {
  const [localNarrations, setLocalNarrations] = useState(narrations);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalNarrations(narrations);
  }, [narrations]);

  const allAudioGenerated = localNarrations.every(
    (narration) => narration.audioUrl
  );

  // New function to process narrations sequentially
  const convertAllAudioSequentially = async () => {
    for (let i = 0; i < localNarrations.length; i++) {
      if (localNarrations[i].audioUrl) continue; // Skip if audio already generated
      setProcessingIndex(i);
      try {
        await onGenerateAudio(i); // Wait for each audio generation to complete
      } catch (error) {
        console.error(`Error generating audio for narration ${i}:`, error);
      }
    }
    setProcessingIndex(null);
  };

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
                <p className="text-gray-500">Audio not available.</p>
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
              onClick={convertAllAudioSequentially}
              disabled={
                loading ||
                localNarrations.length === 0 ||
                processingIndex !== null
              }
              className="w-auto"
            >
              {processingIndex !== null
                ? `Converting narration ${processingIndex + 1}...`
                : "Convert All to Audio"}
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
