import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCard } from "@/components/message-card";
import { UserBadge } from "@/components/user-badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, User, MessageSquare, Heart, Calendar, UserPlus, UserMinus, Users } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import type { UserProfile, MessageWithReplies } from "@shared/schema";

export function UserProfilePage() {
  const { id } = useParams();
  const { user, admin } = useAuth();
  const userId = parseInt(id || "0");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = user?.id || admin?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}/profile`, currentUserId],
    queryFn: async () => {
      const url = `/api/users/${userId}/profile${currentUserId ? `?currentUserId=${currentUserId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!userId && (!!user || !!admin),
  });

  const { data: userMessages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/users/${userId}/messages`],
    enabled: !!userId && (!!user || !!admin),
  });

  // Redirect if not authenticated
  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-300 mb-6">You need to be logged in to view user profiles.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Card className="bg-gray-800/50 border-gray-700 mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-300 mb-6">The user profile you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Profile header */}
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 border-2 border-primary">
                    <AvatarImage 
                      src={profile.profilePicture || undefined} 
                      alt={profile.displayName || profile.username}
                    />
                    <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                      {(profile.displayName || profile.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl text-white flex items-center space-x-2">
                      <User className="w-6 h-6" />
                      <span>{profile.displayName || profile.username}</span>
                      <UserBadge userType="user" variant="small" />
                    </CardTitle>
                    <p className="text-gray-400 flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatTimeAgo(profile.createdAt!)}
                    </p>
                  </div>
                </div>
                {/* Follow button (only show if not viewing own profile) */}
                {currentUserId !== userId && (
                  <FollowButton 
                    targetUserId={userId}
                    currentUserId={currentUserId!}
                    isFollowing={profile.isFollowing}
                    onFollowChange={() => queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`, currentUserId] })}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-primary mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.messageCount}</div>
                  <div className="text-sm text-gray-400">Messages</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-green-500 mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.replyCount}</div>
                  <div className="text-sm text-gray-400">Replies</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-red-500 mb-2">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.totalReactions}</div>
                  <div className="text-sm text-gray-400">Hearts Received</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-blue-500 mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.followersCount || 0}</div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-center text-purple-500 mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-white">{profile.followingCount || 0}</div>
                  <div className="text-sm text-gray-400">Following</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User's messages */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">
              Public Messages ({Array.isArray(userMessages) ? userMessages.length : 0})
            </h2>
            
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-8 w-32" />
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
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Public Messages</h3>
                  <p className="text-gray-500">This user hasn't posted any public messages yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Follow Button Component
interface FollowButtonProps {
  targetUserId: number;
  currentUserId: number;
  isFollowing?: boolean;
  onFollowChange: () => void;
}

function FollowButton({ targetUserId, currentUserId, isFollowing, onFollowChange }: FollowButtonProps) {
  const { toast } = useToast();

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${targetUserId}/follow`, {
        followerId: currentUserId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You are now following this user",
      });
      onFollowChange();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/users/${targetUserId}/follow`, {
        followerId: currentUserId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You unfollowed this user",
      });
      onFollowChange();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={followMutation.isPending || unfollowMutation.isPending}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
    >
      {isFollowing ? (
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
  );
}