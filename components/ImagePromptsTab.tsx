import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { Pencil, Save } from "lucide-react";

type ImagePromptsTabProps = {
  imagePrompts: string[];
  loading: boolean;
  onGenerateImages: () => void;
  onImagePromptsChange?: (newPrompts: string[]) => void;
  onGenerateNarrations: () => void; // Add onGenerateNarrations prop
};

export function ImagePromptsTab({
  imagePrompts,
  loading,
  onGenerateImages,
  onImagePromptsChange,
  onGenerateNarrations, // Ensure this is correctly mapped
}: ImagePromptsTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<string[]>(
    imagePrompts || []
  ); // Initialize with empty array if undefined
  const [textareaHeights, setTextareaHeights] = useState<number[]>([]);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    setEditedPrompts(imagePrompts || []); // Ensure editedPrompts is always an array
  }, [imagePrompts]);

  useEffect(() => {
    const heights = paragraphRefs.current.map((ref) => ref?.offsetHeight || 0);
    setTextareaHeights(heights);
  }, [editedPrompts]);

  const handleSave = (index: number, newValue: string) => {
    const updatedPrompts = [...editedPrompts];
    updatedPrompts[index] = newValue;
    if (onImagePromptsChange) {
      onImagePromptsChange(updatedPrompts);
    }
    setEditingIndex(null);
  };

  const commonStyles = "w-full rounded-md border p-4 pr-12 mb-2";

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <ScrollArea className="h-[300px]">
          {editedPrompts.length > 0 ? ( // editedPrompts is guaranteed to be an array
            editedPrompts.map((prompt, index) => (
              <div key={index} className="mb-4 relative">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Scene {index + 1}</h3>
                  {editingIndex === index && (
                    <h4 className="font-mono font-semibold underline">
                      Edit Mode
                    </h4>
                  )}
                </div>
                {editingIndex === index ? (
                  <div className="relative">
                    <Textarea
                      value={prompt}
                      onChange={(e) => {
                        const newPrompts = [...editedPrompts];
                        newPrompts[index] = e.target.value;
                        setEditedPrompts(newPrompts);
                      }}
                      className={commonStyles}
                      style={{
                        height: `${textareaHeights[index]}px`,
                        resize: "none",
                        font: "inherit",
                        overflow: "auto",
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => handleSave(index, prompt)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <p
                      ref={(el) => (paragraphRefs.current[index] = el)}
                      className={commonStyles}
                    >
                      {prompt}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => setEditingIndex(index)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No image prompts generated yet!</p>
          )}
        </ScrollArea>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={onGenerateNarrations} // Correctly trigger narration generation
            disabled={loading || editedPrompts.length === 0}
            className="w-auto"
          >
            {loading ? "Generating..." : "Generate Narrations"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
