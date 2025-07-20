import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Camera, Music, Heart, MessageCircle } from "lucide-react";
import { categories } from "@/lib/categories";
import type { MessageWithReplies } from "@shared/schema";
import html2canvas from "html2canvas";

interface MessageViewerProps {
  message: MessageWithReplies;
  trigger?: React.ReactNode;
}

export function MessageViewer({ message, trigger }: MessageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const category = categories.find(c => c.id === message.category);
  
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

  const downloadAsImage = async () => {
    if (!messageRef.current) return;

    try {
      const canvas = await html2canvas(messageRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        width: 800,
        height: messageRef.current.scrollHeight,
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `whisper-${message.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Whisper
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Whisper Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={downloadAsImage}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Aesthetic Message Display */}
        <div 
          ref={messageRef}
          className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl shadow-xl border border-purple-100"
          style={{
            fontFamily: 'Georgia, serif',
            backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
          }}
        >
          {/* Header with branding */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Whispering Network
            </h1>
            <p className="text-gray-600 text-sm">A place where voices unite and hearts connect</p>
          </div>

          {/* Category and timestamp */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${category?.color}`}></div>
              <Badge variant="secondary" className="text-sm">
                {category?.name || message.category}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              {formatTimeAgo(message.createdAt!)}
            </div>
          </div>

          {/* Main message content */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-md border border-white/20">
            <blockquote className="text-lg leading-relaxed text-gray-800 text-center italic">
              "{message.content}"
            </blockquote>
          </div>

          {/* Spotify track if available */}
          {message.spotifyLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <Music className="w-5 h-5 text-green-600" />
                <div className="text-center">
                  <p className="text-sm font-medium text-green-800">Soundtrack to this whisper</p>
                  <a 
                    href={message.spotifyLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 text-sm underline"
                  >
                    Listen on Spotify
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Author attribution */}
          <div className="text-center mb-6">
            {message.senderName ? (
              <p className="text-gray-600 italic">
                — {message.senderName}
              </p>
            ) : (
              <p className="text-gray-500 italic text-sm">
                — Anonymous Whisper
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{message.reactionCount || 0} hearts</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{message.replies?.length || 0} replies</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              This whisper was shared on Whispering Network • {new Date(message.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}