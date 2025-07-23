
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
  ShieldCheck, 
  Star,
  Zap
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { User, Admin } from "@shared/schema";

export function VerificationManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all users
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get all admins
  const { data: admins = [], isLoading: loadingAdmins } = useQuery<Admin[]>({
    queryKey: ["/api/admins"],
  });

  // Toggle user verification mutation
  const toggleUserVerificationMutation = useMutation({
    mutationFn: async (data: { userId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/users/${data.userId}/verification`, { 
        isVerified: !data.isVerified 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Verification updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle admin verification mutation
  const toggleAdminVerificationMutation = useMutation({
    mutationFn: async (data: { adminId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/admins/${data.adminId}/verification`, { 
        isVerified: !data.isVerified 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      toast({
        title: "Verification updated",
        description: "Admin verification status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleUserVerification = (userId: number, isVerified: boolean) => {
    toggleUserVerificationMutation.mutate({ userId, isVerified });
  };

  const handleToggleAdminVerification = (adminId: number, isVerified: boolean) => {
    toggleAdminVerificationMutation.mutate({ adminId, isVerified });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVerifiedUsers = users.filter(user => user.isVerified).length;
  const totalVerifiedAdmins = admins.filter(admin => admin.isVerified).length;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalVerifiedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Verified Admins</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{totalVerifiedAdmins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{users.length + admins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Verification Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users and admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Silent Messengers Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Silent Messengers</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{user.displayName || user.username}</p>
                            {user.isVerified && (
                              <div className="flex items-center gap-1 bg-blue-500/10 text-blue-700 px-2 py-1 rounded-full text-xs">
                                <Zap className="w-3 h-3" />
                                Verified
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                          <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleToggleUserVerification(user.id, user.isVerified ?? false)}
                          variant={user.isVerified ? "destructive" : "default"}
                          size="sm"
                          disabled={toggleUserVerificationMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          {user.isVerified ? (
                            <>
                              <Zap className="w-4 h-4" />
                              Remove Verification
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Grant Verification
                            </>
                          )}
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

          {/* Whisper Listeners Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Whisper Listeners</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredAdmins.length > 0 ? (
                <div className="space-y-3">
                  {filteredAdmins.map((adminUser) => (
                    <div key={adminUser.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{adminUser.displayName}</p>
                            {adminUser.isVerified && (
                              <div className="flex items-center gap-1 bg-purple-500/10 text-purple-700 px-2 py-1 rounded-full text-xs">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                              </div>
                            )}
                            {adminUser.username === "ZEKE001" && (
                              <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-700 px-2 py-1 rounded-full text-xs">
                                <Star className="w-3 h-3" />
                                Primary Admin
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">@{adminUser.username}</p>
                          <p className="text-xs text-gray-500">Role: {adminUser.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleToggleAdminVerification(adminUser.id, adminUser.isVerified ?? false)}
                          variant={adminUser.isVerified ? "destructive" : "default"}
                          size="sm"
                          disabled={toggleAdminVerificationMutation.isPending || adminUser.username === "ZEKE001"}
                          className="flex items-center gap-1"
                        >
                          {adminUser.username === "ZEKE001" ? (
                            <>
                              <Star className="w-4 h-4" />
                              Primary Admin
                            </>
                          ) : adminUser.isVerified ? (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              Remove Verification
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              Grant Verification
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    {searchTerm.trim() 
                      ? "No admins found matching your search" 
                      : "No admins found"
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
