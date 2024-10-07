"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type ImageProvider = "replicate" | "fal";
type VideoProvider = "luma" | "runway"; // Define your video providers here

export default function AdminSettings() {
  const [imageProvider, setImageProvider] =
    useState<ImageProvider>("replicate");
  const [videoProvider, setVideoProvider] = useState<VideoProvider>("luma"); // Default video provider
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentProviders = async () => {
      try {
        const [
          { data: imageData, error: imageError },
          { data: videoData, error: videoError },
        ] = await Promise.all([
          supabase
            .from("settings")
            .select("value")
            .eq("key", "image_provider")
            .single(),
          supabase
            .from("settings")
            .select("value")
            .eq("key", "video_provider")
            .single(),
        ]);

        if (imageError) {
          console.error("Error fetching current image provider:", imageError);
        } else if (imageData) {
          setImageProvider(imageData.value as ImageProvider);
        }

        if (videoError) {
          console.error("Error fetching current video provider:", videoError);
        } else if (videoData) {
          setVideoProvider(videoData.value as VideoProvider);
        }
      } catch (error) {
        console.error("Error fetching providers:", error);
      }
    };

    fetchCurrentProviders();
  }, [supabase]);

  const handleImageProviderChange = async (value: ImageProvider) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "image_provider", value }, { onConflict: "key" });

      if (error) throw error;

      setImageProvider(value);
    } catch (error) {
      console.error("Error updating image provider:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProviderChange = async (value: VideoProvider) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "video_provider", value }, { onConflict: "key" });

      if (error) throw error;

      setVideoProvider(value);
    } catch (error) {
      console.error("Error updating video provider:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Settings</h2>

      {/* Image Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="image-provider">Image Generation API Provider</Label>
        <Select
          value={imageProvider}
          onValueChange={(value: ImageProvider) =>
            handleImageProviderChange(value)
          }
          disabled={loading}
        >
          <SelectTrigger id="image-provider">
            <SelectValue placeholder="Select image provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="replicate">Replicate</SelectItem>
            <SelectItem value="fal">Fal.ai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Video Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="video-provider">Video Generation API Provider</Label>
        <Select
          value={videoProvider}
          onValueChange={(value: VideoProvider) =>
            handleVideoProviderChange(value)
          }
          disabled={loading}
        >
          <SelectTrigger id="video-provider">
            <SelectValue placeholder="Select video provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="luma">Luma</SelectItem>
            <SelectItem value="runway">Runway</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-gray-500">Updating settings...</p>}
    </div>
  );
}
