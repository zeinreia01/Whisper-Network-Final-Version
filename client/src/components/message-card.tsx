import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { categories } from "@/lib/categories";
import type { MessageWithReplies } from "@shared/schema";

interface MessageCardProps {
  message: MessageWithReplies;
  showReplies?: boolean;
}

export function MessageCard({ message, showReplies = true }: MessageCardProps) {
  const [replyText, setReplyText] = useState("");
  const [nickname, setNickname] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const category = categories.find(c => c.id === message.category);
  
  const createReplyMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string; nickname: string }) => {
      return await apiRequest("POST", "/api/replies", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setReplyText("");
      setNickname("");
      setShowReplyForm(false);
      toast({
        title: "Reply sent!",
        description: "Your reply has been added to the conversation.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!replyText.trim() || !nickname.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both your nickname and reply.",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      messageId: message.id,
      content: replyText,
      nickname: nickname,
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="message-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2 mb-4">
        <span className={`category-dot ${category?.color}`}></span>
        <span className={`text-sm font-medium ${category?.color}`}>
          {category?.name}
        </span>
        {message.recipient && (
          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
            To: {message.recipient}
          </span>
        )}
        <span className="text-xs text-gray-500">
          • {formatTimeAgo(message.createdAt!)}
        </span>
      </div>

      {message.senderName && (
        <div className="mb-3">
          <span className="text-sm text-gray-600 font-medium">From: {message.senderName}</span>
        </div>
      )}

      <p className="text-gray-900 mb-4 leading-relaxed">{message.content}</p>

      {message.spotifyLink && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56z"/>
            </svg>
            <span className="text-sm text-gray-600">🎵 Music attached</span>
            <a 
              href={message.spotifyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700"
            >
              Listen on Spotify
            </a>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="hover:text-primary transition-colors"
          >
            Reply
          </button>
          <span>{message.replies.length} replies</span>
        </div>
        <Link href={`/message/${message.id}`}>
          <Button variant="ghost" size="sm" className="text-xs text-gray-600 hover:text-primary">
            <ExternalLink className="w-3 h-3 mr-1" />
            View Thread
          </Button>
        </Link>
      </div>

      {showReplyForm && (
        <div className="border-t pt-4 mb-4">
          <div className="space-y-3">
            <Input
              placeholder="Your nickname..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleReply}
                disabled={createReplyMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createReplyMutation.isPending ? "Sending..." : "Send Reply"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReplies && message.replies.length > 0 && (
        <div className="border-t pt-4">
          <div className="space-y-3">
            {message.replies.map((reply) => (
              <div key={reply.id} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {reply.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{reply.nickname}</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(reply.createdAt!)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
