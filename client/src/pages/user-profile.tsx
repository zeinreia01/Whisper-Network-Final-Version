import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCard } from "@/components/message-card";
import { UserBadge } from "@/components/user-badge";
import { UserMusicList } from "@/components/user-music-list";
import { UserDashboardPosts } from "@/components/user-dashboard-posts";
import { ProfileMusicSection } from "@/components/profile-music-section";
import { GuidedWalkthroughProfile } from "@/components/guided-walkthrough-profile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, MessageSquare, Heart, Calendar, UserPlus, UserMinus, Users, Edit, Settings, Shield, Flag, MoreVertical } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import avatarFallback from "@/assets/avatar-fallback.png";
import type { UserProfile, MessageWithReplies } from "@shared/schema";

export function UserProfilePage() {
  const { id } = useParams();
  const { user, admin } = useAuth();
  const userId = parseInt(id || "0");
  const [showEditBio, setShowEditBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || admin?.id;
  const isOwnProfile = currentUserId === userId;
  const targetUserId = userId; // Explicitly define targetUserId for clarity in mutations

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}/profile`, currentUserId],
    queryFn: async () => {
      const url = `/api/users/${userId}/profile${currentUserId ? `?currentUserId=${currentUserId}` : ''}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: !!userId && userId > 0 && (!!user || !!admin),
  });

  // Set following state when profile data changes
  React.useEffect(() => {
    if (profile) {
      setIsFollowing(profile.isFollowing || false);
    }
  }, [profile]);

  const { data: userMessages, isLoading: messagesLoading } = useQuery<MessageWithReplies[]>({
    queryKey: [`/api/users/${userId}/messages`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${userId}/messages`);
      return await response.json();
    },
    enabled: !!userId && (!!user || !!admin),
  });



  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: number; action: 'follow' | 'unfollow' }) => {
      const endpoint = action === 'follow' ? `/api/users/${targetId}/follow` : `/api/users/${targetId}/unfollow`;
      const response = await apiRequest("POST", endpoint, {
        followerId: currentUserId
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} user`);
      }
      return response.json();
    },
    onSuccess: (_, { action }) => {
      // Invalidate and refetch the profile to get updated follow status
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`, currentUserId] });
      queryClient.refetchQueries({ queryKey: [`/api/users/${userId}/profile`, currentUserId] });

      toast({
        title: action === 'unfollow' ? "Unfollowed" : "Now Following",
        description: action === 'unfollow'
          ? `You unfollowed ${(profile as any)?.displayName || (profile as any)?.username}` 
          : `You are now following ${(profile as any)?.displayName || (profile as any)?.username}`,
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

  // Bio update mutation
  const updateBioMutation = useMutation({
    mutationFn: async (bio: string) => {
      // Security check: only allow profile owner to update bio
      if (!isOwnProfile || currentUserId !== userId) {
        throw new Error('Unauthorized: You can only edit your own bio');
      }
      return apiRequest('PATCH', `/api/users/${userId}/profile`, { bio });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`, currentUserId] });
      setShowEditBio(false);
      toast({
        title: "Success",
        description: "Bio updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bio",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${targetUserId}/unfollow`, {
        followerId: user?.id || admin?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      setIsFollowing(false);
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${(profile as any)?.displayName || (profile as any)?.username}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${targetUserId}/profile`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const reportUserMutation = useMutation({
    mutationFn: async (data: { targetUserId: number; reason: string; reporterId: number; reporterType: string }) => {
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


  const handleBioUpdate = () => {
    // Security check: only allow profile owner to update bio
    if (!isOwnProfile || currentUserId !== userId) {
      toast({
        title: "Error",
        description: "You can only edit your own bio",
        variant: "destructive",
      });
      return;
    }

    if (bioText.length > 200) {
      toast({
        title: "Error",
        description: "Bio cannot exceed 200 characters",
        variant: "destructive",
      });
      return;
    }
    updateBioMutation.mutate(bioText);
  };

  const handleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate({ targetId: targetUserId, action: 'follow' });
    }
  };

  const handleReportUser = () => {
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
        description: "Please log in to report users.",
        variant: "destructive",
      });
      return;
    }

    reportUserMutation.mutate({
      targetUserId: targetUserId,
      reason: reportReason,
      reporterId: user?.id || admin?.id || 0,
      reporterType: user ? "user" : "admin",
    });
  };

  // Initialize bio text when profile loads
  React.useEffect(() => {
    if ((profile as any)?.bio) {
      setBioText((profile as any).bio);
    }
  }, [(profile as any)?.bio]);

  // Redirect if not authenticated
  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white page-title">Authentication Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to view user profiles.</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-white">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6 bg-gray-200 dark:bg-gray-700" />
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-16 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-16 bg-gray-200 dark:bg-gray-700" />
                </div>
              </CardContent>
            </Card>
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
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white page-title">User Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The user profile you're looking for doesn't exist.</p>
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
      <GuidedWalkthroughProfile />
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
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6 overflow-hidden" data-tour-profile-header>
              {/* Background Photo */}
              {(profile as any).backgroundPhoto && (
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${(profile as any).backgroundPhoto})` }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>
              )}

              <CardHeader className={(profile as any).backgroundPhoto ? "-mt-16 relative z-10" : ""}>
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage 
                        src={(profile as any).profilePicture || undefined} 
                        alt={(profile as any).displayName || (profile as any).username}
                      />
                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                        <img src={avatarFallback} alt="Avatar" className="w-full h-full object-cover" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className={`text-2xl flex items-center space-x-2 ${(profile as any).backgroundPhoto ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        <span>{(profile as any).displayName || (profile as any).username || 'Unknown User'}</span>
                        <UserBadge userType="user" variant="small" />
                        {(profile as any).isVerified && (
                          <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </CardTitle>
                      {(profile as any).displayName && (profile as any).username && (
                        <p className={`${(profile as any).backgroundPhoto ? 'text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>@{(profile as any).username}</p>
                      )}
                      <p className={`flex items-center mt-1 text-sm ${(profile as any).backgroundPhoto ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {(profile as any).createdAt ? formatTimeAgo((profile as any).createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3" data-tour-follow-system>
                    {/* Follow/Unfollow button */}
                    {(user || admin) && targetUserId !== (user?.id || admin?.id) && (
                      <Button
                        onClick={handleFollow}
                        disabled={followMutation.isPending || unfollowMutation.isPending}
                        variant={isFollowing ? "outline" : "default"}
                        className="flex items-center gap-2"
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </Button>
                    )}

                    {/* Report user option */}
                    {(user || admin) && targetUserId !== (user?.id || admin?.id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setShowReportDialog(true)}
                            className="text-orange-600"
                          >
                            <Flag className="h-4 w-4 mr-2" />
                            Report User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Bio section */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">About</h4>
                    {isOwnProfile && currentUserId === userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBioText((profile as any).bio || "");
                          setShowEditBio(true);
                        }}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {(profile as any).bio ? (
                    <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {(profile as any).bio}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      {isOwnProfile ? "Add a bio to tell others about yourself..." : "No bio available."}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-tour-profile-stats>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-primary mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(profile as any).messageCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Messages</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-green-500 mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(profile as any).replyCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Replies</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-red-500 mb-2">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(profile as any).totalReactions || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hearts Received</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-blue-500 mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(profile as any).followersCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-purple-500 mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(profile as any).followingCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Profile Music Section */}
              <div data-tour-music-section>
                <ProfileMusicSection 
                  user={profile as any}
                  isOwnProfile={isOwnProfile}
                  title="Profile Song"
                />
              </div>

              {/* Music Collection */}
              <UserMusicList 
                userId={userId}
                isOwnProfile={isOwnProfile}
                title="Music Collection"
              />
            </div>

            {/* Dashboard Posts */}
            <div data-tour-board-posts>
              <UserDashboardPosts 
                userId={userId}
                username={(profile as any)?.displayName || (profile as any)?.username}
                isOwnProfile={isOwnProfile}
              />
            </div>

            {/* User's messages */}
            <div data-tour-public-messages>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Public Messages ({Array.isArray(userMessages) ? userMessages.length : 0})
              </h2>

              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <Skeleton className="h-4 w-full mb-2 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-4 w-3/4 mb-4 bg-gray-200 dark:bg-gray-700" />
                        <Skeleton className="h-8 w-32 bg-gray-200 dark:bg-gray-700" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : Array.isArray(userMessages) && userMessages.length > 0 ? (
                <div className="space-y-6">
                  {userMessages.map((message: MessageWithReplies) => (
                    <MessageCard 
                      key={message.id} 
                      message={message} 
                      showReplies={false}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Public Messages</h3>
                    <p className="text-gray-500 dark:text-gray-400">This user hasn't posted any public messages yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio Edit Dialog */}
      <Dialog open={showEditBio} onOpenChange={setShowEditBio}>
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Edit Bio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio" className="text-gray-700 dark:text-gray-300">
                Bio ({bioText.length}/200)
              </Label>
              <Textarea
                id="bio"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell others about yourself..."
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                maxLength={200}
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Share a bit about yourself, your interests, or what brings you to the Whispering Network.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditBio(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBioUpdate}
              disabled={updateBioMutation.isPending || bioText.length > 200}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {updateBioMutation.isPending ? "Saving..." : "Save Bio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Help us maintain a safe community by reporting users who violate our guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Please describe why you're reporting this user..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReportUser}
              disabled={!reportReason.trim() || reportUserMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reportUserMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}