import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type VideoGeneratorFormProps = {
  prompt: string;
  setPrompt: (prompt: string) => void;
  aspectRatio: string;
  setAspectRatio: (aspectRatio: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
};

export default function VideoGeneratorForm({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  loading,
  handleSubmit,
}: VideoGeneratorFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="prompt">Video Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the video you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={setAspectRatio}>
          <SelectTrigger id="aspect-ratio">
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 (Square)</SelectItem>
            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
            <SelectItem value="3:4">3:4 (Vertical)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
        ) : (
          "Generate Video"
        )}
      </Button>
    </form>
  );
}
