import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, User, Upload, Calendar, Clock, Save, Archive, Camera, Edit3, X, Shield } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";

export function AdminPersonalPage() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [backgroundPhoto, setBackgroundPhoto] = useState("");
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);

  // Initialize form values
  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName || admin.username);
      setProfilePicture(admin.profilePicture || "");
      setBackgroundPhoto(admin.backgroundPhoto || "");
      setBio(admin.bio || "");
      setProfileImagePreview(admin.profilePicture || null);
      setBackgroundImagePreview(admin.backgroundPhoto || null);
    }
  }, [admin]);

  // Handle file upload with compression
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress and convert to base64
      const compressedDataUrl = await compressImage(file);

      if (type === 'profile') {
        setProfilePicture(compressedDataUrl);
        setProfileImagePreview(compressedDataUrl);
      } else {
        setBackgroundPhoto(compressedDataUrl);
        setBackgroundImagePreview(compressedDataUrl);
      }

      toast({
        title: "Image uploaded",
        description: `${type === 'profile' ? 'Profile' : 'Background'} image ready to save`,
      });
    } catch (error) {
      console.error("Image compression failed:", error);
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update admin profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      displayName: string;
      profilePicture?: string;
      backgroundPhoto?: string;
      bio?: string;
    }) => {
      if (!admin) throw new Error("Not authenticated as admin");
      
      const response = await apiRequest("PATCH", `/api/admins/${admin.id}/profile`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${admin?.id}/profile`] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      displayName,
      profilePicture: profilePicture || undefined,
      backgroundPhoto: backgroundPhoto || undefined,
      bio: bio || undefined,
    });
  };

  const removeImage = (type: 'profile' | 'background') => {
    if (type === 'profile') {
      setProfilePicture("");
      setProfileImagePreview(null);
    } else {
      setBackgroundPhoto("");
      setBackgroundImagePreview(null);
    }
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You must be logged in as an admin to access this page.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin-profile">
                <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Background Photo Section */}
            <div className="relative">
              {backgroundImagePreview ? (
                <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${backgroundImagePreview})` }}>
                  <div className="absolute inset-0 bg-black/30"></div>
                  {isEditing && (
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => backgroundFileInputRef.current?.click()}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removeImage('background')}
                        className="bg-red-500/80 hover:bg-red-600/80 text-white border-red-300/30"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-600 relative">
                  <div className="absolute inset-0 bg-black/20"></div>
                  {isEditing && (
                    <div className="absolute top-4 right-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => backgroundFileInputRef.current?.click()}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Add Cover
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <CardHeader className="-mt-16 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-end space-x-4">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage src={profileImagePreview || undefined} alt={admin.displayName || admin.username} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-2xl font-bold">
                        {(admin.displayName || admin.username || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute -bottom-2 -right-2 flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 w-8 p-0 bg-white dark:bg-gray-800 border shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        {profileImagePreview && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => removeImage('profile')}
                            className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white border"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h1 className="text-2xl font-bold text-white">
                        {admin.displayName || admin.username}
                      </h1>
                      <Badge className="bg-purple-600 text-white text-xs px-2 py-1">
                        <Shield className="w-3 h-3 mr-1" />
                        Whisper Listener
                      </Badge>
                    </div>
                    <p className="text-white/80 text-sm">@{admin.username}</p>
                    <p className="flex items-center text-white/70 text-sm mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {admin.createdAt ? formatTimeAgo(admin.createdAt) : 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Edit Toggle */}
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false);
                          // Reset to original values
                          if (admin) {
                            setDisplayName(admin.displayName || admin.username);
                            setProfilePicture(admin.profilePicture || "");
                            setBackgroundPhoto(admin.backgroundPhoto || "");
                            setBio(admin.bio || "");
                            setProfileImagePreview(admin.profilePicture || null);
                            setBackgroundImagePreview(admin.backgroundPhoto || null);
                          }
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="bg-white text-purple-600 hover:bg-gray-100"
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name
                </Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">
                    {displayName || "No display name set"}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 min-h-[100px]"
                    maxLength={500}
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    {bio || "No bio added yet."}
                  </p>
                )}
                {isEditing && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {bio.length}/500 characters
                  </p>
                )}
              </div>

              {/* Account Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</Label>
                    <p className="text-gray-900 dark:text-white">@{admin.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Whisper Listener
                      </Badge>
                      {admin.isVerified && (
                        <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e, 'profile')}
          />
          <input
            ref={backgroundFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e, 'background')}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminPersonalPage;