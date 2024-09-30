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
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "generations">("users");

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
    <div className="p-4">
      <h1 className="text-2xl mb-4">User Management</h1>

      <div className="flex space-x-4 mb-4">
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
      </div>

      {activeTab === "users" && users.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <TableHead className="min-w-[150px]">
                        Image Credits <AlertCircle className="inline h-4 w-4" />
                      </TableHead>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Available / Consumed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TableHead></TableHead>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <TableHead className="min-w-[150px]">
                        Video Credits <AlertCircle className="inline h-4 w-4" />
                      </TableHead>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Available / Consumed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TableHead className="min-w-[50px]"></TableHead>
                <TableHead className="min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.verified ? "outline" : "destructive"}>
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-500">{user.image_credits}</span>
                    {" / "}
                    <span className="text-red-500">
                      {userConsumedCredits[user.id]?.image_credits_used || 0}
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
                    <span className="text-green-500">{user.video_credits}</span>
                    {" / "}
                    <span className="text-red-500">
                      {userConsumedCredits[user.id]?.video_credits_used || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="w-20"
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
                    >
                      {user.verified ? "Unverify" : "Verify"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "generations" && generations.length > 0 && (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations.map((gen) => (
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
                    <a
                      href={gen.result_path.toString()}
                      className="relative inline-block"
                    >
                      {gen.result_path.toString().match(/\.(mp4|webm)$/) ? (
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
                            alt=""
                          />
                        </div>
                      )}
                    </a>
                  </TableCell>
                  <TableCell>
                    {new Date(gen.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
