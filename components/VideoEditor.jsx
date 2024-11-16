"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const VideoStitcher = () => {
  const [videoUrls, setVideoUrls] = useState([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [activePreview, setActivePreview] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const timelineRef = useRef(null);
  const { toast } = useToast();
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [ffmpegLogs, setFFmpegLogs] = useState([]);
  const [ttsText, setTtsText] = useState("");
  const [generatedAudioData, setGeneratedAudioData] = useState(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Predefined list of video URLs
  const predefinedVideos = [
    "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/generated_video_d1ee240b-14d9-401e-9d29-d62a8dbfbb97_1731718680443.mp4",
    "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/generated_video_28865fe9-db9a-49ff-8e66-98a561e46842_1731718657164.mp4",
    "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/generated_video_86f2b051-cbc0-4404-8c0a-1a11ca2f5f70_1731717926911.mp4",
    "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/generated_video_86f2b051-cbc0-4404-8c0a-1a11ca2f5f70_1731717911503.mp4",
    // ...add the rest of the URLs...
  ];

  const isValidVideoUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getProxiedUrl = (url) => {
    if (!url) return "";
    return `/api/proxy-video?url=${encodeURIComponent(url)}`;
  };

  const showError = (message) => {
    toast({
      variant: "destructive",
      title: "Error",
      description: message,
    });
  };

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = createFFmpeg({
          log: true,
          corePath: "/ffmpeg-core.js",
        });

        ffmpegInstance.setLogger(({ type, message }) => {
          setFFmpegLogs((prevLogs) => [...prevLogs, `[${type}] ${message}`]);
        });

        await ffmpegInstance.load();
        setFFmpeg(ffmpegInstance);
        setIsFFmpegLoaded(true);
      } catch (err) {
        console.error("Error loading FFmpeg:", err);
        showError("Failed to load FFmpeg. Please try again later.");
        setIsFFmpegLoaded(false);
      }
    };
    loadFFmpeg();
  }, []);

  const handleUrlChange = (index, event) => {
    const updatedUrls = [...videoUrls];
    updatedUrls[index] = event.target.value;
    setVideoUrls(updatedUrls);
  };

  const addUrlField = () => setVideoUrls([...videoUrls, ""]);
  const removeUrlField = (index) =>
    setVideoUrls(videoUrls.filter((_, idx) => idx !== index));

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerateAudio = async () => {
    if (!ttsText.trim()) {
      showError("Please enter text to generate audio.");
      return;
    }

    setIsGeneratingAudio(true);

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: ttsText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioArrayBuffer], {
        type: "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(audioBlob);

      setGeneratedAudioData({ blob: audioBlob, url: audioUrl });
      toast({ title: "Audio generated successfully." });
    } catch (e) {
      console.error("Error generating audio:", e);
      showError(`Error generating audio: ${e.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleStitchVideos = async () => {
    if (!ffmpeg || !isFFmpegLoaded) {
      showError("FFmpeg not loaded");
      return;
    }

    setIsLoading(true);
    try {
      // Validate inputs
      const validUrls = videoUrls.filter((url) => url && isValidVideoUrl(url));
      if (validUrls.length === 0) {
        throw new Error("No valid video URLs provided");
      }

      // Download and write videos
      const downloadedVideos = await Promise.all(
        validUrls.map(async (url, index) => {
          try {
            const response = await fetch(getProxiedUrl(url));
            if (!response.ok)
              throw new Error(`Failed to fetch video ${index + 1}`);
            const blob = await response.blob();
            const file = new File([blob], `video${index}.mp4`, {
              type: "video/mp4",
            });
            const fileData = await fetchFile(file); // Use fetchFile directly
            return { file: fileData, index };
          } catch (e) {
            throw new Error(
              `Error processing video ${index + 1}: ${e.message}`
            );
          }
        })
      );

      // Clear any existing files
      try {
        const files = ffmpeg.FS("readdir", "/");
        files.forEach((file) => {
          if (file !== "." && file !== "..") {
            ffmpeg.FS("unlink", file);
          }
        });
      } catch (e) {
        console.warn("Error cleaning up filesystem:", e);
      }

      // Write videos to FFmpeg filesystem
      downloadedVideos.forEach(({ file, index }) => {
        ffmpeg.FS("writeFile", `video${index}.mp4`, file);
      });

      // Write audio if exists
      let audioFileName = null;
      if (generatedAudioData) {
        try {
          const audioData = await fetchFile(generatedAudioData.blob);
          audioFileName = "generated_audio.mp3";
          ffmpeg.FS("writeFile", audioFileName, audioData);
        } catch (e) {
          throw new Error(`Error processing generated audio: ${e.message}`);
        }
      }

      // Create concat file
      const fileList = downloadedVideos
        .map(({ index }) => `file 'video${index}.mp4'`)
        .join("\n");
      ffmpeg.FS(
        "writeFile",
        "filelist.txt",
        new TextEncoder().encode(fileList)
      );

      // Concatenate videos
      await ffmpeg.run(
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "filelist.txt",
        "-c",
        "copy",
        "temp_output.mp4"
      );

      // Verify temp output exists
      try {
        ffmpeg.FS("stat", "temp_output.mp4");
      } catch (e) {
        throw new Error("Failed to create temporary output file");
      }

      // Add audio if exists
      if (audioFileName) {
        await ffmpeg.run(
          "-i",
          "temp_output.mp4",
          "-i",
          audioFileName,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-shortest",
          "output.mp4"
        );
      } else {
        await ffmpeg.run("-i", "temp_output.mp4", "-c", "copy", "output.mp4");
      }

      // Verify final output exists
      let outputData;
      try {
        outputData = ffmpeg.FS("readFile", "output.mp4");
      } catch (e) {
        throw new Error("Failed to read output file");
      }

      const videoBlob = new Blob([outputData.buffer], { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(videoBlob);
      setDownloadLink(videoUrl);
    } catch (error) {
      console.error("Error processing videos:", error);
      console.log("FFmpeg Logs:", ffmpegLogs.join("\n")); // Log FFmpeg output
      showError(error.message || "Failed to process videos. Please try again.");
    } finally {
      // Cleanup
      try {
        const files = ffmpeg.FS("readdir", "/");
        files.forEach((file) => {
          if (file !== "." && file !== "..") {
            ffmpeg.FS("unlink", file);
          }
        });
      } catch (e) {
        console.warn("Error during cleanup:", e);
      }
      setIsLoading(false);
    }
  };

  const handleVideoSelect = (index) => {
    setSelectedIndex(index);
    setActivePreview(videoUrls[index]);
  };

  // Function to add a predefined video to the timeline
  const addPredefinedVideo = (url) => {
    setVideoUrls((prevUrls) => [...prevUrls, url]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <div className="w-64 p-4 overflow-y-auto border-r">
        <h2 className="text-lg font-semibold mb-4">Available Videos</h2>
        <div className="space-y-4">
          {predefinedVideos.map((url, index) => (
            <div
              key={index}
              className="cursor-pointer"
              onClick={() => addPredefinedVideo(url)}
            >
              <video
                src={getProxiedUrl(url)}
                className="h-16 rounded-lg"
                controls={false}
                muted
                loop
                playsInline
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <Card className="border-b rounded-none">
          <CardContent className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <CardTitle className="text-2xl">Video Editor</CardTitle>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={addUrlField}>
                Add Video
              </Button>
              <Button
                onClick={handleStitchVideos}
                disabled={isLoading || !isFFmpegLoaded}
              >
                {isLoading ? "Processing..." : "Export"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
          <Card className="col-span-8">
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {activePreview ? (
                  <video
                    key={activePreview}
                    src={getProxiedUrl(activePreview)}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Select a video to preview
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedIndex !== null && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Video URL
                    </label>
                    <Input
                      value={videoUrls[selectedIndex]}
                      onChange={(e) => handleUrlChange(selectedIndex, e)}
                      placeholder="Enter video URL"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Background Audio
                  </label>
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="cursor-pointer"
                  />
                  {audioUrl && (
                    <audio controls className="w-full mt-2">
                      <source src={audioUrl} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Text to Speech
                  </label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="Enter text to convert to speech"
                    className="w-full h-24 p-2 border rounded-md"
                  />

                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || !ttsText.trim()}
                    className="mt-2"
                  >
                    {isGeneratingAudio ? "Generating..." : "Generate Audio"}
                  </Button>

                  {generatedAudioData && (
                    <audio controls className="w-full mt-2">
                      <source src={generatedAudioData.url} type="audio/mpeg" />
                    </audio>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-12">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={timelineRef}
                className="flex gap-4 overflow-x-auto pb-4 min-h-[160px]"
              >
                {videoUrls.map((url, index) => (
                  <div
                    key={index}
                    onClick={() => handleVideoSelect(index)}
                    className={`relative flex-shrink-0 w-[200px] rounded-lg border-2 transition-all ${
                      selectedIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    {url && isValidVideoUrl(url) ? (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        <video
                          src={getProxiedUrl(url)}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUrlField(index);
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                        Drop video here
                      </div>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground truncate px-2">
                      Video {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={!!downloadLink}
          onOpenChange={() => setDownloadLink(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Complete</DialogTitle>
            </DialogHeader>
            <video
              src={downloadLink}
              controls
              className="w-full rounded-lg mb-4"
            />
            <div className="flex justify-end">
              <Button asChild>
                <a href={downloadLink} download="edited-video.mp4">
                  Download Video
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {!isFFmpegLoaded && !error && (
          <div className="fixed inset-0 bg-background/90 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Progress value={30} className="w-[60%] mx-auto" />
              <p className="text-xl">Loading Editor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoStitcher;
