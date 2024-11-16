"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";

export function ExportVideoTab({
  videoUrls,
  narrationAudio, // Receive narrationAudio
  onMergeComplete, // Receive callback
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);
  const [error, setError] = useState(null);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");
        const ffmpegInstance = createFFmpeg({
          log: true,
          corePath: "/ffmpeg-core.js",
          progress: ({ ratio }) => setProgress(Math.round(ratio * 100)),
        });

        await ffmpegInstance.load();
        window.createFFmpeg = createFFmpeg;
        window.fetchFile = fetchFile;
        setFFmpeg(ffmpegInstance);
        setIsFFmpegLoaded(true);
      } catch (err) {
        console.error("Error loading FFmpeg:", err);
        setError("Failed to load FFmpeg. Please try again later.");
      }
    };

    loadFFmpeg();
  }, []);

  const handleExport = async () => {
    if (!ffmpeg || !isFFmpegLoaded || videoUrls.length === 0) {
      setError("Please ensure all videos are loaded");
      return;
    }

    if (!narrationAudio) {
      // Check narrationAudio
      setError("No narration audio available to merge.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      const { fetchFile } = window;

      // Download and write all videos to FFmpeg's file system
      const downloadedVideos = await Promise.all(
        videoUrls.map(async (url, index) => {
          const response = await fetch(
            `/api/proxy-video?url=${encodeURIComponent(url)}`
          );
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

      // Write the narration audio to FFmpeg's file system
      const audioResponse = await fetch(narrationAudio);
      const audioBlob = await audioResponse.blob();
      const audioFile = new File([audioBlob], `narration.mp3`, {
        type: "audio/mpeg",
      });
      const audioData = await fetchFile(audioFile);
      ffmpeg.FS("writeFile", "narration.mp3", audioData);

      // Create filelist for concatenation
      const fileList = downloadedVideos
        .map((_, index) => `file 'video${index}.mp4'`)
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
        "output.mp4"
      );

      // Merge audio with the concatenated video
      await ffmpeg.run(
        "-i",
        "output.mp4",
        "-i",
        "narration.mp3",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-strict",
        "experimental",
        "final_output.mp4"
      );

      // Read the final output file and create download link
      const data = ffmpeg.FS("readFile", "final_output.mp4");
      const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
      const mergedVideoUrl = URL.createObjectURL(videoBlob);
      setDownloadLink(mergedVideoUrl);

      if (onMergeComplete) {
        onMergeComplete(mergedVideoUrl); // Notify parent component
      }
    } catch (error) {
      console.error("Error processing videos:", error);
      setError("Failed to process videos. Please try again.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {videoUrls.length > 0 ? (
          <>
            <Button
              onClick={handleExport}
              disabled={isLoading || !isFFmpegLoaded}
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
                  Merge Videos
                </>
              )}
            </Button>

            {downloadLink && (
              <>
                <div className="mt-4 rounded-lg overflow-hidden border">
                  <video
                    src={downloadLink}
                    controls
                    className="w-full aspect-video"
                  />
                </div>
                <Button asChild className="w-full">
                  <a href={downloadLink} download="final-video.mp4">
                    Download Video
                  </a>
                </Button>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-500">No videos available to export</p>
        )}

        {isLoading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Processing videos... {progress}%
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
