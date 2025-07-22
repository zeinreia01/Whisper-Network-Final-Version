
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
    mutationFn: async (data: { userId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/users/${data.userId}/verification`, {
        isVerified: data.isVerified,
        adminUsername: "ZEKE001"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Verification updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user verification status.",
        variant: "destructive",
      });
    },
  });

  const toggleAdminVerificationMutation = useMutation({
    mutationFn: async (data: { adminId: number; isVerified: boolean }) => {
      return await apiRequest("PATCH", `/api/admins/${data.adminId}/verification`, {
        isVerified: data.isVerified,
        adminUsername: "ZEKE001"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      toast({
        title: "Verification updated",
        description: "Admin verification status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update admin verification status.",
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
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Star className="w-5 h-5" />
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
                <ShieldCheck className="w-5 h-5" />
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

      {/* Silent Messengers (Users) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Silent Messengers Verification
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
              <p className="text-gray-600">No users found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{user.displayName || user.username}</p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                    <Badge variant={user.isVerified ? "default" : "secondary"} className="flex items-center gap-1">
                      {user.isVerified && <Star className="w-3 h-3" />}
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleToggleUserVerification(user.id, user.isVerified ?? false)}
                    variant={user.isVerified ? "destructive" : "default"}
                    size="sm"
                    disabled={toggleUserVerificationMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    {user.isVerified ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Remove Verification
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
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

      {/* Whisper Listeners (Admins) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Whisper Listeners Verification
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
              <p className="text-gray-600">No admins found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((adminUser) => (
                <div key={adminUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{adminUser.displayName}</p>
                      <p className="text-sm text-gray-600">@{adminUser.username}</p>
                    </div>
                    <Badge variant={adminUser.isVerified ? "default" : "secondary"} className="flex items-center gap-1">
                      {adminUser.isVerified && <Star className="w-3 h-3" />}
                      {adminUser.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
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
                        <Star className="w-4 h-4" />
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
    </div>
  );
}
