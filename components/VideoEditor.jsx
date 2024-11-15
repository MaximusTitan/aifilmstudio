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
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Plus, X, Upload, Film } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const VideoEditor = () => {
  const [videoUrls, setVideoUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [activePreview, setActivePreview] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [videoDurations, setVideoDurations] = useState({});
  const timelineRef = useRef(null);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");

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

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
        const ffmpegInstance = createFFmpeg({
          log: true,
          corePath: "/ffmpeg-core.js",
          progress: ({ ratio }) => setProgress(Math.round(ratio * 100)),
        });

        window.createFFmpeg = createFFmpeg;
        window.fetchFile = fetchFile;

        await ffmpegInstance.load();
        setFFmpeg(ffmpegInstance);
        setIsFFmpegLoaded(true);
      } catch (err) {
        console.error("Error loading FFmpeg:", err);
        setError("Failed to load FFmpeg. Please try again later.");
        setIsFFmpegLoaded(false);
      }
    };
    loadFFmpeg();
  }, []);

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.key === "+" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        addUrlField();
      }
      if (e.key === "Delete" && selectedIndex !== null) {
        e.preventDefault();
        removeUrlField(selectedIndex);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [selectedIndex]);

  const handleUrlChange = (index, event) => {
    const updatedUrls = [...videoUrls];
    updatedUrls[index] = event.target.value;
    setVideoUrls(updatedUrls);
  };

  const addUrlField = () => {
    setShowUrlDialog(true);
  };

  const handleUrlSubmit = () => {
    if (newVideoUrl && isValidVideoUrl(newVideoUrl)) {
      if (videoUrls.length === 0) {
        setVideoUrls([newVideoUrl]);
      } else {
        setVideoUrls([...videoUrls, newVideoUrl]);
      }
      setNewVideoUrl("");
      setShowUrlDialog(false);
      setTimeout(() => {
        timelineRef.current?.scrollTo({
          left: timelineRef.current.scrollWidth,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  const removeUrlField = (index) => {
    setVideoUrls(videoUrls.filter((_, idx) => idx !== index));
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setActivePreview(null);
    }
  };

  const handleVideoLoad = async (url, index) => {
    try {
      const video = document.createElement("video");
      video.src = getProxiedUrl(url);
      await new Promise((resolve) => {
        video.addEventListener("loadedmetadata", () => {
          setVideoDurations((prev) => ({
            ...prev,
            [index]: video.duration,
          }));
          resolve();
        });
      });
    } catch (error) {
      console.error("Error loading video duration:", error);
    }
  };

  const handleStitchVideos = async () => {
    if (!ffmpeg || !isFFmpegLoaded) {
      setError("FFmpeg not loaded");
      return;
    }

    const validUrls = videoUrls.filter((url) => url && isValidVideoUrl(url));
    if (validUrls.length === 0) {
      setError("Please add at least one valid video URL");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      const { fetchFile } = window;
      const downloadedVideos = await Promise.all(
        validUrls.map(async (url, index) => {
          const response = await fetch(getProxiedUrl(url));
          const blob = await response.blob();
          const file = new File([blob], `video${index}.mp4`, {
            type: "video/mp4",
          });
          return fetchFile(file);
        })
      );

      downloadedVideos.forEach((file, index) => {
        ffmpeg.FS("writeFile", `video${index}.mp4`, file);
      });

      const fileList = downloadedVideos
        .map((_, index) => `file 'video${index}.mp4'`)
        .join("\n");

      ffmpeg.FS(
        "writeFile",
        "filelist.txt",
        new TextEncoder().encode(fileList)
      );

      await ffmpeg.run(
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        "filelist.txt",
        "-c",
        "copy",
        "output.mp4"
      );

      const data = ffmpeg.FS("readFile", "output.mp4");
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      const videoUrl = URL.createObjectURL(videoBlob);

      setDownloadLink(videoUrl);
    } catch (error) {
      console.error("Error processing videos:", error);
      setError("Failed to process videos. Please try again.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const handleVideoSelect = (index) => {
    setSelectedIndex(index);
    setActivePreview(videoUrls[index]);
    if (videoUrls[index] && isValidVideoUrl(videoUrls[index])) {
      handleVideoLoad(videoUrls[index], index);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1920px] mx-auto flex gap-6">
        {/* Left Panel */}
        <div className="w-[300px] flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Film className="h-6 w-6" />
                Video Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={addUrlField}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Video
                      <kbd className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                        ⌘+
                      </kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add a new video to timeline</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="mt-6">
                <CardHeader className="px-0">
                  <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  {selectedIndex !== null ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Video URL</label>
                        <Input
                          value={videoUrls[selectedIndex]}
                          onChange={(e) => handleUrlChange(selectedIndex, e)}
                          placeholder="Enter video URL"
                        />
                        {videoDurations[selectedIndex] && (
                          <p className="text-sm text-muted-foreground">
                            Duration:{" "}
                            {formatDuration(videoDurations[selectedIndex])}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Select a video to view its properties
                    </div>
                  )}
                </CardContent>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleStitchVideos}
                    disabled={
                      isLoading || !isFFmpegLoaded || videoUrls.length < 1
                    }
                    className="w-full gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Upload className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Export Video
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Merge all videos into one</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Video Preview */}
          <Card className="flex-grow">
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border min-h-[600px] min-w-[800px]">
                {activePreview ? (
                  <video
                    key={activePreview}
                    src={getProxiedUrl(activePreview)}
                    controls
                    className="w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      if (selectedIndex !== null) {
                        handleVideoLoad(activePreview, selectedIndex);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center min-w-96">
                      <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select a video to preview</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timeline</CardTitle>
              <div className="text-sm text-muted-foreground">
                {videoUrls.length} video{videoUrls.length !== 1 ? "s" : ""}
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={timelineRef}
                className="flex gap-4 overflow-x-auto pb-4 min-h-[160px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {videoUrls.map((url, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleVideoSelect(index)}
                          className={`relative flex-shrink-0 w-[200px] rounded-lg border-2 transition-all cursor-pointer
                            ${selectedIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50"}
                          `}
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
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeUrlField(index);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
                              <div className="text-center">
                                <Upload className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <span className="text-xs">Drop video here</span>
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-sm font-medium truncate px-2">
                            Video {index + 1}
                          </div>
                          {videoDurations[index] && (
                            <div className="text-xs text-muted-foreground px-2">
                              {formatDuration(videoDurations[index])}
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {url
                          ? `Video ${index + 1} - ${formatDuration(videoDurations[index])}`
                          : "Add a video"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs and Overlays */}
      <Dialog open={!!downloadLink} onOpenChange={() => setDownloadLink(null)}>
        <DialogContent>
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

      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Video URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Enter video URL"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUrlSubmit();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUrlDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit}>Add Video</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
            <Card className="w-[300px]">
              <CardContent className="py-6">
                <div className="space-y-4">
                  <Progress value={progress} />
                  <p className="text-center text-sm text-muted-foreground">
                    Processing videos... {progress}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default VideoEditor;
