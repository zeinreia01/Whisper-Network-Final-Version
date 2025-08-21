import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Download, Heart, MessageCircle, Share2, Copy, Facebook, Twitter, MessageSquare, Send } from "lucide-react";
import { categories } from "@/lib/categories";
import { SpotifyTrackDisplay } from "@/components/spotify-track-display";
import type { MessageWithReplies } from "@shared/schema";
import html2canvas from "html2canvas";
import { formatTimeAgo } from "@/lib/utils";

interface MessageViewerProps {
  message: MessageWithReplies;
  trigger?: React.ReactNode;
}

export function MessageViewer({ message, trigger }: MessageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const category = categories.find(c => c.name === message.category);
  const isUserBoardMessage = 'recipient' in message && message.recipient;

  const downloadAsImage = async () => {
    setIsDownloading(true);
    try {
      const element = messageRef.current;
      if (!element) {
        throw new Error("Message element not found");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(element, {
        backgroundColor: isUserBoardMessage ? "#1a1a1a" : "#ffffff",
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 400,
        height: element.scrollHeight + 20,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-message-viewer]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'static';
            clonedElement.style.margin = '0';
            clonedElement.style.display = 'block';
            clonedElement.style.overflow = 'visible';
            
            // Fix font rendering for clean text - prevent text cutoff
            const allText = clonedElement.querySelectorAll('*');
            allText.forEach((el: any) => {
              el.style.textRendering = 'optimizeLegibility';
              el.style.webkitFontSmoothing = 'antialiased';
              el.style.mozOsxFontSmoothing = 'grayscale';
              el.style.lineHeight = '1.4';
              el.style.padding = '2px 0';
              el.style.boxSizing = 'border-box';
            });
          }
        }
      });

      const link = document.createElement("a");
      const fileName = isUserBoardMessage ? `board-post-${message.id}.png` : `whisper-${message.id}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();

      toast({
        title: "Success",
        description: isUserBoardMessage ? "Board post saved as image!" : "Whisper saved as image!",
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Error",
        description: "Failed to save image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this message: "${message.content.substring(0, 100)}..."`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${message.content.substring(0, 200)}..." - Shared via Whisper Network`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View {isUserBoardMessage ? "Post" : "Whisper"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isUserBoardMessage ? "Board Post Preview" : "Whisper Preview"}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={downloadAsImage}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                disabled={isDownloading}
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Saving...' : 'Save as Image'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Different designs for user board vs public dashboard */}
        {isUserBoardMessage ? (
          // User Board Design - Exact umamin.link style (dark theme, Twitter-like)
          <div 
            ref={messageRef}
            data-message-viewer
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              backgroundColor: '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: '16px',
              padding: '20px 24px',
              maxWidth: '400px',
              margin: '0 auto',
              color: '#ffffff'
            }}
          >
            {/* Header with user avatar and info - exactly like umamin.link */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#4a4a4a',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff'
                }}
              >
                {message.senderName ? message.senderName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1">
                <div style={{ fontWeight: '600', fontSize: '15px', color: '#ffffff' }}>
                  {message.senderName || "Anonymous"}
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  @{message.senderName?.toLowerCase() || "anonymous"} • {formatTimeAgo(message.createdAt || new Date())}
                </div>
              </div>
              <div style={{ fontSize: '16px', color: '#6b7280', fontWeight: 'bold' }}>•••</div>
            </div>

            {/* Message content - clean and readable */}
            <div style={{ 
              color: '#ffffff', 
              fontSize: '15px', 
              lineHeight: '1.4', 
              marginBottom: '16px',
              wordWrap: 'break-word'
            }}>
              {message.content}
            </div>

            {/* Spotify track if available */}
            {message.spotifyTrackId && (
              <div style={{ marginBottom: '12px' }}>
                <SpotifyTrackDisplay
                  track={{
                    id: message.spotifyTrackId,
                    name: message.spotifyTrackName || "",
                    artists: [{ id: "stored", name: message.spotifyArtistName || "" }],
                    album: {
                      id: "stored",
                      name: "Unknown Album",
                      images: message.spotifyAlbumCover ? [{ url: message.spotifyAlbumCover, height: null, width: null }] : [],
                    },
                    external_urls: {
                      spotify: message.spotifyLink || `https://open.spotify.com/track/${message.spotifyTrackId}`,
                    },
                    preview_url: null,
                    duration_ms: 0,
                    popularity: 0,
                  }}
                  size="sm"
                  showPreview={true}
                />
              </div>
            )}

            {/* Category badge - minimal style */}
            {category && (
              <div style={{ marginBottom: '8px' }}>
                <span 
                  style={{ 
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    backgroundColor: category.color + '20',
                    color: category.color,
                    fontWeight: '500'
                  }}
                >
                  {category.name}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Public Dashboard Design - Original gradient design with proper dark mode
          <div 
            ref={messageRef}
            data-message-viewer
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              width: '400px',
              minHeight: '500px',
              margin: '0 auto',
              padding: '32px',
              boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              color: '#ffffff',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Whisper Network
              </h1>
              <p style={{ 
                fontSize: '14px', 
                margin: '0',
                opacity: '0.9',
                color: '#ffffff'
              }}>
                Anonymous Message
              </p>
            </div>

            {/* Message content */}
            <div style={{ 
              fontSize: '18px', 
              lineHeight: '1.6', 
              marginBottom: '24px', 
              textAlign: 'center',
              color: '#ffffff',
              fontWeight: '400',
              wordWrap: 'break-word'
            }}>
              {message.content}
            </div>

            {/* Spotify track if available */}
            {message.spotifyTrackId && (
              <div style={{ marginBottom: '24px' }}>
                <SpotifyTrackDisplay
                  track={{
                    id: message.spotifyTrackId,
                    name: message.spotifyTrackName || "",
                    artists: [{ id: "stored", name: message.spotifyArtistName || "" }],
                    album: {
                      id: "stored",
                      name: "Unknown Album",
                      images: message.spotifyAlbumCover ? [{ url: message.spotifyAlbumCover, height: null, width: null }] : [],
                    },
                    external_urls: {
                      spotify: message.spotifyLink || `https://open.spotify.com/track/${message.spotifyTrackId}`,
                    },
                    preview_url: null,
                    duration_ms: 0,
                    popularity: 0,
                  }}
                  size="sm"
                  showPreview={false}
                />
              </div>
            )}

            {/* Footer */}
            <div style={{ 
              textAlign: 'center', 
              marginTop: 'auto',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.2)'
            }}>
              {category && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ 
                    fontSize: '12px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    fontWeight: '500'
                  }}>
                    {category.name}
                  </span>
                </div>
              )}
              <div style={{ 
                fontSize: '14px', 
                color: '#ffffff',
                opacity: '0.8'
              }}>
                From: {message.senderName || "Anonymous"}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#ffffff',
                opacity: '0.6',
                marginTop: '4px'
              }}>
                {formatTimeAgo(message.createdAt || new Date())}
              </div>
            </div>
          </div>
        )}

        {/* Social sharing buttons */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={shareToFacebook}>
            <Facebook className="w-4 h-4 mr-2" />
            Facebook
          </Button>
          <Button variant="outline" size="sm" onClick={shareToTwitter}>
            <Twitter className="w-4 h-4 mr-2" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}