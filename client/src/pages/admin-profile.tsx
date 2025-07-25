import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Save, X, Upload, AlertCircle, Shield } from "lucide-react";

export function AdminProfilePage() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [backgroundPhoto, setBackgroundPhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  // Get display name cooldown status
  const { data: cooldownStatus } = useQuery({
    queryKey: [`/api/admins/${admin?.id}/can-update-display-name`],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${admin?.id}/can-update-display-name`);
      return response.json();
    },
    enabled: !!admin?.id,
  });

  // Initialize form values when admin data loads
  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName || "");
      setBio(admin.bio || "");
      setProfilePicture(admin.profilePicture || "");
      setBackgroundPhoto(admin.backgroundPhoto || "");
      setProfileImagePreview(admin.profilePicture || null);
      setBackgroundImagePreview(admin.backgroundPhoto || null);
    }
  }, [admin]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      // Show uploading state for profile picture updates
      if (updates.profilePicture) {
        toast({
          title: "Uploading",
          description: "Saving your profile picture...",
        });
      }

      const response = await fetch(`/api/admins/${admin?.id}/profile`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (updatedAdmin) => {
      toast({
        title: "Profile updated",
        description: "Your admin profile has been updated successfully.",
      });
      setIsEditing(false);

      // Update form values with new data
      setDisplayName(updatedAdmin.displayName || "");
      setBio(updatedAdmin.bio || "");
      setProfilePicture(updatedAdmin.profilePicture || "");
      setBackgroundPhoto(updatedAdmin.backgroundPhoto || "");
      setProfileImagePreview(updatedAdmin.profilePicture || null);
      setBackgroundImagePreview(updatedAdmin.backgroundPhoto || null);

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${admin?.id}/can-update-display-name`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${admin?.id}/profile`] });

      // Force a re-login to update auth context
      window.location.reload();
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Compress and resize image with auto-crop
  const compressImage = (file: File, isBackground: boolean = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let targetWidth, targetHeight;

        if (isBackground) {
          // Background photo: 16:9 aspect ratio, max 800x450
          targetWidth = 800;
          targetHeight = 450;
        } else {
          // Profile picture: 1:1 aspect ratio (square), max 400x400
          targetWidth = 400;
          targetHeight = 400;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        let { width: imgWidth, height: imgHeight } = img;
        let sourceX = 0, sourceY = 0, sourceWidth = imgWidth, sourceHeight = imgHeight;

        // Auto-crop to fit target aspect ratio
        if (isBackground) {
          // For background (16:9 ratio)
          const targetRatio = 16 / 9;
          const imageRatio = imgWidth / imgHeight;

          if (imageRatio > targetRatio) {
            // Image is wider than target ratio, crop width
            sourceWidth = imgHeight * targetRatio;
            sourceX = (imgWidth - sourceWidth) / 2;
          } else {
            // Image is taller than target ratio, crop height
            sourceHeight = imgWidth / targetRatio;
            sourceY = (imgHeight - sourceHeight) / 2;
          }
        } else {
          // For profile picture (1:1 ratio)
          const size = Math.min(imgWidth, imgHeight);
          sourceWidth = size;
          sourceHeight = size;
          sourceX = (imgWidth - size) / 2;
          sourceY = (imgHeight - size) / 2;
        }

        ctx?.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read compressed image'));
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, isBackground: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
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
      const compressedBase64 = await compressImage(file, isBackground);

      if (isBackground) {
        setBackgroundImagePreview(compressedBase64);
        setBackgroundPhoto(compressedBase64);
      } else {
        setProfileImagePreview(compressedBase64);
        setProfilePicture(compressedBase64);
      }
    } catch (error) {
      console.error('Image compression error:', error);
      toast({
        title: "Image processing failed",
        description: "Failed to process the image. Please try another file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin) return;

    const updates: any = {};

    if (displayName !== admin.displayName) updates.displayName = displayName;
    if (bio !== admin.bio) updates.bio = bio;
    if (profilePicture !== admin.profilePicture) updates.profilePicture = profilePicture;
    if (backgroundPhoto !== admin.backgroundPhoto) updates.backgroundPhoto = backgroundPhoto;

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to save.",
      });
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleCancel = () => {
    if (admin) {
      setDisplayName(admin.displayName || "");
      setBio(admin.bio || "");
      setProfilePicture(admin.profilePicture || "");
      setBackgroundPhoto(admin.backgroundPhoto || "");
      setProfileImagePreview(admin.profilePicture || null);
      setBackgroundImagePreview(admin.backgroundPhoto || null);
    }
    setIsEditing(false);
  };

  if (!admin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/admin")}
            className="text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Panel
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-gray-200 dark:border-gray-600">
                    <AvatarImage 
                      src={isEditing ? (profileImagePreview || undefined) : (admin.profilePicture || undefined)}
                      alt={admin.displayName}
                    />
                    <AvatarFallback className="bg-purple-600 text-white text-xl font-semibold">
                      {admin.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <Button 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 w-8 p-0 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {admin.displayName}
                    </h1>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Whisper Listener
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{admin.username}</p>
                  {admin.bio && !isEditing && (
                    <p className="text-gray-700 dark:text-gray-300">{admin.bio}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700">
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleCancel} 
                        variant="outline"
                        disabled={updateProfileMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={updateProfileMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!cooldownStatus?.canUpdate}
                      className="max-w-md"
                    />
                    {!cooldownStatus?.canUpdate && (
                      <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Display name can only be changed once every 30 days
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="max-w-md resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Background Photo */}
                  <div className="space-y-2">
                    <Label>Background Photo</Label>
                    <div className="flex items-center space-x-4">
                      {backgroundImagePreview && (
                        <div className="relative">
                          <img 
                            src={backgroundImagePreview} 
                            alt="Background preview" 
                            className="w-32 h-18 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => {
                              setBackgroundImagePreview(null);
                              setBackgroundPhoto("");
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => backgroundFileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Background
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, false)}
                className="hidden"
              />
              <input
                ref={backgroundFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, true)}
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminProfilePage;