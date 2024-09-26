import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client"; // Adjust the path according to your structure

type ContentTabsProps = {
  activeTab: "image" | "video" | "image-to-video";
  setActiveTab: (tab: "image" | "video" | "image-to-video") => void;
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleImageToVideo: () => void;
  loading: boolean;
};

export default function ContentTabs({
  activeTab,
  setActiveTab,
  selectedImage,
  setSelectedImage,
  prompt,
  setPrompt,
  handleImageToVideo,
  loading,
}: ContentTabsProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setUploadSuccess(false); // Reset upload success on new file selection
    }
  };

  const uploadImage = async (file: File) => {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated");
      return;
    }

    const fileName = `uploaded-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, file, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return null; // Return null on error
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl; // Return the public URL for further processing
  };

  const handleUpload = async () => {
    if (imageFile) {
      setUploadLoading(true); // Start loading state
      const publicURL = await uploadImage(imageFile);
      setUploadLoading(false); // Stop loading state

      if (publicURL) {
        setSelectedImage(publicURL);
        setUploadSuccess(true); // Indicate upload was successful
      }
    }
  };

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
              <img src={selectedImage} alt="Selected" className="w-1/3 h-auto rounded-lg shadow-lg mt-2 mb-4" />
            </div>
          )}
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
            <Label htmlFor="picture">Choose Picture</Label>
            <div className="flex items-center">
            <Input
                id="picture"
                type="file"
                onChange={handleFileChange}
                className="mr-2"
                accept=".jpg,.jpeg,.png"
                />              
            <Button className="ml-2" onClick={handleUpload} disabled={!imageFile || uploadLoading}>
                {uploadLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Upload"}
              </Button>
            </div>
            {uploadSuccess && (
              <p className="text-sm text-green-600 mt-2">Image uploaded successfully!</p>
            )}
          </div>

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
