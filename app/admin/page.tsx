"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// Make sure these components are properly exported from their respective files
import { UsersTable } from "@/components/UsersTable";
import { GenerationsTable } from "@/components/GenerationsTable";
import AdminSettings from "@/app/admin/AdminSettings"; // Update the import path

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

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [activeTab, setActiveTab] = useState<
    "users" | "generations" | "settings"
  >("users");
  const [searchQuery, setSearchQuery] = useState("");

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
    const fetchData = async () => {
      try {
        const [usersResult, generationsResult] = await Promise.all([
          supabase.from("users").select("*"),
          supabase.from("generations").select("*"),
        ]);

        if (usersResult.data) {
          const sortedUsers = usersResult.data.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setUsers(sortedUsers);
        }

        if (generationsResult.data) {
          const sortedGenerations = generationsResult.data.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setGenerations(sortedGenerations);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [supabase]);

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

      {activeTab === "users" && (
        <UsersTable
          users={users}
          searchQuery={searchQuery}
          supabase={supabase}
          setUsers={setUsers}
        />
      )}

      {activeTab === "generations" && (
        <GenerationsTable generations={generations} />
      )}

      {activeTab === "settings" && <AdminSettings />}
    </div>
  );
}
