import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Camera, Upload, X, Clock, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";

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

        if (isBackground) {
          // Auto-crop to 16:9 aspect ratio
          const targetAspect = 16 / 9;
          const imageAspect = imgWidth / imgHeight;

          if (imageAspect > targetAspect) {
            // Image is wider, crop horizontally
            sourceWidth = imgHeight * targetAspect;
            sourceX = (imgWidth - sourceWidth) / 2;
          } else {
            // Image is taller, crop vertically
            sourceHeight = imgWidth / targetAspect;
            sourceY = (imgHeight - sourceHeight) / 2;
          }
        } else {
          // Auto-crop to square (1:1) aspect ratio
          const minDimension = Math.min(imgWidth, imgHeight);
          sourceWidth = minDimension;
          sourceHeight = minDimension;
          sourceX = (imgWidth - minDimension) / 2;
          sourceY = (imgHeight - minDimension) / 2;
        }

        // Draw the cropped and resized image
        ctx?.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        // Convert to base64 with compression (0.8 quality for JPEG)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload for profile picture
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (10MB limit before compression)
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
        title: "Processing image",
        description: "Compressing and optimizing your image...",
      });

      // Compress the image
      const compressedBase64 = await compressImage(file, false);
      setProfilePicture(compressedBase64);
      setProfileImagePreview(compressedBase64);

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

  const handleRemoveProfilePicture = () => {
    setProfilePicture("");
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle background photo upload
  const handleBackgroundFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (10MB limit before compression)
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
        description: "Compressing and optimizing your background image...",
      });

      // Compress the image
      const compressedBase64 = await compressImage(file, true);
      setBackgroundPhoto(compressedBase64);
      setBackgroundImagePreview(compressedBase64);

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

  const handleRemoveBackgroundPhoto = () => {
    setBackgroundPhoto("");
    setBackgroundImagePreview(null);
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = "";
    }
  };

  const handleSaveChanges = () => {
    if (!admin) return;

    const updates: any = {};

    if (displayName !== admin.displayName) {
      updates.displayName = displayName;
    }

    if (bio !== (admin.bio || "")) {
      updates.bio = bio;
    }

    if (profilePicture !== (admin.profilePicture || "")) {
      updates.profilePicture = profilePicture;
    }

    if (backgroundPhoto !== (admin.backgroundPhoto || "")) {
      updates.backgroundPhoto = backgroundPhoto;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to your profile.",
      });
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Panel
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">Please log in as an admin to view this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canUpdateDisplayName = cooldownStatus?.canUpdate ?? false;
  const daysSinceLastChange = admin.lastDisplayNameChange 
    ? Math.floor((Date.now() - new Date(admin.lastDisplayNameChange).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Panel
            </Button>
          </Link>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-purple-100 dark:bg-purple-600 text-purple-800 dark:text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Whisper Listener
                    </Badge>
                    {admin.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={!canUpdateDisplayName}
                          placeholder="Enter display name"
                          className="max-w-md"
                        />
                        {!canUpdateDisplayName && daysSinceLastChange !== null && (
                          <div className="flex items-center text-sm text-orange-600 dark:text-orange-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Can change again in {30 - daysSinceLastChange} days</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">{admin.displayName}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <div className="space-y-1">
                        <Textarea
                          id="bio"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell users about yourself..."
                          className="max-w-md resize-none"
                          rows={3}
                          maxLength={200}
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {bio.length}/200 characters
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300 max-w-md">
                        {admin.bio || "No bio added yet."}
                      </p>
                    )}
                  </div>

                  {/* Profile Picture Upload Status */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      {profileImagePreview ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Image ready for upload
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveProfilePicture}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Click "Upload Photo" to select a new profile picture
                        </div>
                      )}
                    </div>
                  )}

                  {/* Background Photo Upload */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label>Background Photo</Label>
                      <div className="space-y-2">
                        {/* Background Photo Preview */}
                        {backgroundImagePreview ? (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                            <img 
                              src={backgroundImagePreview} 
                              alt="Background preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                              <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                Background Preview
                              </div>
                            </div>
                          </div>
                        ) : admin.backgroundPhoto ? (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                            <img 
                              src={admin.backgroundPhoto} 
                              alt="Current background"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                              <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                Current Background
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                            <div className="text-center">
                              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-500">No background photo</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Background Photo Controls */}
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => backgroundFileInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {backgroundImagePreview || admin.backgroundPhoto ? 'Change Background' : 'Upload Background'}
                          </Button>
                          {(backgroundImagePreview || admin.backgroundPhoto) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveBackgroundPhoto}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        {/* Status Message */}
                        {backgroundImagePreview ? (
                          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Background image ready for upload
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Add a background photo to personalize your profile (like Facebook or Twitter)
                          </div>
                        )}
                      </div>
                      
                      {/* Hidden file input for background */}
                      <input
                        ref={backgroundFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={updateProfileMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form values
                        setDisplayName(admin.displayName);
                        setBio(admin.bio || "");
                        setProfilePicture(admin.profilePicture || "");
                        setBackgroundPhoto(admin.backgroundPhoto || "");
                        setProfileImagePreview(admin.profilePicture || null);
                        setBackgroundImagePreview(admin.backgroundPhoto || null);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminProfilePage;