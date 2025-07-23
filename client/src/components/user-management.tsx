import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Search, 
  Shield, 
  Ban, 
  CheckCircle, 
  Trash2, 
  MessageCircle,
  Calendar,
  Star
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { User } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Search users mutation
  const searchUsersMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(query)}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User deleted",
        description: "User account has been permanently deleted.",
      });
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async (data: { userId: number; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/users/${data.userId}`, { isActive: data.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User status updated",
        description: "User account status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get user messages
  const { data: userMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/user/messages", selectedUser?.id],
    enabled: !!selectedUser,
  });

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      searchUsersMutation.mutate(query);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const displayUsers = searchTerm.trim() && searchUsersMutation.data ? searchUsersMutation.data : users;
  const totalActiveUsers = users.filter(user => user.isActive).length;
  const totalInactiveUsers = users.filter(user => !user.isActive).length;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{totalActiveUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Ban className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Inactive Users</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{totalInactiveUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Silent Messenger Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users by username..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : Array.isArray(displayUsers) && displayUsers.length > 0 ? (
            <div className="space-y-3">
              {displayUsers.map((user: any) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{user.displayName || user.username}</p>
                        {user.isVerified && (
                          <Badge className="bg-blue-500/10 text-blue-700 flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">@{user.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? "default" : "secondary"} className="flex-shrink-0">
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleToggleUserStatus(user.id, user.isActive ?? true)}
                    variant={user.isActive ? "destructive" : "default"}
                    size="sm"
                    disabled={toggleUserStatusMutation.isPending}
                    className="min-h-[36px] text-xs sm:text-sm"
                  >
                    {toggleUserStatusMutation.isPending ? "..." : user.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(user.id)}
                    variant="destructive"
                    size="sm"
                    disabled={deleteUserMutation.isPending}
                    className="min-h-[36px] text-xs sm:text-sm"
                  >
                    {deleteUserMutation.isPending ? "..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {searchTerm.trim() 
                  ? "No users found matching your search" 
                  : "No users found"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Messages Modal */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Messages by {selectedUser.username}</span>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : Array.isArray(userMessages) && userMessages.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.isArray(userMessages) && userMessages.map((message: any) => (
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {message.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                      <Badge 
                        variant={message.isPublic ? "default" : "outline"} 
                        className="text-xs"
                      >
                        {message.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>This user hasn't sent any messages yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}