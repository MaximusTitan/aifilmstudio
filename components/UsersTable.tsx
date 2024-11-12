import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
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

interface UsersTableProps {
  users: User[];
  searchQuery: string;
  supabase: any;
  setUsers: (users: User[]) => void;
}

export function UsersTable({
  users,
  searchQuery,
  supabase,
  setUsers,
}: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [creditInputs, setCreditInputs] = useState<{
    [key: string]: { image_credits: number; video_credits: number };
  }>({});
  const [userConsumedCredits, setUserConsumedCredits] = useState<{
    [key: string]: { image_credits_used: number; video_credits_used: number };
  }>({});

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users]);

  const toggleVerified = async (userId: string, isVerified: boolean) => {
    const { error } = await supabase
      .from("users")
      .update({ verified: !isVerified })
      .eq("id", userId);

    if (!error) {
      setUsers(
        users.map((user) =>
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

    if (!error) {
      setUsers(
        users.map((user) =>
          user.id === userId
            ? { ...user, [creditType]: updateData[creditType] }
            : user
        )
      );
    }
  };

  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Table JSX implementation...
  return (
    <div className="space-y-4">
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
                      <span className="text-green-500">
                        {user.video_credits}
                      </span>
                      {" | "}
                      <span className="text-red-500">
                        {userConsumedCredits[user.id]?.video_credits_used || 0}
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
          </TableBody>{" "}
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
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
  );
}

export default UsersTable;
