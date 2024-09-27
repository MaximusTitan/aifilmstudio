"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Play } from "lucide-react";

interface User {
  id: string;
  email: string;
  verified: boolean;
  credits: number;
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
}

export default function AdminUsersPage() {
  const supabase = createClient();
  const router = useRouter(); // Initialize useRouter
  const [users, setUsers] = useState<User[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "generations">("users");

  const [creditInputs, setCreditInputs] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    const checkUserAuthentication = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in"); // Redirect to sign-in if user is not authenticated
      }
    };

    checkUserAuthentication();
  }, [supabase, router]); // Run on component mount

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

        const initialCredits =
          sortedUsers.reduce(
            (acc, user) => {
              acc[user.id] = user.credits;
              return acc;
            },
            {} as { [key: string]: number }
          ) || {};
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

  const updateCredits = async (userId: string, amount: number) => {
    const { error } = await supabase
      .from("users")
      .update({ credits: amount })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user credits:", error);
    } else {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, credits: amount } : user
        )
      );
    }
  };

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleCreditChange = debounce((userId: string, newCredits: number) => {
    updateCredits(userId, newCredits);
  }, 300);

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

      {activeTab === "users" && (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">Email</th>
              <th className="border p-2">Verified</th>
              <th className="border p-2">Credits</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">
                  <Badge variant={user.verified ? "default" : "secondary"}>
                    {user.verified ? "Verified" : "Not Verified"}
                  </Badge>
                </td>
                <td className="border p-2 flex items-center justify-center">
                  <input
                    type="number"
                    value={creditInputs[user.id] || 0}
                    onChange={(e) => {
                      const newCredits = parseInt(e.target.value, 10);
                      if (!isNaN(newCredits) && newCredits >= 0) {
                        setCreditInputs((prev) => ({
                          ...prev,
                          [user.id]: newCredits,
                        }));
                        handleCreditChange(user.id, newCredits);
                      }
                    }}
                    className="w-20 text-center border rounded"
                    min="0"
                  />
                </td>
                <td className="border p-2">
                  <Button
                    onClick={() => toggleVerified(user.id, user.verified)}
                    variant={"outline"}
                  >
                    {user.verified ? "Unverify" : "Verify"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "generations" && (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border p-2">User Email</th>
              <th className="border p-2">Data</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Generations</th>
            </tr>
          </thead>
          <tbody>
            {generations.map((gen) => {
              return (
                <tr key={gen.id}>
                  <td className="border p-2">
                    {gen ? gen.user_email : "Unknown"}
                  </td>
                  <td className="border p-2">
                    {JSON.stringify(gen.parameters.prompt)}
                  </td>
                  <td className="border p-2">
                    {new Date(gen.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2 min-w-[100px] text-center">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
