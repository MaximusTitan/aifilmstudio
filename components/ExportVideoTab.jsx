"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg"; // Ensure FFmpeg is imported correctly

export function ExportVideoTab({
  generatedVideo,
  narrationAudios,
  onMergeComplete,
  onRetryVideo,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadLink, setDownloadLink] = useState(null);
  const [error, setError] = useState(null);
  const [ffmpeg, setFFmpeg] = useState(null);
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [isCommandRunning, setIsCommandRunning] = useState(false); // Add flag for command execution

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
    if (isCommandRunning) return; // Prevent multiple commands
    setIsCommandRunning(true); // Set flag when command starts

    if (!ffmpeg || !isFFmpegLoaded || generatedVideo.length === 0) {
      setError("Please ensure all videos are loaded");
      setIsCommandRunning(false); // Reset flag on early exit
      return;
    }

    if (!narrationAudios || narrationAudios.length !== generatedVideo.length) {
      setError("Mismatch between videos and narration audios.");
      setIsCommandRunning(false); // Reset flag on early exit
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      const { fetchFile } = window;

      // Step 1: Merge each video with its respective audio
      const mergedVideoPromises = generatedVideo.map(async (video, index) => {
        if (video.error) {
          throw new Error(`Video ${index + 1} has an error: ${video.error}`);
        }

        // Fetch and write video file
        const videoResponse = await fetch(
          `/api/proxy-video?url=${encodeURIComponent(video.url)}`
        );
        const videoBlob = await videoResponse.blob();
        const videoFile = new File([videoBlob], `video${index}.mp4`, {
          type: "video/mp4",
        });
        const videoData = await fetchFile(videoFile);
        ffmpeg.FS("writeFile", `video${index}.mp4`, videoData);

        // Fetch and write audio file
        const audioResponse = await fetch(narrationAudios[index]); // Blob URL
        const audioBlob = await audioResponse.blob();
        const audioFile = new File([audioBlob], `narration${index}.mp3`, {
          type: "audio/mpeg",
        });
        const audioData = await fetchFile(audioFile);
        ffmpeg.FS("writeFile", `narration${index}.mp3`, audioData);

        // Merge video with audio
        await ffmpeg.run(
          "-i",
          `video${index}.mp4`,
          "-i",
          `narration${index}.mp3`,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          `merged${index}.mp4`
        );

        return `merged${index}.mp4`;
      });

      const mergedVideos = await Promise.all(mergedVideoPromises);

      // Step 2: Concatenate all merged videos into the final output
      const fileList = mergedVideos
        .map((mergedVideo) => `file '${mergedVideo}'`)
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
        "final_output.mp4"
      );

      // Read the final output file and create download link
      const data = ffmpeg.FS("readFile", "final_output.mp4");
      const videoBlobFinal = new Blob([data.buffer], { type: "video/mp4" });
      const mergedVideoUrl = URL.createObjectURL(videoBlobFinal);
      setDownloadLink(mergedVideoUrl);

      if (onMergeComplete) {
        onMergeComplete(mergedVideoUrl); // Notify parent component
      }
    } catch (error) {
      console.error("Error processing videos:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process videos. Please try again."
      );
    } finally {
      setIsCommandRunning(false); // Reset flag after command completes
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {generatedVideo.length > 0 ? (
          <>
            {!downloadLink && (
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={handleExport}
                  disabled={isLoading || !isFFmpegLoaded || isCommandRunning} // Disable when command is running
                  className="w-auto gap-2"
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
              </div>
            )}
            {downloadLink && (
              <>
                <div className="mt-4 flex justify-center">
                  <div
                    style={{ width: "640px", height: "360px" }}
                    className="rounded-lg overflow-hidden border"
                  >
                    <video
                      src={downloadLink}
                      controls
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button asChild>
                    <a href={downloadLink} download="final-video.mp4">
                      Download Video
                    </a>
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <p className="text-gray-500">No videos available to export</p>
        )}

        {/* Handle cases where merging is needed */}
        {!downloadLink &&
          generatedVideo.some((video) => video.error) && ( // Access video.error safely
            <div className="flex flex-col items-center justify-center">
              <p className="text-red-500">
                One or more videos failed to generate.
              </p>
              <Button onClick={onRetryVideo} className="mt-2">
                Retry
              </Button>
            </div>
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
