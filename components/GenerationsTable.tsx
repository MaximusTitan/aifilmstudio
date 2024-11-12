import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, ImageIcon, Video, Play } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface User {
  id: string;
  email: string;
  verified: boolean;
  image_credits: number;
  video_credits: number;
  created_at: string;
}

interface Generation {
  id: string;
  parameters: {
    prompt: string;
    [key: string]: any;
  };
  created_at: string;
  user_email: string;
  result_path: URL;
  user_id: string;
  credits_used: number;
  type: "image" | "video";
}

interface GenerationsTableProps {
  generations: Generation[];
}

export function GenerationsTable({ generations }: GenerationsTableProps) {
  const [searchGenerationTerm, setSearchGenerationTerm] = useState("");
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedGenId, setExpandedGenId] = useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState<
    "users" | "generations" | "settings"
  >("users");

  const totalPages = Math.ceil(filteredGenerations.length / itemsPerPage);

  useEffect(() => {
    const filtered = generations.filter(
      (gen) =>
        gen.user_email
          .toLowerCase()
          .includes(searchGenerationTerm.toLowerCase()) ||
        gen.parameters.prompt
          .toLowerCase()
          .includes(searchGenerationTerm.toLowerCase())
    );
    setFilteredGenerations(filtered);
    setCurrentPage(1);
  }, [searchGenerationTerm, generations]);

  const handleMouseEnter = (path: string) => {
    setHoveredPath(path);
  };

  const handleMouseLeave = () => {
    setHoveredPath(null);
  };

  const toggleExpand = (id: string | null) => {
    setExpandedGenId(id);
  };

  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredGenerations.slice(startIndex, endIndex);
  };

  const getVisiblePages = () => {
    const delta = 2; // This will show 2 numbers on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1 md:max-w-xs">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input
          placeholder="Search generations..."
          value={searchGenerationTerm}
          onChange={(e) => setSearchGenerationTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[300px]">Prompt</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              <TableHead className="min-w-[150px]">Result</TableHead>
              <TableHead className="min-w-[150px]">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentItems().map((gen) => (
              <TableRow key={gen.id}>
                <TableCell>{gen.user_email}</TableCell>
                <TableCell>
                  {gen.parameters.prompt.length > 150 ? (
                    <span className="inline-table">
                      {expandedGenId === gen.id ? (
                        <>
                          {gen.parameters.prompt}
                          <Button
                            onClick={() => toggleExpand(null)}
                            variant="link"
                            className="px-2 h-auto"
                          >
                            less
                          </Button>
                        </>
                      ) : (
                        <>
                          {gen.parameters.prompt.slice(0, 150)}...
                          <Button
                            onClick={() => toggleExpand(gen.id)}
                            variant="link"
                            className="px-2 h-auto"
                          >
                            more
                          </Button>
                        </>
                      )}
                    </span>
                  ) : (
                    gen.parameters.prompt
                  )}
                </TableCell>

                <TableCell>
                  {gen.type === "image" ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                </TableCell>

                <TableCell>
                  <div
                    className="relative"
                    onMouseEnter={() =>
                      handleMouseEnter(gen.result_path.toString())
                    }
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="relative inline-block cursor-pointer">
                      {gen.type === "video" ? (
                        <div className="relative flex items-center justify-center">
                          <video className="max-w-full h-auto min-w-[100px] min-h-[80px]">
                            <source
                              src={gen.result_path.toString()}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <img
                            src={gen.result_path.toString()}
                            className="max-w-full h-auto min-w-[100px] min-h-[80px]"
                            alt="Generated content"
                          />
                        </div>
                      )}
                    </div>

                    {hoveredPath === gen.result_path.toString() && (
                      <div
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out scale-95 hover:scale-100 bg-white shadow-lg p-0 rounded-lg z-50"
                        style={{
                          width: "min(800px, 90vw)",
                          height: "auto",
                          maxHeight: "80vh",
                          overflow: "hidden",
                        }}
                      >
                        {gen.type === "video" ? (
                          <video
                            className="w-full h-auto rounded-lg"
                            autoPlay
                            controls
                          >
                            <source src={hoveredPath || ""} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={hoveredPath || ""}
                            className="w-full h-auto rounded-lg"
                            alt="Generated content"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {new Date(gen.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              />
            </PaginationItem>
          )}
          {getVisiblePages().map((page, index) => (
            <PaginationItem key={index}>
              {typeof page === "number" ? (
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              ) : (
                <PaginationLink aria-disabled="true">{page}</PaginationLink>
              )}
            </PaginationItem>
          ))}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default GenerationsTable;
