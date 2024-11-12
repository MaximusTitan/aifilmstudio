"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Image as ImageIcon,
  Video,
  Play,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AdminSettings from "@/app/admin/AdminSettings";

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

export default function AdminUsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [searchGenerationTerm, setSearchGenerationTerm] = useState("");
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>(
    []
  );
  const [currentGenerationPage, setCurrentGenerationPage] = useState(1);
  const [currentGenPage, setCurrentGenPage] = useState(1);
  const [searchGenTerm, setSearchGenTerm] = useState("");
  const generationsPerPage = 10;
  const [activeTab, setActiveTab] = useState<
    "users" | "generations" | "settings"
  >("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const handleMouseEnter = (path: string) => {
    setHoveredPath(path);
  };

  const handleMouseLeave = () => {
    setHoveredPath(null);
    setModalPosition(null);
  };

  const [creditInputs, setCreditInputs] = useState<{
    [key: string]: { image_credits: number; video_credits: number };
  }>({});

  const [userConsumedCredits, setUserConsumedCredits] = useState<{
    [key: string]: { image_credits_used: number; video_credits_used: number };
  }>({});

  const [expandedGenId, setExpandedGenId] = useState<string | null>(null);
  const toggleExpand = (id: string | null) => {
    setExpandedGenId(id);
  };

  // Add effect for filtering generations
  useEffect(() => {
    const filtered = generations.filter(
      (gen) =>
        gen.user_email.toLowerCase().includes(searchGenTerm.toLowerCase()) ||
        gen.parameters.prompt
          .toLowerCase()
          .includes(searchGenTerm.toLowerCase())
    );
    setFilteredGenerations(filtered);
    setCurrentGenPage(1); // Reset to first page when searching
  }, [searchGenTerm, generations]);

  // Pagination calculations
  const genItemsPerPage = 10;
  const totalGenPages = Math.ceil(filteredGenerations.length / genItemsPerPage);
  const startGenIndex = (currentGenPage - 1) * genItemsPerPage;
  const endGenIndex = startGenIndex + genItemsPerPage;
  const currentGenerations = filteredGenerations.slice(
    startGenIndex,
    endGenIndex
  );

  // Improved page numbers generation
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Show max 5 page numbers
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(1, currentPage - halfVisible);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // Adjust start if end is maxed out
    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users]);

  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return activeTab === "users"
      ? filteredUsers.slice(startIndex, endIndex)
      : generations.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(
    (activeTab === "users" ? filteredUsers.length : generations.length) /
      itemsPerPage
  );

  useEffect(() => {
    const checkUserAuthentication = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
      }
    };

    checkUserAuthentication();
  }, [supabase, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) {
        console.error("Error fetching users:", error);
      } else {
        const sortedUsers = (data ?? []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setUsers(sortedUsers);

        const initialCredits = sortedUsers.reduce(
          (acc, user) => {
            acc[user.id] = {
              image_credits: 0,
              video_credits: 0,
            };
            return acc;
          },
          {} as {
            [key: string]: { image_credits: number; video_credits: number };
          }
        );
        setCreditInputs(initialCredits);
      }
    };

    const fetchGenerations = async () => {
      const { data, error } = await supabase.from("generations").select("*");
      if (error) {
        console.error("Error fetching generations:", error);
      } else {
        const sortedGenerations = (data ?? []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setGenerations(sortedGenerations);

        const consumedCredits = sortedGenerations.reduce(
          (acc, gen) => {
            const userId = gen.user_id;
            if (!acc[userId]) {
              acc[userId] = { image_credits_used: 0, video_credits_used: 0 };
            }
            if (gen.type === "image") {
              acc[userId].image_credits_used += gen.credits_used;
            } else if (gen.type === "video") {
              acc[userId].video_credits_used += gen.credits_used;
            }
            return acc;
          },
          {} as {
            [key: string]: {
              image_credits_used: number;
              video_credits_used: number;
            };
          }
        );

        setUserConsumedCredits(consumedCredits);
      }
    };

    fetchUsers();
    fetchGenerations();
  }, [supabase]);

  const toggleVerified = async (userId: string, isVerified: boolean) => {
    const { error } = await supabase
      .from("users")
      .update({ verified: !isVerified })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user verification:", error);
    } else {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, verified: !isVerified } : user
        )
      );
    }
  };

  const updateCredits = async (
    userId: string,
    creditType: "image_credits" | "video_credits",
    amount: number
  ) => {
    const updateData = {
      [creditType]:
        (users.find((user) => user.id === userId)?.[creditType] || 0) + amount,
    };

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error(`Error updating user ${creditType}:`, error);
    } else {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, [creditType]: updateData[creditType] }
            : user
        )
      );
    }
  };

  return (
    <div className="p-2 md:p-4 space-y-4">
      <h1 className="text-2xl mb-4">Admin Dashboard</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "users" ? "secondary" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            Users
          </Button>
          <Button
            variant={activeTab === "generations" ? "secondary" : "outline"}
            onClick={() => setActiveTab("generations")}
          >
            Generations
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "outline"}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </Button>
        </div>

        {activeTab === "users" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
      </div>

      {activeTab === "users" && filteredUsers.length > 0 && (
        <div className="overflow-x-auto -mx-2 md:mx-0">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[150px]">Image Credits</TableHead>
                <TableHead className="w-[120px]"></TableHead>
                <TableHead className="w-[150px]">Video Credits</TableHead>
                <TableHead className="w-[120px]"></TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentItems().map(
                (user) =>
                  "verified" in user && (
                    <TableRow key={user.id}>
                      <TableCell className="max-w-[200px] truncate">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.verified ? "outline" : "destructive"}
                        >
                          {user.verified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-500">
                          {user.image_credits}
                        </span>
                        {" | "}
                        <span className="text-red-500">
                          {userConsumedCredits[user.id]?.image_credits_used ||
                            0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            className="w-16"
                            value={creditInputs[user.id]?.image_credits || 0}
                            onChange={(e) => {
                              const newCredits = parseInt(e.target.value, 10);
                              if (!isNaN(newCredits)) {
                                setCreditInputs((prev) => ({
                                  ...prev,
                                  [user.id]: {
                                    ...prev[user.id],
                                    image_credits: newCredits,
                                  },
                                }));
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCredits(
                                user.id,
                                "image_credits",
                                creditInputs[user.id]?.image_credits || 0
                              )
                            }
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-green-500">
                          {user.video_credits}
                        </span>
                        {" | "}
                        <span className="text-red-500">
                          {userConsumedCredits[user.id]?.video_credits_used ||
                            0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Amount"
                            className="w-16"
                            value={creditInputs[user.id]?.video_credits || 0}
                            onChange={(e) => {
                              const newCredits = parseInt(e.target.value, 10);
                              if (!isNaN(newCredits)) {
                                setCreditInputs((prev) => ({
                                  ...prev,
                                  [user.id]: {
                                    ...prev[user.id],
                                    video_credits: newCredits,
                                  },
                                }));
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateCredits(
                                user.id,
                                "video_credits",
                                creditInputs[user.id]?.video_credits || 0
                              )
                            }
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => toggleVerified(user.id, user.verified)}
                          size="sm"
                        >
                          {user.verified ? "Unverify" : "Verify"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "generations" && generations.length > 0 && (
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
                {currentGenerations.map((gen) => (
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
                                <source
                                  src={hoveredPath || ""}
                                  type="video/mp4"
                                />
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

          <Pagination className="justify-center">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    className="cursor-pointer"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  />
                </PaginationItem>
              )}

              {getPageNumbers().map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    className="cursor-pointer"
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    className="cursor-pointer"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {(activeTab === "users" || activeTab === "generations") && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                {currentPage !== totalPages && (
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {activeTab === "settings" && <AdminSettings />}
    </div>
  );
}
