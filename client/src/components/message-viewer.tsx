import { useState, useRef } from "react";
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
      // Create optimized download container
      const downloadContainer = document.createElement('div');
      downloadContainer.style.position = 'absolute';
      downloadContainer.style.left = '-9999px';
      downloadContainer.style.top = '-9999px';
      downloadContainer.style.width = '600px';
      downloadContainer.style.height = 'auto';
      downloadContainer.style.fontFamily = '"Times New Roman", serif';

      // Check if pink theme is active for reddish-pink save UI
      const isPinkTheme = document.documentElement.classList.contains('pink');

      if (isPinkTheme) {
        downloadContainer.style.background = 'linear-gradient(135deg, #e91e63 0%, #f06292 25%, #ec407a 50%, #ad1457 75%, #880e4f 100%)';
        downloadContainer.style.boxShadow = '0 20px 40px rgba(233, 30, 99, 0.3), 0 8px 16px rgba(240, 98, 146, 0.2)';
      } else {
        downloadContainer.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
      }

      downloadContainer.style.padding = '32px';
      downloadContainer.style.borderRadius = '16px';
      downloadContainer.style.color = '#ffffff';

      // Create Instagram-optimized content
      downloadContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: bold; background: ${isPinkTheme ? 'linear-gradient(135deg, #ffffff 0%, #fce4ec 50%, #f8bbd9 100%)' : 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'}; -webkit-background-clip: text; background-clip: text; color: transparent; margin: 0 0 8px 0; font-family: 'Times New Roman', serif;">
            Whisper Network
          </h1>
          <p style="color: #94a3b8; font-size: 14px; margin: 0; font-family: 'Times New Roman', serif;">
            A place where voices unite and hearts connect
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${category?.color?.replace('bg-', '') || '#8b5cf6'};"></div>
            <span style="background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 12px; font-size: 14px; color: #e2e8f0; font-family: 'Times New Roman', serif;">
              ${category?.name || message.category}
            </span>
          </div>
          <span style="color: #94a3b8; font-size: 14px; font-family: 'Times New Roman', serif;">
            ${formatTimeAgo(message.createdAt!)}
          </span>
        </div>

        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.2);">
          <blockquote style="font-size: 20px; line-height: 1.6; color: #f8fafc; text-align: center; font-style: italic; margin: 0; font-family: 'Times New Roman', serif;">
            "${message.content}"
          </blockquote>
        </div>

        ${message.spotifyLink ? `
          <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
              <span style="color: #22c55e; font-size: 20px;">🎵</span>
              <div style="text-align: center;">
                <p style="font-size: 14px; font-weight: 500; color: #22c55e; margin: 0 0 4px 0; font-family: 'Times New Roman', serif;">
                  ${getSpotifyDisplayName(message.spotifyLink)}
                </p>
                <p style="color: #16a34a; font-size: 12px; margin: 0; font-family: 'Times New Roman', serif;">
                  Listen on Spotify
                </p>
              </div>
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; margin-bottom: 24px;">
          <p style="color: #94a3b8; font-style: italic; font-size: 16px; margin: 0; font-family: 'Times New Roman', serif;">
            — ${message.senderName || 'Anonymous Whisper'}
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: center; gap: 24px; font-size: 14px; color: #94a3b8; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: #f87171;">♥</span>
            <span style="font-family: 'Times New Roman', serif;">${message.reactionCount || 0} hearts</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="color: #60a5fa;">💬</span>
            <span style="font-family: 'Times New Roman', serif;">${message.replies?.length || 0} replies</span>
          </div>
        </div>

        <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="font-size: 12px; color: #64748b; margin: 0; font-family: 'Times New Roman', serif;">
            This whisper was shared on Whispering Network • ${new Date(message.createdAt!).toLocaleDateString()}
          </p>
        </div>
      `;

      document.body.appendChild(downloadContainer);

      const canvas = await html2canvas(downloadContainer, {
        backgroundColor: '#1a1a2e',
        scale: 4, // Ultra high resolution for Instagram quality
        width: 600,
        height: downloadContainer.scrollHeight,
        useCORS: true,
        allowTaint: false,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure gradients render properly in cloned document
          const clonedContainer = clonedDoc.querySelector('div') as HTMLElement;
          if (clonedContainer) {
            clonedContainer.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
          }
        }
      });

      // Clean up
      document.body.removeChild(downloadContainer);

      const link = document.createElement('a');
      link.download = `whispering-network-${message.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
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
          className="p-8 rounded-2xl shadow-xl border relative overflow-hidden"
          style={{
            fontFamily: '"Times New Roman", serif',
            minHeight: '500px',
            maxWidth: '700px',
            margin: '0 auto',
            background: document.documentElement.classList.contains('pink') 
              ? 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 25%, #ec4899 50%, #be185d 75%, #9d174d 100%)'
              : document.documentElement.classList.contains('dark')
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
            backgroundImage: document.documentElement.classList.contains('pink')
              ? 'radial-gradient(circle at 30% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(190, 24, 93, 0.15) 0%, transparent 50%)'
              : document.documentElement.classList.contains('dark')
              ? 'radial-gradient(circle at 30% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
              : 'radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            borderColor: document.documentElement.classList.contains('pink') 
              ? '#f3e8ff'
              : document.documentElement.classList.contains('dark')
              ? '#374151'
              : '#e2e8f0',
            color: document.documentElement.classList.contains('pink') || document.documentElement.classList.contains('dark') ? '#ffffff' : '#1e293b'
          }}
        >
          {/* Header with branding */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{
                background: document.documentElement.classList.contains('pink')
                  ? 'linear-gradient(135deg, #ffffff 0%, #fce7f3 30%, #f9a8d4 60%, #ec4899 100%)'
                  : document.documentElement.classList.contains('dark')
                  ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              Whisper Network
            </h1>
            <p 
              className="text-sm font-serif"
              style={{
                color: document.documentElement.classList.contains('pink') 
                  ? '#fce7f3'
                  : document.documentElement.classList.contains('dark')
                  ? '#cbd5e1'
                  : '#64748b'
              }}
            >
              A place where voices unite and hearts connect
            </p>
          </div>

          {/* Category and timestamp */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${category?.color}`}></div>
              <Badge variant="secondary" className="text-sm">
                {category?.name || message.category}
              </Badge>
            </div>
            <div 
              className="text-sm font-serif"
              style={{
                color: document.documentElement.classList.contains('pink') 
                  ? '#fce7f3'
                  : document.documentElement.classList.contains('dark')
                  ? '#cbd5e1'
                  : '#64748b'
              }}
            >
              {formatTimeAgo(message.createdAt!)}
            </div>
          </div>

          {/* Main message content */}
          <div 
            className="backdrop-blur-sm rounded-xl p-6 mb-6 shadow-lg border"
            style={{
              background: document.documentElement.classList.contains('pink') || document.documentElement.classList.contains('dark') 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(255,255,255,0.7)',
              borderColor: document.documentElement.classList.contains('pink') || document.documentElement.classList.contains('dark') 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(0,0,0,0.1)'
            }}
          >
            <blockquote 
              className="text-xl leading-relaxed text-center italic font-serif"
              style={{
                background: document.documentElement.classList.contains('pink')
                  ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 25%, #f87171 50%, #fca5a5 75%, #ffffff 100%)'
                  : document.documentElement.classList.contains('dark')
                  ? '#ffffff'
                  : '#1e293b',
                WebkitBackgroundClip: document.documentElement.classList.contains('pink') ? 'text' : 'initial',
                backgroundClip: document.documentElement.classList.contains('pink') ? 'text' : 'initial',
                color: document.documentElement.classList.contains('pink') 
                  ? 'transparent'
                  : document.documentElement.classList.contains('dark')
                  ? '#ffffff' 
                  : '#1e293b'
              }}
            >
              "{message.content}"
            </blockquote>
          </div>

          {/* Spotify track if available */}
          {message.spotifyLink && (
            <div className="bg-green-900/20 dark:bg-green-900/20 border border-green-600/30 dark:border-green-600/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-3">
                <Music className="w-5 h-5 text-green-400 dark:text-green-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-green-300 dark:text-green-300 font-serif">{getSpotifyDisplayName(message.spotifyLink)}</p>
                  <p className="text-green-400 dark:text-green-400 text-sm font-serif">Listen on Spotify</p>
                </div>
              </div>
            </div>
          )}

          {/* Author attribution */}
          <div className="text-center mb-6">
            {message.senderName ? (
              <p className="text-gray-300 dark:text-gray-300 italic font-serif">
                — {message.senderName}
              </p>
            ) : (
              <p className="text-gray-400 dark:text-gray-400 italic text-sm font-serif">
                — Anonymous Whisper
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-300 dark:text-gray-300">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span className="font-serif">{message.reactionCount || 0} hearts</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span className="font-serif">{message.replies?.length || 0} replies</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-600 dark:border-gray-600">
            <p className="text-xs text-gray-400 dark:text-gray-400 font-serif">
              This whisper was shared on Whisper Network • {new Date(message.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}