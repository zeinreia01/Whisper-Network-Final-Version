import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { MessageSquare, Plus, Pin, PinOff, MoreVertical, Trash2, Crown, Sparkles, ArrowLeft, Upload } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { AdminAnnouncement } from "@shared/schema";
import { Label } from "@/components/ui/label";

interface AdminAnnouncementWithAuthor extends AdminAnnouncement {
  author?: {
    id: number;
    displayName: string;
    profilePicture: string | null;
  };
}

export function AdminAnnouncementsPage() {
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // const [photoAttachment, setPhotoAttachment] = useState(""); // Removed as per new functionality
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null); // State for file upload
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  // State for the new announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    content: "",
    photoUrl: "",
  });

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery<AdminAnnouncementWithAuthor[]>({
    queryKey: ["/api/admin/announcements"],
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async ({ title, content, photoUrl }: { title?: string | null; content: string; photoUrl: string | null }) => {
      const announcementData = {
        authorAdminId: admin?.id,
        title: title?.trim() || null,
        content: content.trim(),
        photoAttachment: photoUrl?.trim() || null,
        isPinned: false,
      };

      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementData),
      });

      if (!response.ok) {
        throw new Error("Failed to create announcement");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setIsCreatingAnnouncement(false);
      setTitle("");
      setContent("");
      setNewAnnouncement({ content: "", photoUrl: "" }); // Reset form state
      setSelectedPhoto(null); // Reset selected photo
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Pin announcement mutation
  const pinAnnouncementMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      const response = await fetch(`/api/admin/announcements/${id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });

      if (!response.ok) {
        throw new Error("Failed to pin announcement");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement updated!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement deleted!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  const handleCreateAnnouncement = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter an announcement message",
        variant: "destructive",
      });
      return;
    }

    createAnnouncementMutation.mutate({ title, content, photoUrl: newAnnouncement.photoUrl });
  };

  // Handler for photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedPhoto(e.target.files[0]);
      // Clear the photoUrl input if a file is selected
      setNewAnnouncement({ ...newAnnouncement, photoUrl: "" });
    }
  };

  // Update form submission to handle file upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let photoUrl = "";

      // Upload photo if one is selected
      if (selectedPhoto) {
        const formData = new FormData();
        formData.append("photo", selectedPhoto);

        const uploadResponse = await fetch("/api/upload/announcement", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          photoUrl = uploadResult.url;
        } else {
          toast({
            title: "Error",
            description: "Failed to upload photo.",
            variant: "destructive",
          });
          return; // Stop submission if upload fails
        }
      } else if (newAnnouncement.photoUrl) {
        // Use existing URL if no file is selected but URL is provided
        photoUrl = newAnnouncement.photoUrl;
      }

      await createAnnouncementMutation.mutateAsync({
        title: title,
        content: content,
        photoUrl: photoUrl,
      });

      // Reset form states after successful submission
      setTitle("");
      setContent("");
      setNewAnnouncement({ content: "", photoUrl: "" });
      setSelectedPhoto(null);
    } catch (error) {
      console.error("Failed to create announcement:", error);
      toast({
        title: "Error",
        description: "An error occurred while creating the announcement.",
        variant: "destructive",
      });
    }
  };


  const pinnedAnnouncements = announcements.filter(a => a.isPinned);
  const regularAnnouncements = announcements.filter(a => !a.isPinned);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4 sm:mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ✨ Updates from Admins 🎀
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Stay up to date with the latest community announcements and updates
          </p>
        </div>
      </div>

      {/* Announcements */}
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Announcements Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Check back later for updates from the admin team!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pinned Announcements */}
            {pinnedAnnouncements.map((announcement) => (
              <div key={announcement.id} className="relative">
                <div className="absolute -left-2 top-4 z-10">
                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <Pin className="w-3 h-3" />
                    Pinned
                  </div>
                </div>
                <Card className="ml-6 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Admin Avatar - Left aligned like chat */}
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={announcement.author?.profilePicture || ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {announcement.author?.displayName?.charAt(0)?.toUpperCase() || <Crown className="w-5 h-5" />}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Message Bubble */}
                      <div className="flex-1 max-w-2xl">
                        <div className="bg-background border rounded-2xl rounded-tl-md p-4 shadow-sm">
                          {announcement.title && (
                            <h3 className="font-semibold text-lg mb-2">
                              {announcement.title}
                            </h3>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                          {announcement.photoAttachment && (
                            <div className="mt-3">
                              <img
                                src={announcement.photoAttachment}
                                alt="Announcement photo"
                                className="max-w-full h-auto rounded-lg border"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {announcement.author?.displayName || "Admin"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(announcement.createdAt ? new Date(announcement.createdAt) : new Date())}
                              </span>
                            </div>
                            {admin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => pinAnnouncementMutation.mutate({
                                      id: announcement.id,
                                      isPinned: !announcement.isPinned
                                    })}
                                  >
                                    {announcement.isPinned ? (
                                      <>
                                        <PinOff className="w-4 h-4 mr-2" />
                                        Unpin
                                      </>
                                    ) : (
                                      <>
                                        <Pin className="w-4 h-4 mr-2" />
                                        Pin
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this announcement? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Regular Announcements */}
            {regularAnnouncements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Admin Avatar - Left aligned like chat */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={announcement.author?.profilePicture || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {announcement.author?.displayName?.charAt(0)?.toUpperCase() || <Crown className="w-5 h-5" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Message Bubble */}
                    <div className="flex-1 max-w-2xl">
                      <div className="bg-muted/30 border rounded-2xl rounded-tl-md p-4">
                        {announcement.title && (
                          <h3 className="font-semibold text-lg mb-2">
                            {announcement.title}
                          </h3>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {announcement.content}
                        </p>
                        {announcement.photoAttachment && (
                          <div className="mt-3">
                            <img
                              src={announcement.photoAttachment}
                              alt="Announcement photo"
                              className="max-w-full h-auto rounded-lg border"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {announcement.author?.displayName || "Admin"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(announcement.createdAt ? new Date(announcement.createdAt) : new Date())}
                            </span>
                          </div>
                          {admin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => pinAnnouncementMutation.mutate({
                                    id: announcement.id,
                                    isPinned: !announcement.isPinned
                                  })}
                                >
                                  {announcement.isPinned ? (
                                    <>
                                      <PinOff className="w-4 h-4 mr-2" />
                                      Unpin
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="w-4 h-4 mr-2" />
                                      Pin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this announcement? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Create Announcement Button - Only show for admins */}
      {admin && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => setIsCreatingAnnouncement(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Create Announcement Dialog */}
      <Dialog open={isCreatingAnnouncement} onOpenChange={setIsCreatingAnnouncement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="announcement-title">Title (Optional)</Label>
              <Input
                id="announcement-title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="announcement-content">Message</Label>
              <Textarea
                id="announcement-content"
                placeholder="Write your announcement message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                rows={6}
              />
              <div className="text-right text-xs text-muted-foreground mt-1">
                {content.length}/1000
              </div>
            </div>

            <div>
              <Label htmlFor="photo">Announcement Photo (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to select a photo or drag and drop
                  </span>
                </label>
                {selectedPhoto && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">{selectedPhoto.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setNewAnnouncement({ ...newAnnouncement, photoUrl: "" });
                      }}
                      className="mt-1"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingAnnouncement(false);
                  // Reset form states when canceling
                  setTitle("");
                  setContent("");
                  setNewAnnouncement({ content: "", photoUrl: "" });
                  setSelectedPhoto(null);
                }}
                disabled={createAnnouncementMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit" // Use type="submit" to trigger the form's onSubmit
                disabled={createAnnouncementMutation.isPending || (!content.trim() && !selectedPhoto && !newAnnouncement.photoUrl)}
              >
                {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}