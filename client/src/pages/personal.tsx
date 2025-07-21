import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, User, Upload, Calendar, Clock, Save, Archive } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { updateUserProfileSchema } from "@shared/schema";
import { z } from "zod";

export function PersonalPage() {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Get display name cooldown status
  const { data: cooldownStatus } = useQuery({
    queryKey: [`/api/users/${user?.id}/can-update-display-name`],
    queryFn: async (): Promise<{ canUpdate: boolean }> => {
      if (!user) throw new Error("Not a user");
      const response = await fetch(`/api/users/${user.id}/can-update-display-name`);
      if (!response.ok) throw new Error("Failed to check cooldown");
      return response.json();
    },
    enabled: !!user,
  });

  // Initialize form values
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username);
      setProfilePicture(user.profilePicture || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { displayName?: string; profilePicture?: string }) => {
      if (!user) throw new Error("Not authenticated as user");
      
      // Validate the updates
      try {
        updateUserProfileSchema.parse(updates);
      } catch (error) {
        throw new Error("Invalid profile data");
      }

      const response = await apiRequest("PATCH", `/api/users/${user.id}/profile`, updates);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update the auth context with the new user data
      const currentAuth = JSON.parse(localStorage.getItem("whispering-user") || "{}");
      const updatedAuth = { ...currentAuth, ...updatedUser };
      localStorage.setItem("whispering-user", JSON.stringify(updatedAuth));
      
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/can-update-display-name`] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      // Refresh the page to show updated data
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    const updates: { displayName?: string; profilePicture?: string } = {};
    
    if (displayName !== (user?.displayName || user?.username)) {
      updates.displayName = displayName;
    }
    
    if (profilePicture !== (user?.profilePicture || "")) {
      updates.profilePicture = profilePicture || undefined;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || user.username);
      setProfilePicture(user.profilePicture || "");
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-500/10 rounded-full">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Silent Messenger Access Required</h1>
            <p className="text-gray-300 mb-6">
              This page is only available to Silent Messengers (registered users). 
              Whisper Listeners have their own admin dashboard.
            </p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canUpdateDisplayName = cooldownStatus?.canUpdate ?? true;
  const daysSinceLastChange = user.lastDisplayNameChange 
    ? Math.floor((Date.now() - new Date(user.lastDisplayNameChange).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Personal Settings</h1>
                  <p className="text-gray-400">Manage your Silent Messenger profile</p>
                </div>
              </div>
            </div>
            <Link href="/personal-archive">
              <Button variant="outline" className="border-gray-600 hover:bg-gray-800">
                <Archive className="w-4 h-4 mr-2" />
                My Archive
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>Profile Information</span>
                    {!isEditing && (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage 
                        src={isEditing ? profilePicture : (user.profilePicture || undefined)}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-lg">
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {user.displayName || user.username}
                      </h3>
                      <Badge className="bg-blue-600 text-white">
                        Silent Messenger
                      </Badge>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Display Name</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter display name (2-50 characters)"
                          maxLength={50}
                          disabled={!canUpdateDisplayName}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        {!canUpdateDisplayName && (
                          <p className="text-sm text-amber-400 flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              Display name can only be changed once every 30 days. 
                              {daysSinceLastChange !== null && (
                                ` Wait ${30 - daysSinceLastChange} more days.`
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-white bg-gray-700 p-3 rounded-md">
                        {user.displayName || user.username}
                      </p>
                    )}
                  </div>

                  {/* Profile Picture URL */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Profile Picture URL</Label>
                    {isEditing ? (
                      <Input
                        value={profilePicture}
                        onChange={(e) => setProfilePicture(e.target.value)}
                        placeholder="Enter image URL (optional)"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <p className="text-white bg-gray-700 p-3 rounded-md">
                        {user.profilePicture || "No profile picture set"}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex space-x-3 pt-4">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        onClick={handleCancel}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Account Details */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">Username</Label>
                    <p className="text-white font-mono">{user.username}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Member Since</Label>
                    <p className="text-white flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(user.createdAt || new Date())}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Account Status</Label>
                    <Badge variant={user.isActive ? "default" : "secondary"} className="mt-1">
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/personal-archive">
                    <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-800">
                      <Archive className="w-4 h-4 mr-2" />
                      View Archive
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-800">
                      Browse Messages
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-800">
                      Create Message
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalPage;