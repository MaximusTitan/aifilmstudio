import { Input } from "@/components/ui/input";
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
        <Input
          placeholder="Enter your story prompt..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={loading}
        />
        <Button onClick={onGenerate} className="w-full" disabled={loading}>
          {loading ? "Generating..." : "Generate Story"}
        </Button>
      </CardContent>
    </Card>
  );
}
