import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { formatTimeAgo } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCard } from "@/components/message-card";
import { UserBadge } from "@/components/user-badge";
import { ProfileMusicSection } from "@/components/profile-music-section";
import { UserMusicList } from "@/components/user-music-list";
import { ArrowLeft, Settings, UserPlus, UserMinus, Calendar, Flag, MoreVertical, Copy, Link as LinkIcon, Eye, Download, MessageSquare, Inbox } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { Admin, MessageWithReplies } from "@shared/schema";

interface AdminProfile extends Admin {
  messageCount: number;
  replyCount: number;
  totalReactions: number;
  followersCount: number;
  isFollowing?: boolean;
  allowBoardCreation?: boolean;
  boardVisibility?: 'public' | 'private';
  boardName?: string;
}

export default function AdminProfile() {
  const params = useParams();
  // If no id in params, use current admin's id (for /admin-profile route)
  const adminId = params.id ? parseInt(params.id as string) : undefined;
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = user?.id;
  const currentAdminId = admin?.id;
  const targetAdminId = adminId || currentAdminId; // Use current admin if no id provided
  const isOwnProfile = targetAdminId === currentAdminId;

  const { data: profile, isLoading: profileLoading } = useQuery<AdminProfile>({
    queryKey: [`/api/admins/${targetAdminId}/profile`, currentUserId],
    queryFn: async () => {
      const url = `/api/admins/${targetAdminId}/profile${currentUserId ? `?currentUserId=${currentUserId}` : ''}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: !!targetAdminId && targetAdminId > 0 && (!!user || !!admin),
  });

  const { data: adminMessages, isLoading: messagesLoading } = useQuery<MessageWithReplies[]>({
    queryKey: [`/api/admins/${targetAdminId}/messages`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admins/${targetAdminId}/messages`);
      return await response.json();
    },
    enabled: !!targetAdminId && (!!user || !!admin),
  });

  const { data: adminMusicList, isLoading: musicLoading } = useQuery({
    queryKey: [`/api/admins/${targetAdminId}/music`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admins/${targetAdminId}/music`);
      return await response.json();
    },
    enabled: !!targetAdminId && (!!user || !!admin),
  });

  // Follow/Unfollow mutation for admin
  const followMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: number; action: 'follow' | 'unfollow' }) => {
      const endpoint = action === 'follow' ? `/api/admins/${targetId}/follow` : `/api/admins/${targetId}/unfollow`;
      const response = await apiRequest('POST', endpoint, {
        followerId: currentUserId
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} admin`);
      }
      return response.json();
    },
    onSuccess: (_, { action }) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${targetAdminId}/profile`] });
      queryClient.refetchQueries({ queryKey: [`/api/admins/${targetAdminId}/profile`] });
      toast({
        title: action === 'unfollow' ? "Unfollowed" : "Now Following",
        description: action === 'unfollow'
          ? `You unfollowed ${profile?.displayName}`
          : `You are now following ${profile?.displayName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");

  // Board configuration states
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [boardSettings, setBoardSettings] = useState({
    allowBoardCreation: false,
    boardVisibility: 'public',
    boardName: '',
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admins/${targetAdminId}/unfollow`, {
        followerId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      setIsFollowing(false);
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${profile?.displayName}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admins/${targetAdminId}/profile`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow admin",
        variant: "destructive",
      });
    },
  });

  const reportAdminMutation = useMutation({
    mutationFn: async (data: { targetAdminId: number; reason: string; reporterId: number; reporterType: string }) => {
      const response = await apiRequest("POST", "/api/reports/user", data);
      return await response.json();
    },
    onSuccess: () => {
      setReportReason("");
      setShowReportDialog(false);
      toast({
        title: "Report submitted",
        description: "Your report has been sent to the administrators for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report.",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate({ targetId: targetAdminId!, action: 'follow' });
    }
  };

  const handleReportAdmin = () => {
    if (!reportReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !admin) {
      toast({
        title: "Authentication required",
        description: "Please log in to report admins.",
        variant: "destructive",
      });
      return;
    }

    reportAdminMutation.mutate({
      targetAdminId: targetAdminId,
      reason: reportReason,
      reporterId: user?.id || admin?.id || 0,
      reporterType: user ? "user" : "admin",
    });
  };

  const handleCopyAnonymousLink = () => {
    if (!profile?.username) return;
    const anonymousLink = `${window.location.origin}/u/${profile?.username}`;
    navigator.clipboard.writeText(anonymousLink);
    toast({
      title: "Link copied!",
      description: "Anonymous messaging link has been copied to your clipboard.",
    });
  };


  if (profileLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The admin profile you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-white">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-6 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            {/* Profile header with background photo */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
              {/* Background Photo */}
              {profile.backgroundPhoto && (
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${profile.backgroundPhoto})` }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
              )}

              <CardHeader className={profile.backgroundPhoto ? "-mt-16 relative z-10" : ""}>
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage 
                        src={profile.profilePicture || undefined} 
                        alt={profile.displayName || profile.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-2xl font-bold">
                        {(profile.displayName || profile.username || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className={`text-2xl flex items-center space-x-2 ${profile.backgroundPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <span>{profile.displayName || profile.username || 'Unknown Admin'}</span>
                        <UserBadge userType="admin" variant="small" />
                        {profile.isVerified && (
                          <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </CardTitle>
                      {profile.displayName && profile.username && (
                        <p className={`${profile.backgroundPhoto ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>@{profile.username}</p>
                      )}
                      <p className={`flex items-center mt-1 text-sm ${profile.backgroundPhoto ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {profile.createdAt ? formatTimeAgo(profile.createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    {/* Anonymous messaging button for all profiles */}
                    <Link href={`/u/${profile?.username}`}>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {isOwnProfile ? "My Anonymous Link" : "Send Anonymous Message"}
                      </Button>
                    </Link>

                    {/* Board settings button for own profile */}
                    {isOwnProfile && (
                      <Button
                        onClick={() => setShowBoardSettings(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Board Settings
                      </Button>
                    )}

                    {/* Follow/Unfollow button */}
                    {(user || admin) && targetAdminId !== currentAdminId && (
                      <Button
                        onClick={handleFollow}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        variant={isFollowing ? "outline" : "default"}
                        className="flex items-center gap-2"
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mt-4">
                    <p className={`text-sm leading-relaxed ${profile.backgroundPhoto ? 'text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
                      {profile.bio}
                    </p>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.messageCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.replyCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.totalReactions || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reactions</div>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{profile.followersCount || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </CardContent>
              </Card>
            </div>

            {/* Anonymous Link Section - Only show for own profile */}
            {isOwnProfile && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    Anonymous Messages Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Share this link to receive anonymous messages
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {window.location.origin}/u/{profile?.username}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyAnonymousLink}
                      size="sm"
                      className="ml-3 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Profile Song Section */}
            <div className="mb-6">
              <ProfileMusicSection 
                admin={profile} 
                isOwnProfile={isOwnProfile}
                title="Profile Song"
              />
            </div>

            {/* Music List Section */}
            {adminMusicList && adminMusicList.length > 0 && (
              <div className="mb-6">
                <UserMusicList 
                  musicList={adminMusicList}
                  isOwnProfile={isOwnProfile}
                  isLoading={musicLoading}
                  userType="admin"
                  userId={targetAdminId}
                />
              </div>
            )}

            {/* View Board Button - only show if admin has enabled board creation and board is public */}
            {profile?.allowBoardCreation && profile?.boardVisibility === 'public' && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {profile?.boardName || `${profile?.displayName || profile?.username}'s Board`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Visit {isOwnProfile ? 'your' : `${profile?.displayName || profile?.username}'s`} message board
                  </p>
                  <Link href={`/board/${profile?.username}`}>
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      View Full Board
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Admin's messages */}
            <div data-tour-public-messages>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Recent Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {!adminMessages || adminMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No public messages yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adminMessages.map((message) => (
                        <MessageCard
                          key={message.id}
                          message={message}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Report Admin Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Admin</DialogTitle>
            <DialogDescription>
              Help us maintain a safe community by reporting admins who violate our guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Please describe why you're reporting this admin..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-col gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReportAdmin}
              disabled={!reportReason.trim() || reportAdminMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reportAdminMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}