import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Camera, Upload, X, Clock, Shield } from "lucide-react";
import { Link } from "wouter";

export function AdminProfilePage() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Get display name cooldown status
  const { data: cooldownStatus } = useQuery({
    queryKey: [`/api/admins/${admin?.id}/can-update-display-name`],
    queryFn: async (): Promise<{ canUpdate: boolean }> => {
      if (!admin) throw new Error("Not an admin");
      const response = await fetch(`/api/admins/${admin.id}/can-update-display-name`);
      if (!response.ok) throw new Error("Failed to check cooldown");
      return response.json();
    },
    enabled: !!admin,
  });

  // Initialize form values
  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName || admin.username);
      setBio(admin.bio || "");
      setProfilePicture(admin.profilePicture || "");
      setProfileImagePreview(admin.profilePicture || null);
    }
  }, [admin]);

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
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

    // Create a preview URL and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const result = e.target.result as string;
        setProfileImagePreview(result);
        setProfilePicture(result); // Store as base64 data URL for API
        
        toast({
          title: "Image selected",
          description: "Click 'Save Changes' to update your profile picture",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "There was an error reading the image file",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImagePreview(null);
    setProfilePicture("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { displayName?: string; profilePicture?: string; bio?: string }) => {
      if (!admin) throw new Error("Not authenticated as admin");
      
      const response = await apiRequest("PATCH", `/api/admins/${admin.id}/profile`, updates);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (updatedAdmin) => {
      // Update the auth context with the new admin data
      const currentAuth = JSON.parse(localStorage.getItem("whispering-admin") || "{}");
      const updatedAuth = { ...currentAuth, ...updatedAdmin };
      localStorage.setItem("whispering-admin", JSON.stringify(updatedAuth));
      
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${admin?.id}/can-update-display-name`] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your admin profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in as an admin to view this page.</p>
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
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {admin.displayName}
                  </h3>
                  <Badge className="bg-purple-100 dark:bg-purple-600 text-purple-800 dark:text-white mb-3">
                    <Shield className="w-3 h-3 mr-1" />
                    Whisper Listener
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

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
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
                      {admin.displayName}
                    </p>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <Label className="text-gray-700 dark:text-gray-300 font-medium">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell the community about yourself (optional, max 200 characters)"
                    maxLength={200}
                    rows={3}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-900 dark:text-white">
                      {admin.bio || "No bio set"}
                    </p>
                  </div>
                )}
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
                        setProfileImagePreview(admin.profilePicture || null);
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