import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";

type ImageToVideoRunwayProps = {
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleImageToVideo: () => void;
  videoProvider: string | null;
};

export default function ImageToVideoRunway({
  selectedImage,
  setSelectedImage,
  prompt,
  setPrompt,
  loading,
  setLoading,
  videoProvider,
}: ImageToVideoRunwayProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setUploadSuccess(false);
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
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleUpload = async () => {
    if (imageFile) {
      setUploadLoading(true);
      const publicURL = await uploadImage(imageFile);
      setUploadLoading(false);

      if (publicURL) {
        setSelectedImage(publicURL);
        setUploadSuccess(true);
      }
    }
  };

  const handleImageToVideo = async () => {
    if (!selectedImage || !prompt) return;

    setLoading(true);
    setError("");
    setVideoUrl(null);

    const formData = {
      prompt,
      imageUrl: selectedImage,
    };

    try {
      const response = await axios.post(
        "/api/image-to-video-runway",
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setVideoUrl(response.data.videoUrl);
    } catch (err) {
      setError("Failed to generate video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {selectedImage && (
        <div>
          <img
            src={selectedImage}
            alt="Selected"
            className="w-1/3 h-auto rounded-lg shadow-lg mt-2 mb-4"
          />
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
          <Button
            className="ml-2"
            onClick={handleUpload}
            disabled={!imageFile || uploadLoading}
          >
            {uploadLoading ? (
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
            ) : (
              "Upload"
            )}
          </Button>
        </div>
        {uploadSuccess && (
          <p className="text-sm text-green-600 mt-2">
            Image uploaded successfully!
          </p>
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
      <Button
        className="mt-4"
        onClick={handleImageToVideo}
        disabled={loading || !selectedImage || !prompt}
      >
        {loading ? (
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
        ) : (
          "Generate Video"
        )}
      </Button>
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
      {videoUrl && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Generated Video</h2>
          <video src={videoUrl} controls className="w-full mt-2" />
        </div>
      )}
      <p className="text-xs mt-2 opacity-50">
        Tip: Generate an image and select it from there.
      </p>
    </div>
  );
}
