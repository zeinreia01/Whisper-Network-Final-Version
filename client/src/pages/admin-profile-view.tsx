
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, MessageSquare, MessageCircle, Calendar, User, Heart, Copy, Link as LinkIcon, Settings, Inbox } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { ProfileMusicSection } from "@/components/profile-music-section";
import { UserMusicList } from "@/components/user-music-list";
import { UserBoardMessageViewer } from "@/components/userboard-message-viewer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface Admin {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
  backgroundPhoto?: string;
  bio?: string;
  createdAt: string;
  role: string;
  isActive: boolean;
  isVerified?: boolean;
}

interface Message {
  id: number;
  content: string;
  category: string;
  createdAt: string;
  senderName: string;
  reactionCount?: number;
}

interface Reply {
  id: number;
  content: string;
  messageId: number;
  createdAt: string;
  nickname: string;
}

export function AdminProfileViewPage() {
  const { id } = useParams();
  const adminId = parseInt(id || "");
  const { admin } = useAuth();
  const { toast } = useToast();
  const isOwnProfile = adminId === admin?.id;
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [boardSettings, setBoardSettings] = useState({
    allowBoardCreation: false,
    boardVisibility: 'public',
    boardName: '',
  });

  const { data: adminProfile, isLoading: adminLoading } = useQuery<Admin>({
    queryKey: ["admin", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/profile`);
      if (!response.ok) {
        throw new Error("Admin not found");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["admin-messages", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  const { data: replies, isLoading: repliesLoading } = useQuery<Reply[]>({
    queryKey: ["admin-replies", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/replies`);
      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  const { data: adminMusicList, isLoading: musicLoading } = useQuery({
    queryKey: ["admin-music", adminId],
    queryFn: async () => {
      const response = await fetch(`/api/admins/${adminId}/music`);
      if (!response.ok) {
        throw new Error("Failed to fetch music");
      }
      return response.json();
    },
    enabled: !!adminId,
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyAnonymousLink = () => {
    const anonymousLink = `${window.location.origin}/u/${adminProfile?.username}`;
    navigator.clipboard.writeText(anonymousLink);
    toast({
      title: "Link copied!",
      description: "Anonymous messaging link has been copied to your clipboard.",
    });
  };

  const handleBoardSettingsUpdate = async () => {
    try {
      const response = await fetch(`/api/admins/${adminId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardSettings),
      });
      
      if (response.ok) {
        setShowBoardSettings(false);
        toast({
          title: "Board settings updated",
          description: "Your board configuration has been saved.",
        });
      }
    } catch (error) {
      console.error("Failed to update board settings:", error);
      toast({
        title: "Error",
        description: "Failed to update board settings",
        variant: "destructive",
      });
    }
  };

  if (!adminProfile) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Admin Not Found</h2>
              <p className="text-gray-600">The admin profile you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-0">
            {/* Background Photo */}
            {adminProfile.backgroundPhoto && (
              <div
                className="h-48 bg-cover bg-center rounded-t-lg"
                style={{ backgroundImage: `url(${adminProfile.backgroundPhoto})` }}
              />
            )}
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className={`relative ${adminProfile.backgroundPhoto ? '-mt-16' : ''}`}>
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={adminProfile.profilePicture || undefined} alt={adminProfile.displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl font-semibold">
                      {adminProfile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {adminProfile.displayName}
                    </h1>
                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Whisper Listener
                    </Badge>
                    {adminProfile.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{adminProfile.username}</p>
                  {adminProfile.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{adminProfile.bio}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {formatTimeAgo(adminProfile.createdAt)}
                    </div>
                  </div>
                </div>
              {/* Action buttons */}
                <div className="flex items-center gap-3 mt-4">
                  {/* Anonymous messaging button for all profiles */}
                  <Link href={`/u/${adminProfile?.username}`}>
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anonymous Link Section - Only show for own profile */}
        {isOwnProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Anonymous Messages Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    Share this link to receive anonymous messages
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {window.location.origin}/u/{adminProfile?.username}
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
            admin={adminProfile} 
            isOwnProfile={isOwnProfile}
            title="Profile Song"
          />
        </div>

        {/* Music List Section */}
        <div className="mb-6">
          <UserMusicList 
            adminId={adminId}
            isOwnProfile={isOwnProfile}
            title="Music Collection"
          />
        </div>

        {/* View Board Button - only show if admin has enabled board creation and board is public */}
        {adminProfile?.allowBoardCreation && adminProfile?.boardVisibility === 'public' && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {adminProfile?.boardName || `${adminProfile?.displayName || adminProfile?.username}'s Board`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Visit {isOwnProfile ? 'your' : `${adminProfile?.displayName || adminProfile?.username}'s`} message board
              </p>
              <Link href={`/board/${adminProfile?.username}`}>
                <Button className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  View Full Board
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages ({messages?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Replies ({replies?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages by {adminProfile.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Link key={message.id} href={`/message/${message.id}`}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" size="sm">
                              {message.category}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-3">
                            {message.content}
                          </p>
                          {message.reactionCount && message.reactionCount > 0 && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Heart className="w-4 h-4 mr-1" />
                              {message.reactionCount} reactions
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="replies">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Replies by {adminProfile.displayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {repliesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-16 w-full mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    ))}
                  </div>
                ) : replies && replies.length > 0 ? (
                  <div className="space-y-4">
                    {replies.map((reply) => (
                      <Link key={reply.id} href={`/message/${reply.messageId}`}>
                        <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                          <p className="text-gray-900 dark:text-gray-100 mb-2">
                            {reply.content}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Reply as {reply.nickname}</span>
                            <span>{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No replies found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Board Settings Dialog */}
      <Dialog open={showBoardSettings} onOpenChange={setShowBoardSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Board Settings</DialogTitle>
            <DialogDescription>
              Configure your personal message board settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enableBoard" className="text-sm font-medium">
                Enable Message Board
              </Label>
              <input
                id="enableBoard"
                type="checkbox"
                checked={boardSettings.allowBoardCreation}
                onChange={(e) => setBoardSettings(prev => ({
                  ...prev,
                  allowBoardCreation: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
            </div>
            <p className="text-xs text-gray-500">
              Allow others to post anonymous messages to your board
            </p>

            {boardSettings.allowBoardCreation && (
              <>
                <div>
                  <Label htmlFor="boardName" className="text-sm font-medium">
                    Board Name
                  </Label>
                  <Input
                    id="boardName"
                    value={boardSettings.boardName}
                    onChange={(e) => setBoardSettings(prev => ({
                      ...prev,
                      boardName: e.target.value
                    }))}
                    placeholder="My Message Board"
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="boardVisibility" className="text-sm font-medium">
                    Board Visibility
                  </Label>
                  <select
                    id="boardVisibility"
                    value={boardSettings.boardVisibility}
                    onChange={(e) => setBoardSettings(prev => ({
                      ...prev,
                      boardVisibility: e.target.value
                    }))}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    <option value="public">Public - Anyone can visit and post</option>
                    <option value="private">Private - Only you can see your board</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowBoardSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleBoardSettingsUpdate}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminProfileViewPage;
