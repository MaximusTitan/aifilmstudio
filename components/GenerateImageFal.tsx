"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type GenerateImageFalProps = {
  prompt: string;
  setPrompt: (prompt: string) => void;
  imageSize: string;
  setImageSize: (aspectRatio: string) => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
};

const GenerateImageFal = ({
  prompt,
  setPrompt,
  imageSize,
  setImageSize,
  loading,
  handleSubmit,
}: GenerateImageFalProps) => {
  return (
    <div className="mx-auto mt-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="prompt">Prompt:</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            rows={4}
            placeholder="Enter your image prompt..."
          />
        </div>
        <div>
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select value={imageSize} onValueChange={setImageSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select image size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">1:1 (Square)</SelectItem>
              <SelectItem value="landscape_4_3">4:3 (Standard)</SelectItem>
              <SelectItem value="landscape_16_9">16:9 (Widescreen)</SelectItem>
              <SelectItem value="portrait_16_9">9:16 (Portrait)</SelectItem>
              <SelectItem value="portrait_4_3">3:4 (Vertical)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Image"}
        </Button>
      </form>
    </div>
  );
};

export default GenerateImageFal;
