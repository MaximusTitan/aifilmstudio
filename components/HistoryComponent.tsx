import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Card } from "@/components/ui/card";

type StoryGeneration = {
  id: number;
  user_email: string;
  prompt: string;
  story: string;
  image_prompts: string[];
  created_at: string;
  fullprompt: string;
  narration_lines: string[];
  generated_audio: string[];
  generated_images: string[];
  generated_videos: string[];
  final_video_url?: string;
};

const supabase = createClient();

function cleanPrompt(prompt: string): string {
  const prefix =
    "Write a small and captivating story based on the following idea: ";
  const suffixPattern = / - \d{2}\/\d{2}\/\d{4}$/;
  const middleSentence =
    "Provide the story in a narrative format, ensuring the story and characters are cinematic and immersive. It should be 1100 characters.";

  let cleaned = prompt;
  if (cleaned.startsWith(prefix)) {
    cleaned = cleaned.substring(prefix.length);
  }
  cleaned = cleaned.replace(middleSentence, "");
  cleaned = cleaned.replace(suffixPattern, "");
  return cleaned.trim();
}

function parseArrayField(field: any): string[] {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return field
        .replace(/^\{|\}$/g, "")
        .split(",")
        .map((item) => item.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"'));
    }
  }
  return [];
}

const MediaGridView = ({
  items,
  type,
}: {
  items: string[];
  type: "audio" | "image" | "video";
}) => {
  if (!items || items.length === 0) {
    return <p className="text-gray-500">No {type} content available.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((url, index) => (
        <Card key={index} className="p-4">
          {type === "audio" && (
            <audio controls className="w-full">
              <source src={url} type="audio/mp3" />
              Your browser does not support the audio element.
            </audio>
          )}
          {type === "image" && (
            <img
              src={url}
              alt={`Generated image ${index + 1}`}
              className="w-full h-48 object-cover rounded"
            />
          )}
          {type === "video" && (
            <video controls className="w-full h-48 object-cover rounded">
              <source src={url} type="video/mp4" />
              Your browser does not support the video element.
            </video>
          )}
        </Card>
      ))}
    </div>
  );
};

type HistoryComponentProps = {
  onLoadStory: (story: StoryGeneration) => void;
};

export function HistoryComponent({ onLoadStory }: HistoryComponentProps) {
  const [history, setHistory] = useState<StoryGeneration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<StoryGeneration | null>(
    null
  );

  useEffect(() => {
    const fetchUserEmail = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        setError("Failed to fetch user information.");
      } else if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (!userEmail) return;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("story_generations")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("user_email", userEmail);

      if (error) {
        setError("Failed to load history.");
      } else {
        const parsedData = (data as StoryGeneration[]).map((item) => ({
          ...item,
          generated_audio: parseArrayField(item.generated_audio),
          generated_images: parseArrayField(item.generated_images),
          generated_videos: parseArrayField(item.generated_videos),
          image_prompts: parseArrayField(item.image_prompts),
          narration_lines: parseArrayField(item.narration_lines),
        }));
        setHistory(parsedData || []);
      }
    };
    fetchHistory();
  }, [userEmail]);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">History</h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {cleanPrompt(item.prompt)}
              </h3>
              <span className="text-gray-500">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedItem(item);
                  setIsDialogOpen(true);
                }}
              >
                View Details
              </Button>
              <Button variant="outline" onClick={() => onLoadStory(item)}>
                Load
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedItem && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-full max-w-4xl h-full max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <h2 className="text-2xl font-semibold">
                {cleanPrompt(selectedItem.prompt)}
              </h2>
            </DialogHeader>
            <Tabs defaultValue="story" className="mt-4">
              <TabsList className="flex space-x-1 flex-wrap">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="imageprompts">Image Prompts</TabsTrigger>
                <TabsTrigger value="narrations">Narrations</TabsTrigger>
                <TabsTrigger value="generatedaudio">
                  Generated Audio
                </TabsTrigger>
                <TabsTrigger value="generatedimages">
                  Generated Images
                </TabsTrigger>
                <TabsTrigger value="generatedvideos">
                  Generated Videos
                </TabsTrigger>
              </TabsList>
              <div className="mt-4 h-[60vh] overflow-auto p-4">
                <TabsContent value="story">
                  <p className="whitespace-pre-wrap">{selectedItem.story}</p>
                </TabsContent>
                <TabsContent value="imageprompts">
                  <div className="space-y-2">
                    {selectedItem.image_prompts.map((prompt, index) => (
                      <Card key={index} className="p-4">
                        <p>{prompt}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="narrations">
                  <div className="space-y-2">
                    {selectedItem.narration_lines.map((narration, index) => (
                      <Card key={index} className="p-4">
                        <p>{narration}</p>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="generatedaudio">
                  <MediaGridView
                    items={selectedItem.generated_audio}
                    type="audio"
                  />
                </TabsContent>
                <TabsContent value="generatedimages">
                  <MediaGridView
                    items={selectedItem.generated_images}
                    type="image"
                  />
                </TabsContent>
                <TabsContent value="generatedvideos">
                  <MediaGridView
                    items={selectedItem.generated_videos}
                    type="video"
                  />
                </TabsContent>
              </div>
            </Tabs>
            <div className="mt-4 flex justify-end">
              <Button
                variant="destructive"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default HistoryComponent;
