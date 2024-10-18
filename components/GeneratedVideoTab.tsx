import { Card, CardContent } from "@/components/ui/card";

type GeneratedVideoTabProps = {
  generatedVideo?: string;
};

export function GeneratedVideoTab({ generatedVideo }: GeneratedVideoTabProps) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {generatedVideo && generatedVideo.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {generatedVideo.split(", ").map((videoUrl, index) => (
              <video
                key={index}
                controls
                src={videoUrl}
                className="w-full h-48 rounded-md"
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No video generated yet!</p>
        )}
      </CardContent>
    </Card>
  );
}
