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
type StoryLengthOption = "3" | "6" | "12" | "custom";

export default function AdminSettings() {
  const [imageProvider, setImageProvider] =
    useState<ImageProvider>("replicate");
  const [videoProvider, setVideoProvider] = useState<VideoProvider>("luma"); // Default video provider
  const [storyLengthOption, setStoryLengthOption] =
    useState<StoryLengthOption>("12"); // Default story length
  const [customLength, setCustomLength] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const { data: imageData, error: imageError } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "image_provider")
          .single();
        const { data: videoData, error: videoError } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "video_provider")
          .single();
        const { data: storyLengthData, error: storyLengthError } =
          await supabase
            .from("settings")
            .select("value")
            .eq("key", "story_length")
            .single();

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

        if (storyLengthError) {
          console.error("Error fetching story length:", storyLengthError);
        } else if (storyLengthData) {
          const length = parseInt(storyLengthData.value, 10);
          if ([3, 6, 12].includes(length)) {
            setStoryLengthOption(length.toString() as StoryLengthOption);
          } else {
            setStoryLengthOption("custom");
            setCustomLength(length);
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchCurrentSettings();
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

  const handleStoryLengthChange = async (option: StoryLengthOption) => {
    setLoading(true);
    try {
      let length: number;
      if (option === "custom") {
        length = customLength;
      } else {
        length = parseInt(option, 10);
      }
      const { error } = await supabase
        .from("settings")
        .upsert(
          { key: "story_length", value: length.toString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      setStoryLengthOption(option);
    } catch (error) {
      console.error("Error updating story length:", error);
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

      {/* Story Length Selection */}
      <div className="space-y-2">
        <Label htmlFor="story-length">Story Length</Label>
        <Select
          value={storyLengthOption}
          onValueChange={(value: StoryLengthOption) =>
            handleStoryLengthChange(value)
          }
          disabled={loading}
        >
          <SelectTrigger id="story-length">
            <SelectValue placeholder="Select story length" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">15 Seconds</SelectItem>
            <SelectItem value="6">30 Seconds</SelectItem>
            <SelectItem value="12">60 Seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-gray-500">Updating settings...</p>}
    </div>
  );
}
