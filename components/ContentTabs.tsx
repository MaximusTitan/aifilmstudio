// ContentTabs.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type ContentTabsProps = {
  activeTab: "image" | "video" | "image-to-video";
  setActiveTab: (tab: "image" | "video" | "image-to-video") => void;
  selectedImage: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleImageToVideo: () => void;
  loading: boolean;
};

export default function ContentTabs({
  activeTab,
  setActiveTab,
  selectedImage,
  prompt,
  setPrompt,
  handleImageToVideo,
  loading,
}: ContentTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "image" | "video" | "image-to-video")}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="image">
          <Image className="mr-2 h-4 w-4" />
          Image
        </TabsTrigger>
        <TabsTrigger value="video">
          <Video className="mr-2 h-4 w-4" />
          Video
        </TabsTrigger>
        <TabsTrigger value="image-to-video">
          <Image className="mr-2 h-4 w-4" />
          to
          <Video className="ml-2 h-4 w-4" />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="image-to-video" className="mt-4">
        <div>
          {activeTab === "image-to-video" && selectedImage && (
              <div>
              <img src={selectedImage} alt="Selected" className="w-1/4 h-auto rounded-lg shadow-lg mt-2" />
            </div>
          )}
          <Label htmlFor="image-prompt">Prompt</Label>
          <Textarea
            id="image-prompt"
            placeholder="Describe the video you want to generate from the image..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>
        <Button className="mt-4" onClick={handleImageToVideo} disabled={loading || !selectedImage || !prompt}>
          {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Generate"}
        </Button>
          <p className="text-xs mt-2 opacity-50">Tip: Generate an image and select it from there.</p>
      </TabsContent>
    </Tabs>
  );
}
