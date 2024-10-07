import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image, Video } from "lucide-react";
import ImageToVideoTab from "./ImageToVideoTab"; // Import the ImageToVideoTab component
import { useEffect, useState } from "react";
import { getVideoProvider } from "@/app/actions";
import ImageToVideoRunway from "./ImageToVideoRunway";

type ContentTabsProps = {
  activeTab: "image" | "video" | "image-to-video";
  setActiveTab: (tab: "image" | "video" | "image-to-video") => void;
  selectedImage: string | null;
  setSelectedImage: (url: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleImageToVideo: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  videoProvider: string | null;
};

export default function ContentTabs({
  activeTab,
  setActiveTab,
  selectedImage,
  setSelectedImage,
  prompt,
  setPrompt,
  handleImageToVideo,
  loading,
  setLoading,
}: ContentTabsProps) {
  const [videoProvider, setVideoProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState<string | null>(null); // To hold error messages

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const videoProviderResult = await getVideoProvider();
        setVideoProvider(videoProviderResult);
      } catch (err) {
        console.error("Error fetching providers:", err);
        setError("Failed to load providers. Please try again.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  if (loadingProviders) {
    return <div>Loading...</div>; // Keep this loading state while fetching providers
  }

  if (error) {
    return <div className="text-red-500">{error}</div>; // Show error if fetching fails
  }

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "image" | "video" | "image-to-video")
        }
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image">
            <Image className="mr-2 h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="mr-2 h-4 w-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="image-to-video">
            <Image className="mr-2 h-4 w-4" />
            to
            <Video className="ml-2 h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === "image-to-video" && (
        <>
          {videoProvider === "luma" && (
            <ImageToVideoTab
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              prompt={prompt}
              setPrompt={setPrompt}
              handleImageToVideo={handleImageToVideo}
              loading={loading}
              videoProvider={videoProvider}
            />
          )}
          {videoProvider === "runway" && (
            <ImageToVideoRunway
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              prompt={prompt}
              setPrompt={setPrompt}
              loading={loading}
              handleImageToVideo={handleImageToVideo}
              setLoading={setLoading} // Pass the actual setLoading function
              videoProvider={videoProvider}
            />
          )}
        </>
      )}
    </div>
  );
}
