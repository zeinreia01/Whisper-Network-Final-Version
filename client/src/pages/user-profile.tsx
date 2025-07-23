import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCard } from "@/components/message-card";
import { UserBadge } from "@/components/user-badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, MessageSquare, Heart, Calendar, UserPlus, UserMinus, Users, Edit, Settings, Bookmark } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { UserProfile, MessageWithReplies } from "@shared/schema";

export function UserProfilePage() {
  const { id } = useParams();
  const { user, admin } = useAuth();
  const userId = parseInt(id || "0");
  const [showEditBio, setShowEditBio] = useState(false);
  const [bioText, setBioText] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || admin?.id;
  const isOwnProfile = currentUserId === userId;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`, currentUserId],
    queryFn: async () => {
      const url = `/api/users/${userId}/profile${currentUserId ? `?currentUserId=${currentUserId}` : ''}`;
      return apiRequest('GET', url);
    },
    enabled: !!userId && (!!user || !!admin),
  });

  const { data: userMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/messages`],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/messages`),
    enabled: !!userId && (!!user || !!admin),
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: number; action: 'follow' | 'unfollow' }) => {
      const endpoint = action === 'follow' ? `/api/users/${targetId}/follow` : `/api/users/${targetId}/unfollow`;
      return apiRequest('POST', endpoint, {
        followerId: currentUserId
      });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`, currentUserId] });
      toast({
        title: "Success",
        description: `User ${action === 'unfollow' ? 'unfollowed' : 'followed'} successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
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

  const handleFollow = () => {
    if (!currentUserId) return;
    const action = profile?.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ targetId: userId, action });
  };

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

  // Initialize bio text when profile loads
  React.useEffect(() => {
    if (profile?.bio) {
      setBioText(profile.bio);
    }
  }, [profile?.bio]);

  // Redirect if not authenticated
  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Authentication Required</h1>
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
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">User Not Found</h1>
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

            {/* Profile header */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-6">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 border-2 border-primary">
                      <AvatarImage 
                        src={profile.profilePicture || undefined} 
                        alt={profile.displayName || profile.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center space-x-2">
                        <span>{profile.displayName || profile.username}</span>
                        <UserBadge userType="user" variant="small" />
                      </CardTitle>
                      {profile.displayName && (
                        <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {profile.createdAt ? formatTimeAgo(profile.createdAt) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    {isOwnProfile ? (
                      <Link href="/personal">
                        <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={handleFollow}
                        disabled={followMutation.isPending}
                        variant={profile.isFollowing ? "outline" : "default"}
                        className={
                          profile.isFollowing
                            ? "border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }
                      >
                        {followMutation.isPending ? (
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : profile.isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
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
                          setBioText(profile.bio || "");
                          setShowEditBio(true);
                        }}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {profile.bio ? (
                    <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      {isOwnProfile ? "Add a bio to tell others about yourself..." : "No bio available."}
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-primary mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.messageCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Messages</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-green-500 mb-2">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.replyCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Replies</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-red-500 mb-2">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.totalReactions || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Hearts Received</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-blue-500 mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.followersCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-center text-purple-500 mb-2">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.followingCount || 0}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Following</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User's messages */}
            <div>
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
    </>
  );
}
