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

export default function AdminSettings() {
  const [imageProvider, setImageProvider] =
    useState<ImageProvider>("replicate");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentProvider = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "image_provider")
        .single();

      if (error) {
        console.error("Error fetching current provider:", error);
      } else if (data) {
        setImageProvider(data.value as ImageProvider);
      }
    };

    fetchCurrentProvider();
  }, [supabase]);

  const handleProviderChange = async (value: ImageProvider) => {
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">API Settings</h2>
      <div className="space-y-2">
        <Label htmlFor="image-provider">Image Generation API Provider</Label>
        <Select
          value={imageProvider}
          onValueChange={(value: ImageProvider) => handleProviderChange(value)}
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
      {loading && <p className="text-sm text-gray-500">Updating settings...</p>}
    </div>
  );
}
