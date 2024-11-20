
interface ExportVideoTabProps {
  videoUrls: string[];
  narrationAudios: string[];
  onMergeComplete: (url: string) => void;
  onRetryVideo: () => void; // Ensure this prop is required
}