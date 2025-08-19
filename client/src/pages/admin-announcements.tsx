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
import { MessageSquare, Plus, Pin, PinOff, MoreVertical, Trash2, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { AdminAnnouncement } from "@shared/schema";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery<AdminAnnouncementWithAuthor[]>({
    queryKey: ["/api/admin/announcements"],
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const announcementData = {
        authorAdminId: admin?.id,
        title: title.trim() || null,
        content: content.trim(),
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

    createAnnouncementMutation.mutate();
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-primary" />
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            Updates from Admins
            <span className="text-2xl">🎀🫶</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Stay up to date with the latest community announcements and updates
          </p>
        </div>
        {admin && (
          <Button
            onClick={() => setIsCreatingAnnouncement(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </Button>
        )}
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
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {announcement.author?.displayName || "Admin"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(new Date(announcement.createdAt))}
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
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {announcement.author?.displayName || "Admin"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(new Date(announcement.createdAt))}
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

      {/* Create Announcement Dialog */}
      <Dialog open={isCreatingAnnouncement} onOpenChange={setIsCreatingAnnouncement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
              <Input
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatingAnnouncement(false)}
              disabled={createAnnouncementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAnnouncement}
              disabled={createAnnouncementMutation.isPending || !content.trim()}
            >
              {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}