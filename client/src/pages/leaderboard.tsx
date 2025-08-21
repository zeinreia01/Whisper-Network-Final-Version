import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuidedWalkthroughLeaderboard } from "@/components/guided-walkthrough-leaderboard";
import { Search, Trophy, MessageSquare, Heart, Users, Crown, Medal, Award } from "lucide-react";

interface LeaderboardUser {
  id: number;
  username: string;
  displayName: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  messageCount: number;
  replyCount: number;
  likeCount: number;
  followerCount: number;
  rank: number;
}

interface UserRanking {
  messageRank: number;
  replyRank: number;
  likeRank: number;
  followerRank: number;
}

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("messages");

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery<{
    messageLeaders: LeaderboardUser[];
    replyLeaders: LeaderboardUser[];
    likeLeaders: LeaderboardUser[];
    followerLeaders: LeaderboardUser[];
  }>({
    queryKey: ["/api/leaderboard"],
  });

  // Fetch current user's ranking
  const { data: userRanking } = useQuery<UserRanking>({
    queryKey: ["/api/leaderboard/my-ranking"],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-muted";
    }
  };

  const filterUsers = (users: LeaderboardUser[]) => {
    if (!searchTerm) return users;
    return users.filter(user =>
      (user.displayName || user.username).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const LeaderboardList = ({ users, type }: { users: LeaderboardUser[]; type: string }) => {
    const filteredUsers = filterUsers(users);
    
    return (
      <div className="space-y-3">
        {filteredUsers.map((user, index) => (
          <Card key={user.id} className={`transition-all hover:shadow-md ${getRankColor(user.rank)}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(user.rank)}
                </div>
                
                <Avatar className="w-12 h-12 ring-2 ring-background">
                  <AvatarImage src={user.profilePicture || ""} alt={user.displayName || user.username} />
                  <AvatarFallback>{(user.displayName || user.username).charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {user.displayName || user.username}
                    </h3>
                    {user.isVerified && (
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {type === "messages" && user.messageCount}
                    {type === "replies" && user.replyCount}
                    {type === "likes" && user.likeCount}
                    {type === "followers" && user.followerCount}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type === "messages" && "Messages"}
                    {type === "replies" && "Replies"}
                    {type === "likes" && "Likes"}
                    {type === "followers" && "Followers"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const MyRankingCard = () => {
    if (!userRanking) return null;
    
    return (
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Your Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-background">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="font-bold">#{userRanking.messageRank}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="font-bold">#{userRanking.replyRank}</div>
              <div className="text-xs text-muted-foreground">Replies</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <div className="font-bold">#{userRanking.likeRank}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="font-bold">#{userRanking.followerRank}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GuidedWalkthroughLeaderboard />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Whisper Network Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Celebrating our most active community members
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* My Rankings */}
      <MyRankingCard />

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-tour-leaderboard-tabs>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Replies</span>
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Likes</span>
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Followers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Most Messages Posted
              </CardTitle>
            </CardHeader>
            <CardContent data-tour-top-users>
              <LeaderboardList users={leaderboardData?.messageLeaders || []} type="messages" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Most Replies Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardList users={leaderboardData?.replyLeaders || []} type="replies" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Most Likes Received
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardList users={leaderboardData?.likeLeaders || []} type="likes" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Most Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardList users={leaderboardData?.followerLeaders || []} type="followers" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}