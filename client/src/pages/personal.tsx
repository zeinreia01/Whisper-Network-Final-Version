import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, User, Upload, Calendar, Clock, Save, Archive, Camera, Edit3, X } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { updateUserProfileSchema } from "@shared/schema";
import { z } from "zod";
import { compressImage } from "@/lib/image-utils";

export function PersonalPage() {
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [backgroundPhoto, setBackgroundPhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);

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
      setBackgroundPhoto(user.backgroundPhoto || "");
      setProfileImagePreview(user.profilePicture || null);
      setBackgroundImagePreview(user.backgroundPhoto || null);
    }
  }, [user]);

  // Handle file upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      toast({
        title: "Processing image",
        description: "Compressing and cropping your profile picture...",
      });

      // Compress and crop the image
      const compressedBase64 = await compressImage(file, false);
      setProfilePicture(compressedBase64 as string);
      setProfileImagePreview(compressedBase64 as string);

      toast({
        title: "Image ready",
        description: "Click 'Save Changes' to update your profile picture",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing the image file",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeProfileImage = () => {
    setProfilePicture("");
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle background photo upload
  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing background image",
        description: "Compressing and cropping your background photo...",
      });

      // Compress and crop the image
      const compressedBase64 = await compressImage(file, true);
      setBackgroundPhoto(compressedBase64 as string);
      setBackgroundImagePreview(compressedBase64 as string);

      toast({
        title: "Background image ready",
        description: "Click 'Save Changes' to update your background photo",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing the background image file",
        variant: "destructive",
      });
      if (backgroundFileInputRef.current) {
        backgroundFileInputRef.current.value = "";
      }
    }
  };

  const removeBackgroundImage = () => {
    setBackgroundPhoto("");
    setBackgroundImagePreview(null);
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { displayName?: string; profilePicture?: string, backgroundPhoto?: string }) => {
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
    const updates: { displayName?: string; profilePicture?: string; backgroundPhoto?: string } = {};

    if (displayName !== (user?.displayName || user?.username)) {
      updates.displayName = displayName;
    }

    if (profilePicture !== (user?.profilePicture || "")) {
      updates.profilePicture = profilePicture || undefined;
    }

    if (backgroundPhoto !== (user?.backgroundPhoto || "")) {
      updates.backgroundPhoto = backgroundPhoto || undefined;
    }


    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDisplayName(user?.displayName || user?.username || "");
    setProfilePicture(user?.profilePicture || "");
    setBackgroundPhoto(user?.backgroundPhoto || "");
    setProfileImagePreview(user?.profilePicture || null);
    setBackgroundImagePreview(user?.backgroundPhoto || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-500/10 rounded-full">
              <User className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Silent Messenger Access Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This page is only available to Silent Messengers (registered users). 
              Whisper Listeners have their own admin dashboard.
            </p>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personal Settings</h1>
                  <p className="text-gray-600 dark:text-gray-400">Manage your Silent Messenger profile</p>
                </div>
              </div>
            </div>
            <Link href="/personal-archive">
              <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Archive className="w-4 h-4 mr-2" />
                My Archive
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="w-5 h-5 text-blue-500" />
                      <span>Profile Information</span>
                    </div>
                    {!isEditing && (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-4 border-gray-200 dark:border-gray-600">
                        <AvatarImage 
                          src={isEditing ? (profileImagePreview || undefined) : (user.profilePicture || undefined)}
                          alt={user.username}
                        />
                        <AvatarFallback className="bg-blue-600 text-white text-xl font-semibold">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="absolute -bottom-2 -right-2">
                          <Button 
                            size="sm" 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 w-8 p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {user.displayName || user.username}
                      </h3>
                      <Badge className="bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white mb-3">
                        Silent Messenger
                      </Badge>
                      {isEditing && (
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          {profileImagePreview && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={removeProfileImage}
                              className="border-red-300 dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Background Photo Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="relative">
                      <div className="w-48 h-24 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                        {isEditing ? (
                          backgroundImagePreview ? (
                            <img src={backgroundImagePreview} alt="Background Preview" className="object-cover w-full h-full" />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                              No background selected
                            </div>
                          )
                        ) : user.backgroundPhoto ? (
                          <img src={user.backgroundPhoto} alt="Background" className="object-cover w-full h-full" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-500 dark:text-gray-400">
                            No background
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="absolute -bottom-2 -right-2">
                          <Button
                            size="sm"
                            onClick={() => backgroundFileInputRef.current?.click()}
                            className="h-8 w-8 p-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Background Photo
                      </h3>
                      {isEditing && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => backgroundFileInputRef.current?.click()}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          {backgroundImagePreview && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={removeBackgroundImage}
                              className="border-red-300 dark:border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={backgroundFileInputRef}
                    onChange={handleBackgroundUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Display Name */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 dark:text-gray-300 font-medium">Display Name</Label>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter display name (2-50 characters)"
                          maxLength={50}
                          disabled={!canUpdateDisplayName}
                          className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                        {!canUpdateDisplayName && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <p className="text-sm text-amber-800 dark:text-amber-400 flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Display name can only be changed once every 30 days.
                                {daysSinceLastChange !== null && (
                                  ` Wait ${30 - daysSinceLastChange} more days.`
                                )}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.displayName || user.username}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button 
                        onClick={handleCancel}
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span>Account Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Label className="text-gray-600 dark:text-gray-400 text-sm">Username</Label>
                    <p className="text-gray-900 dark:text-white font-mono font-medium">{user.username}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Label className="text-gray-600 dark:text-gray-400 text-sm">Member Since</Label>
                    <p className="text-gray-900 dark:text-white flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{formatTimeAgo(user.createdAt || new Date())}</span>
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Label className="text-gray-600 dark:text-gray-400 text-sm">Account Status</Label>
                    <Badge 
                      variant={user.isActive ? "default" : "secondary"} 
                      className={`mt-2 ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-white' : ''}`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/personal-archive">
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <Archive className="w-4 h-4 mr-2" />
                      View Archive
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                      Browse Messages
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
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