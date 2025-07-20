import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCard } from "@/components/message-card";
import { AdminManagement } from "@/components/admin-management";
import { UserManagement } from "@/components/user-management";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Users, MessageCircle, Heart, Zap, LogOut, Lock, Settings } from "lucide-react";
import { useLocation } from "wouter";
import type { MessageWithReplies } from "@shared/schema";

export default function Admin() {
  const [selectedRecipient, setSelectedRecipient] = useState("Admin");
  const { admin, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Always call hooks before any early returns
  const { data: recipients = [] } = useQuery<string[]>({
    queryKey: ["/api/recipients"],
    enabled: !!admin,
  });

  const { data: privateMessages = [], isLoading: loadingPrivate } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/recipient", selectedRecipient],
    enabled: !!selectedRecipient && !!admin,
  });

  const { data: publicMessages = [], isLoading: loadingPublic } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/public"],
    enabled: !!admin,
  });

  const makePublicMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("PATCH", `/api/messages/${messageId}`, { isPublic: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message made public",
        description: "The message is now visible to everyone.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to make message public.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Early return after all hooks
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-light mb-2">Whisper Listener Access Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in as a Whisper Listener to access this panel.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalReplies = publicMessages.reduce((sum, msg) => sum + msg.replies.length, 0);
  const activeUsers = new Set(publicMessages.map(msg => msg.replies.map(r => r.nickname)).flat()).size;

  const stats = [
    {
      title: "Private Messages",
      value: privateMessages.length,
      icon: MessageCircle,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Public Messages", 
      value: publicMessages.length,
      icon: Users,
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: Heart,
      color: "bg-yellow-500/10 text-yellow-600"
    },
    {
      title: "Total Replies",
      value: totalReplies,
      icon: Zap,
      color: "bg-purple-500/10 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Whisper Listener Dashboard</h1>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 self-start sm:self-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Private messages from Silent Messengers and community guidance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`p-2 sm:p-3 rounded-lg ${stat.color} flex-shrink-0`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="messages" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Msg</span>
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="admin-management" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Admin Management</span>
              <span className="sm:hidden">Admin</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">About</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4 sm:mt-6">
            <Card>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Private Messages</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter by recipient:</span>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipients.map((recipient) => (
                          <SelectItem key={recipient} value={recipient}>
                            {recipient}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            {loadingPrivate ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading private messages...</p>
              </div>
            ) : privateMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No private messages for {selectedRecipient} yet.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {privateMessages.map((message) => (
                  <div key={message.id} className="border border-border rounded-lg p-4 sm:p-6">
                    <MessageCard message={message} showReplies={false} />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-4">
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                          // TODO: Implement private reply functionality
                          toast({
                            title: "Feature coming soon",
                            description: "Private reply functionality will be added soon.",
                          });
                        }}
                      >
                        Reply Privately
                      </Button>
                      <Button 
                        className="bg-accent hover:bg-accent/90"
                        onClick={() => makePublicMutation.mutate(message.id)}
                        disabled={makePublicMutation.isPending}
                      >
                        Make Public
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // TODO: Implement archive functionality
                          toast({
                            title: "Feature coming soon",
                            description: "Archive functionality will be added soon.",
                          });
                        }}
                      >
                        Archive
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-management" className="mt-4 sm:mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="admin-management" className="mt-4 sm:mt-6">
            <AdminManagement />
          </TabsContent>

          <TabsContent value="about" className="mt-4 sm:mt-6">
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                      About Whispering Network
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full"></div>
                  </div>

                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 mb-8 border border-purple-100 dark:border-gray-700">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Creator's Vision</h3>
                      <blockquote className="text-lg italic leading-relaxed text-gray-700 dark:text-gray-300 border-l-4 border-purple-400 pl-6 font-serif">
                        "I wanted to create a space where connection transcends visibility—where voices unite not through faces, but through the raw authenticity of shared experience. In a world that demands we be seen to be heard, I envisioned a sanctuary where anonymity becomes strength, where vulnerability finds safety, and where the whispers of the heart can echo without judgment.
                        <br/><br/>
                        This is a place where souls can open without having to shatter, where the silent can finally speak, and where the deepest truths find their way to listening hearts. Every whisper here carries the weight of human experience, every reply the warmth of genuine understanding.
                        <br/><br/>
                        In the dance between darkness and light, between speaking and listening, we discover that sometimes the most profound connections happen when we remove the masks and simply exist as we are—imperfect, searching, beautifully human."
                      </blockquote>
                      <div className="mt-6 text-right">
                        <p className="text-gray-600 dark:text-gray-400 font-serif">— Zeke, Creator of Whispering Network</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">The Philosophy</h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          Born from the understanding that authentic connection requires courage, not visibility. 
                          In anonymity, we find freedom. In listening, we discover empathy. In sharing, we heal together.
                        </p>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">The Mission</h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          To provide a digital sanctuary where every whisper matters, every story has value, 
                          and every person finds solace in the knowledge that they are not alone in their journey.
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 text-center bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        "In every whisper shared, in every heart that listens, in every moment of genuine connection—
                        we prove that humanity's greatest strength lies not in being seen, but in truly seeing others."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}