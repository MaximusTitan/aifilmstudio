import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Pencil, Save } from "lucide-react";

type StoryTabProps = {
  story: string;
  loading: boolean;
  onGenerateScreenplay: () => void;
  onStoryChange?: (newStory: string) => void;
};

export function StoryTab({
  story,
  loading,
  onGenerateScreenplay,
  onStoryChange,
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
        <div className="relative">
          <ScrollArea className="h-[300px]">
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
          {editedStory && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-2"
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
        </div>
        <Button
          onClick={onGenerateScreenplay}
          disabled={loading || !editedStory}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Screenplay"}
        </Button>
      </CardContent>
    </Card>
  );
}
