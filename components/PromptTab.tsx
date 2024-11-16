import { Textarea } from "./ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type PromptTabProps = {
  prompt: string;
  loading: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
};

export function PromptTab({
  prompt,
  loading,
  onPromptChange,
  onGenerate,
}: PromptTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <Textarea
          placeholder="Enter your story prompt..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={loading}
          className="min-h-32"
        />
        <div className="flex justify-end">
          <Button onClick={onGenerate} className="w-auto" disabled={loading}>
            {loading ? "Generating..." : "Generate Story"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
