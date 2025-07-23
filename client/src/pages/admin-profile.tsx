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
    queryFn: () => apiRequest(`/api/admins/${admin?.id}/can-update-display-name`),
    enabled: !!admin?.id,
  });

  // Initialize form values when admin data loads
  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName || "");
      setBio(admin.bio || "");
      setProfilePicture(admin.profilePicture || "");
      setProfileImagePreview(admin.profilePicture || null);
    }
  }, [admin]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/admins/${admin?.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      // Update the auth context with new admin data
      queryClient.setQueryData([`/api/admins/${admin?.id}/can-update-display-name`], () => ({ canUpdate: false }));
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${admin?.id}/can-update-display-name`] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Handle file upload for profile picture
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setProfilePicture(base64String);
      setProfileImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture("");
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell users about yourself..."
                        className="max-w-md resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300">
                        {admin.bio || "No bio added yet."}
                      </p>
                    )}
                  </div>

                  {/* Profile Picture URL (for editing) */}
                  {isEditing && profileImagePreview && (
                    <div className="space-y-2">
                      <Label>Profile Picture Preview</Label>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Image uploaded successfully
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