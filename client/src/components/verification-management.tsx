import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Shield, ShieldCheck, Star, Users } from "lucide-react";
import type { User, Admin } from "@shared/schema";

export function VerificationManagement() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only ZEKE001 can access this
  if (!admin || admin.username !== "ZEKE001") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only ZEKE001 can manage verified badges.</p>
        </CardContent>
      </Card>
    );
  }

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: admins = [], isLoading: loadingAdmins } = useQuery<Admin[]>({
    queryKey: ["/api/admins"],
  });

  const toggleUserVerificationMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/verification`, {
        isVerified,
        adminUsername: admin?.username,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User verification updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user verification status.",
        variant: "destructive",
      });
    },
  });

  const toggleAdminVerificationMutation = useMutation({
    mutationFn: async ({ adminId, isVerified }: { adminId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/admins/${adminId}/verification`, {
        isVerified,
        adminUsername: admin?.username,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      toast({
        title: "Admin verification updated",
        description: "Admin verification status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update admin verification status.",
        variant: "destructive",
      });
    },
  });

  const handleToggleUserVerification = (userId: number, currentStatus: boolean) => {
    toggleUserVerificationMutation.mutate({ userId, isVerified: !currentStatus });
  };

  const handleToggleAdminVerification = (adminId: number, currentStatus: boolean) => {
    toggleAdminVerificationMutation.mutate({ adminId, isVerified: !currentStatus });
  };

  const verifiedUsers = users.filter(user => user.isVerified);
  const unverifiedUsers = users.filter(user => !user.isVerified);
  const verifiedAdmins = admins.filter(admin => admin.isVerified);
  const unverifiedAdmins = admins.filter(admin => !admin.isVerified);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Verification Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage verified badges for users and admins. Only ZEKE001 can grant or revoke verification status.
          </p>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{verifiedUsers.length}</p>
                    <p className="text-sm text-gray-600">Verified Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unverifiedUsers.length}</p>
                    <p className="text-sm text-gray-600">Unverified Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{verifiedAdmins.length}</p>
                    <p className="text-sm text-gray-600">Verified Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unverifiedAdmins.length}</p>
                    <p className="text-sm text-gray-600">Unverified Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Silent Messengers ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No Silent Messengers found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium truncate">{user.displayName || user.username}</p>
                              {user.isVerified && (
                                <div className="flex items-center gap-1 bg-blue-500/10 text-blue-700 px-2 py-1 rounded-full text-xs">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleToggleUserVerification(user.id, user.isVerified ?? false)}
                        variant={user.isVerified ? "destructive" : "default"}
                        size="sm"
                        disabled={toggleUserVerificationMutation.isPending}
                        className="flex items-center gap-1 flex-shrink-0"
                      >
                        {user.isVerified ? (
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admins Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Whisper Listeners ({admins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAdmins ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading admins...</p>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No Whisper Listeners found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map((adminUser) => (
                    <div key={adminUser.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
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
                      </div>
                      <Button
                        onClick={() => handleToggleAdminVerification(adminUser.id, adminUser.isVerified ?? false)}
                        variant={adminUser.isVerified ? "destructive" : "default"}
                        size="sm"
                        disabled={toggleAdminVerificationMutation.isPending || adminUser.username === "ZEKE001"}
                        className="flex items-center gap-1 flex-shrink-0"
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}