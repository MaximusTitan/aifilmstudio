import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Pencil, Save } from "lucide-react";

type StoryTabProps = {
  story: string;
  loading: boolean;
  onStoryChange?: (newStory: string) => void;
  onGenerateImagePrompts?: () => void; // Add onGenerateImagePrompts prop
  narrationLines: string[]; // Add this prop
  generatedAudio: string[]; // Add this prop
};

export function StoryTab({
  story,
  loading,
  onStoryChange,
  onGenerateImagePrompts, // Add this
  narrationLines,
  generatedAudio,
}: StoryTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState(story);

  useEffect(() => {
    setEditedStory(story);
  }, [story]);

  const handleSave = () => {
    if (onStoryChange) {
      onStoryChange(editedStory);
    }
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {isEditing && (
          <h2 className="font-mono font-semibold underline mb-2">Edit Story</h2>
        )}
        <div className="relative">
          <ScrollArea className="max-h-[400px]">
            {editedStory ? (
              <Textarea
                value={editedStory}
                onChange={(e) => setEditedStory(e.target.value)}
                className="min-h-[280px] resize-none whitespace-pre-wrap bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                readOnly={!isEditing}
              />
            ) : (
              <p className="text-gray-500">Story not generated yet!</p>
            )}
          </ScrollArea>
        </div>
        <div className="flex justify-end space-x-2">
          {editedStory && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <Save className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            onClick={onGenerateImagePrompts} // Update to trigger image prompts generation
            disabled={loading || !editedStory}
            className="w-auto"
          >
            {loading ? "Generating..." : "Generate Image Prompts"}{" "}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
