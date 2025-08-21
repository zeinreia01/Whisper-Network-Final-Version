import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Camera, Music, Heart, MessageCircle } from "lucide-react";
import { categories } from "@/lib/categories";
import { getSpotifyDisplayName } from "@/lib/spotify";
import type { MessageWithReplies } from "@shared/schema";
import html2canvas from "html2canvas";

interface MessageViewerProps {
  message: MessageWithReplies;
  trigger?: React.ReactNode;
}

export function MessageViewer({ message, trigger }: MessageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAsImage = async () => {
    if (!messageRef.current || isDownloading) return;

    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(messageRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: messageRef.current.offsetWidth,
        height: messageRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: messageRef.current.offsetWidth,
        windowHeight: messageRef.current.offsetHeight
      });

      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `whisper-${message.id}-${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      toast({
        title: "Download Started",
        description: "Your whisper image is being downloaded.",
      });

    } catch (error) {
      console.error('Failed to download image:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
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
                disabled={isDownloading}
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Instagram-style Message Display - matching reference exactly */}
        <div 
          ref={messageRef}
          className="rounded-xl border relative overflow-hidden bg-card"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            width: '400px',
            minHeight: '500px',
            margin: '0 auto',
            padding: '24px',
            boxSizing: 'border-box',
            background: document.documentElement.classList.contains('pink') 
              ? 'linear-gradient(135deg, #fce7f3 0%, #f8d7da 25%, #f1c0c5 50%, #ecadb0 75%, #e799a0 100%)'
              : document.documentElement.classList.contains('dark')
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #4338ca 75%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 50%, #e2e8f0 75%, #cbd5e1 100%)',
            border: document.documentElement.classList.contains('pink') 
              ? '1px solid rgba(221, 114, 133, 0.3)'
              : document.documentElement.classList.contains('dark')
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
            boxShadow: document.documentElement.classList.contains('pink')
              ? '0 8px 32px rgba(221, 114, 133, 0.2)'
              : document.documentElement.classList.contains('dark')
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: document.documentElement.classList.contains('pink') 
              ? '#7c2d12'
              : document.documentElement.classList.contains('dark')
              ? '#ffffff'
              : '#1e293b'
          }}
        >
          {/* Header with branding - exactly like reference */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold mb-1" style={{
              background: document.documentElement.classList.contains('pink') 
                ? 'linear-gradient(135deg, #f4a261 0%, #e76f51 50%, #e9c46a 100%)'
                : document.documentElement.classList.contains('dark')
                ? 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Whisper Network
            </h1>
            <p className="text-xs mb-2" style={{
              color: document.documentElement.classList.contains('pink') 
                ? 'rgba(76, 29, 149, 0.7)'
                : document.documentElement.classList.contains('dark')
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(30, 41, 59, 0.7)'
            }}>
              A place where voices unite and hearts connect
            </p>

            {/* Category and time - exactly like reference */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full" style={{
                background: document.documentElement.classList.contains('pink') 
                  ? 'rgba(76, 29, 149, 0.8)'
                  : document.documentElement.classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(30, 41, 59, 0.8)'
              }}></div>
              <span className="text-xs font-medium" style={{
                color: document.documentElement.classList.contains('pink') 
                  ? 'rgba(76, 29, 149, 0.8)'
                  : document.documentElement.classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(30, 41, 59, 0.8)'
              }}>
                {category?.name || message.category}
              </span>
              <span className="text-xs ml-2" style={{
                color: document.documentElement.classList.contains('pink') 
                  ? 'rgba(76, 29, 149, 0.6)'
                  : document.documentElement.classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(30, 41, 59, 0.6)'
              }}>
                {formatTimeAgo(message.createdAt!)}
              </span>
            </div>
          </div>

          {/* Message content in box - exactly like reference */}
          <div className="rounded-xl p-4 mb-3 border" style={{
            background: document.documentElement.classList.contains('pink') 
              ? 'rgba(76, 29, 149, 0.15)'
              : document.documentElement.classList.contains('dark')
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(30, 41, 59, 0.1)',
            borderColor: document.documentElement.classList.contains('pink') 
              ? 'rgba(76, 29, 149, 0.25)'
              : document.documentElement.classList.contains('dark')
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(30, 41, 59, 0.15)'
          }}>
            <p className="text-center text-base leading-relaxed" style={{
              color: document.documentElement.classList.contains('pink') 
                ? '#4c1d95'
                : document.documentElement.classList.contains('dark')
                ? '#ffffff'
                : '#1e293b'
            }}>
              "{message.content}"
            </p>
          </div>

          {/* Spotify track display for downloads */}
          {(message.spotifyTrackId || message.spotifyLink) && (
            <div className="mb-4 p-3 rounded-lg border" style={{
              background: document.documentElement.classList.contains('pink') 
                ? 'rgba(76, 29, 149, 0.08)'
                : document.documentElement.classList.contains('dark')
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(30, 41, 59, 0.05)',
              borderColor: document.documentElement.classList.contains('pink') 
                ? 'rgba(76, 29, 149, 0.15)'
                : document.documentElement.classList.contains('dark')
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(30, 41, 59, 0.1)'
            }}>
              <div className="flex items-center gap-3">
                {message.spotifyAlbumCover && (
                  <img 
                    src={message.spotifyAlbumCover} 
                    alt="Album cover"
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate" style={{
                    color: document.documentElement.classList.contains('pink') 
                      ? '#4c1d95'
                      : document.documentElement.classList.contains('dark')
                      ? '#ffffff'
                      : '#1e293b'
                  }}>
                    {message.spotifyTrackName || 'Unknown Track'}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{
                    color: document.documentElement.classList.contains('pink') 
                      ? 'rgba(76, 29, 149, 0.7)'
                      : document.documentElement.classList.contains('dark')
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(30, 41, 59, 0.7)'
                  }}>
                    {message.spotifyArtistName || 'Unknown Artist'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{
                  color: document.documentElement.classList.contains('pink') 
                    ? 'rgba(76, 29, 149, 0.6)'
                    : document.documentElement.classList.contains('dark')
                    ? 'rgba(255, 255, 255, 0.6)'
                    : 'rgba(30, 41, 59, 0.6)'
                }}>
                  🎵 Spotify
                </div>
              </div>
            </div>
          )}

          {/* Attribution with profile picture - exactly like reference */}
          <div className="text-center mb-4">
            {/* Profile picture if available */}
            {((message.userId && message.user?.profilePicture) || (message.adminId && message.admin?.profilePicture)) && (
              <div className="flex justify-center mb-2">
                <img
                  src={message.user?.profilePicture || message.admin?.profilePicture || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2"
                  style={{
                    borderColor: document.documentElement.classList.contains('pink') 
                      ? 'rgba(76, 29, 149, 0.3)'
                      : document.documentElement.classList.contains('dark')
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(30, 41, 59, 0.3)',
                    objectFit: 'cover'
                  }}
                />
              </div>
            )}
            <p className="text-xs italic" style={{
              color: document.documentElement.classList.contains('pink') 
                ? 'rgba(76, 29, 149, 0.6)'
                : document.documentElement.classList.contains('dark')
                ? 'rgba(255, 255, 255, 0.6)'
                : 'rgba(30, 41, 59, 0.6)'
            }}>
              {/* Show registered user info if available */}
              {message.userId && message.user ? (
                `— ${message.user.displayName || message.user.username} (Registered User)`
              ) : message.adminId && message.admin ? (
                `— ${message.admin.displayName} (Admin)`
              ) : message.senderName ? (
                `— ${message.senderName}`
              ) : (
                '— Anonymous Whisper'
              )}
            </p>
          </div>

          {/* Stats - exactly like reference */}
          <div className="flex items-center justify-center gap-5 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{
                color: document.documentElement.classList.contains('pink') 
                  ? 'rgba(76, 29, 149, 0.8)'
                  : document.documentElement.classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(30, 41, 59, 0.8)'
              }}>♥ {message.reactionCount || 0} hearts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{
                color: document.documentElement.classList.contains('pink') 
                  ? 'rgba(76, 29, 149, 0.8)'
                  : document.documentElement.classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(30, 41, 59, 0.8)'
              }}>💬 {message.replies?.length || 0} replies</span>
            </div>
          </div>

          {/* Footer - exactly like reference */}
          <div className="text-center pt-3 border-t" style={{
            borderColor: document.documentElement.classList.contains('pink') 
              ? 'rgba(76, 29, 149, 0.1)'
              : document.documentElement.classList.contains('dark')
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(30, 41, 59, 0.1)'
          }}>
            <p className="text-xs" style={{
              color: document.documentElement.classList.contains('pink') 
                ? 'rgba(76, 29, 149, 0.5)'
                : document.documentElement.classList.contains('dark')
                ? 'rgba(255, 255, 255, 0.5)'
                : 'rgba(30, 41, 59, 0.5)'
            }}>
              This whisper was shared on Whisper Network • {new Date(message.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}