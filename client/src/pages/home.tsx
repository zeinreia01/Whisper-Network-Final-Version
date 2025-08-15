import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCard } from "@/components/message-card";
import { categories } from "@/lib/categories";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { User, Eye, EyeOff, MessageCircle, ChevronDown, Plus } from "lucide-react";
import type { MessageWithReplies } from "@shared/schema";

export default function Home() {
  const [category, setCategory] = useState("Anything");
  const [content, setContent] = useState("");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [recipient, setRecipient] = useState("");
  const [senderName, setSenderName] = useState("");
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [postAsAuthenticated, setPostAsAuthenticated] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, admin } = useAuth();

  const { data: recentMessages = [], isLoading } = useQuery<MessageWithReplies[]>({
    queryKey: ["/api/messages/public"],
  });

  const { data: recipients = [] } = useQuery<string[]>({
    queryKey: ["/api/recipients"],
  });

  const createMessageMutation = useMutation({
    mutationFn: async (data: { content: string; category: string; spotifyLink?: string; isPublic: boolean; recipient?: string; senderName?: string; isAuthenticated?: boolean; userId?: number; adminId?: number }) => {
      const response = await apiRequest("POST", "/api/messages", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/public"] });
      setContent("");
      setSpotifyLink("");
      setRecipient("");
      setSenderName("");
      setShowRecipientSelector(false);
      toast({
        title: "Message sent!",
        description: "Your message has been shared with the community.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendPublic = () => {
    if (!content.replace(/\s+/g, '').length) {
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    // Prepare message data with proper authenticated user info
    const messageData = {
      content,
      category,
      spotifyLink: spotifyLink || undefined,
      isPublic: true,
      isAuthenticated: postAsAuthenticated,
      userId: postAsAuthenticated ? user?.id : undefined,
      adminId: postAsAuthenticated ? admin?.id : undefined,
      // Set senderName based on authentication choice
      senderName: postAsAuthenticated 
        ? (user ? (user.displayName || user.username) : admin?.displayName)
        : senderName || undefined,
    };

    createMessageMutation.mutate(messageData);
  };

  const handleSendPrivate = () => {
    if (!content.replace(/\s+/g, '').length) {
      toast({
        title: "Message required",
        description: "Please enter a message before sending.",
        variant: "destructive",
      });
      return;
    }

    if (!recipient) {
      toast({
        title: "Recipient required",
        description: "Please select who to send the message to.",
        variant: "destructive",
      });
      return;
    }

    // Prepare message data with proper authenticated user info
    const messageData = {
      content,
      category,
      spotifyLink: spotifyLink || undefined,
      isPublic: false,
      recipient,
      isAuthenticated: postAsAuthenticated,
      userId: postAsAuthenticated ? user?.id : undefined,
      adminId: postAsAuthenticated ? admin?.id : undefined,
      // Set senderName based on authentication choice
      senderName: postAsAuthenticated 
        ? (user ? (user.displayName || user.username) : admin?.displayName)
        : senderName || undefined,
    };

    createMessageMutation.mutate(messageData);
  };

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 py-6 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section - Calming and Minimal */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white dark:bg-gray-800 shadow-lg rounded-3xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
              <MessageCircle className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
            Whisper Network
          </h1>
          <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto font-light leading-relaxed">
            A gentle space for anonymous thoughts and supportive connections
          </p>
        </div>

        {/* Gentle Send Message Button */}
        <div className="text-center mb-12">
          <Collapsible open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline"
                size="lg"
                className="group px-8 py-4 text-base font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm transition-all duration-200 rounded-2xl"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                {isComposeOpen ? "Close" : "Send a message?"}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isComposeOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Card className="mt-6 border border-gray-200 dark:border-gray-700 shadow-sm bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Your Message</Label>
                <Textarea
                  id="content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share what's on your heart..."
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="senderName">Your Name (Optional)</Label>
                <Input
                  id="senderName"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Leave blank to remain anonymous"
                />
              </div>

              <div>
                <Label htmlFor="spotify">Spotify Track (Optional)</Label>
                <Input
                  id="spotify"
                  type="url"
                  value={spotifyLink}
                  onChange={(e) => setSpotifyLink(e.target.value)}
                  placeholder="https://open.spotify.com/track/..."
                />
              </div>

              {/* Authentication Toggle - Only show for logged in users */}
              {(user || admin) && (
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">
                        {postAsAuthenticated ? "Posting as Silent Messenger" : "Posting Anonymously"}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {postAsAuthenticated 
                          ? `Your username (${user?.username || admin?.displayName}) will be visible and this will appear on your profile`
                          : "Your identity will remain hidden and this won't appear on your profile"
                        }
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={postAsAuthenticated}
                    onCheckedChange={setPostAsAuthenticated}
                  />
                </div>
              )}

              {showRecipientSelector && (
                <div>
                  <Label htmlFor="recipient">Send to</Label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select who to send to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipientName) => (
                        <SelectItem key={recipientName} value={recipientName}>
                          {recipientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleSendPublic}
                  disabled={createMessageMutation.isPending}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white"
                >
                  {createMessageMutation.isPending ? "Sending..." : "Send to Everyone"}
                </Button>
                {!showRecipientSelector ? (
                  <Button 
                    onClick={() => setShowRecipientSelector(true)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Send Privately
                  </Button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <Button 
                      onClick={handleSendPrivate}
                      disabled={createMessageMutation.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {createMessageMutation.isPending ? "Creating..." : (admin ? "Make Announcement" : "Send Message")}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowRecipientSelector(false);
                        setRecipient("");
                      }}
                      variant="outline"
                      className="px-4"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <Link href="/dashboard">
                  <Button variant="outline" className="text-primary hover:text-primary/80">
                    View Community Dashboard
                  </Button>
                </Link>
              </div>
            </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Recent Messages Preview */}
        <Card className="mt-8">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Recent Community Messages</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading messages...</p>
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No messages yet. Be the first to share!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMessages.slice(0, 3).map((message) => (
                  <MessageCard key={message.id} message={message} showReplies={false} />
                ))}
              </div>
            )}
            <div className="text-center mt-6">
              <Link href="/dashboard">
                <Button variant="outline" className="text-primary hover:text-primary/80">
                  View All Messages →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}