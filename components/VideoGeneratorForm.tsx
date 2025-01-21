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
  error?: string;
};

export default function VideoGeneratorForm({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  loading,
  handleSubmit,
  error,
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
      {error && (
        <div
          className="flex items-center p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg mt-4"
          role="alert"
        >
          <svg
            className="flex-shrink-0 inline w-4 h-4 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.993.883L9 8v3a1 1 0 001.993.117L11 11V8a1 1 0 00-1-1zm0 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
              clipRule="evenodd"
            />
          </svg>
          <span className="sr-only">Error</span>
          <div className="flex-1">
            <span className="font-medium">{error}</span>
            <button
              onClick={() => (window.location.href = "/credits")}
              className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recharge Credits
            </button>
          </div>
        </div>
      )}
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
