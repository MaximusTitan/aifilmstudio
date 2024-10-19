import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Pencil, Save } from "lucide-react";

type ScreenplayTabProps = {
  screenplay: string;
  loading: boolean;
  onGenerateImagePrompts: () => void;
  onScreenplayChange?: (newScreenplay: string) => void;
};

export function ScreenplayTab({
  screenplay,
  loading,
  onGenerateImagePrompts,
  onScreenplayChange,
}: ScreenplayTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScreenplay, setEditedScreenplay] = useState(screenplay);

  useEffect(() => {
    setEditedScreenplay(screenplay);
  }, [screenplay]);

  const handleSave = () => {
    if (onScreenplayChange) {
      onScreenplayChange(editedScreenplay);
    }
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="relative">
          <ScrollArea className="h-[300px]">
            {editedScreenplay ? (
              <Textarea
                value={editedScreenplay}
                onChange={(e) => setEditedScreenplay(e.target.value)}
                className="min-h-[280px] resize-none whitespace-pre-wrap bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                readOnly={!isEditing}
              />
            ) : (
              <p className="text-gray-500">Screenplay not generated yet!</p>
            )}
          </ScrollArea>
          {editedScreenplay && (
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
          onClick={onGenerateImagePrompts}
          disabled={loading || !editedScreenplay}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Image Prompts"}
        </Button>
      </CardContent>
    </Card>
  );
}
