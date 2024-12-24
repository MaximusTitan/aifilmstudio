import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, Image, Video, Maximize2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

type GenerationListProps = {
  generations: Array<{
    id: string;
    type: "image" | "video" | "image-to-video";
    url: string;
    prompt: string;
    created_at?: string;
  }>;
  updateSelectedImage: (url: string) => void;
  handleDownload: (url: string, filename: string) => void;
};

export default function GenerationList({
  generations,
  updateSelectedImage,
  handleDownload,
}: GenerationListProps) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(
    new Set()
  );
  const itemsPerPage = 6; // Show 6 items per page (2 rows x 3 columns)

  const handleFullscreen = (url: string) => {
    setFullscreenImage(url);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Calculate pagination values
  const totalPages = Math.ceil(generations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = generations.slice(startIndex, endIndex);

  // Handle page navigation
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page if not in range
    if (startPage > 1) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => goToPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add last page if not in range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => goToPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const togglePrompt = (id: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPrompts(newExpanded);
  };

  return (
    <div className="relative">
      {generations.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Your Generations</h2>
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, generations.length)}{" "}
              of {generations.length} items
            </p>
          </div>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please note: Generations are automatically deleted after 7 days.
              Download your favorites to keep them permanently.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((gen) => (
              <div key={gen.id} className="border rounded-lg p-4 shadow-md">
                <div className="relative">
                  {gen.type === "image" && (
                    <img
                      src={gen.url}
                      alt="Generated"
                      className="rounded-lg shadow-lg"
                    />
                  )}
                  {(gen.type === "video" || gen.type === "image-to-video") && (
                    <video controls className="rounded-lg shadow-lg">
                      <source src={gen.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2 justify-between">
                  <Button
                    onClick={() => {
                      const extension = gen.type === "image" ? "jpg" : "mp4";
                      handleDownload(
                        `${gen.url}?download=${gen.type}-${gen.id}.${extension}`,
                        `${gen.type}-${gen.id}.${extension}`
                      );
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {fullscreenImage === gen.url && (
                    <Button
                      onClick={closeFullscreen}
                      size="sm"
                      variant="outline"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Close
                    </Button>
                  )}

                  {gen.type === "image" && (
                    <>
                      <Button
                        onClick={() => updateSelectedImage(gen.url)}
                        size="sm"
                        variant="outline"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        to
                        <Video className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        onClick={() => handleFullscreen(gen.url)}
                        size="sm"
                        variant="outline"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-sm mt-2">
                  Prompt:{" "}
                  {gen.prompt.length > 100 && !expandedPrompts.has(gen.id) ? (
                    <>
                      {gen.prompt.slice(0, 100)}...{" "}
                      <button
                        onClick={() => togglePrompt(gen.id)}
                        className="text-neutral-500 hover:text-neutral-700 font-bold"
                      >
                        more
                      </button>
                    </>
                  ) : (
                    <>
                      {gen.prompt}{" "}
                      {gen.prompt.length > 100 && (
                        <button
                          onClick={() => togglePrompt(gen.id)}
                          className="text-neutral-500 hover:text-neutral-700 font-bold"
                        >
                          less
                        </button>
                      )}
                    </>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(gen.created_at ?? "").toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goToPage(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => goToPage(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {fullscreenImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
              onClick={closeFullscreen}
            >
              <Button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 hover:bg-white/20"
                size="icon"
                variant="ghost"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
              <img
                src={fullscreenImage}
                alt="Fullscreen view"
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
