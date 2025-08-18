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
      // Create a temporary container that mimics the actual app styling
      const downloadContainer = document.createElement('div');
      downloadContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 600px;
        min-height: 400px;
        background: #1a1a2e;
        padding: 40px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        box-sizing: border-box;
        border-radius: 20px;
        border: 2px solid #4a5568;
      `;

      // Create the message card with actual app styling
      const messageCard = document.createElement('div');
      messageCard.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 30px;
        color: white;
        position: relative;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      `;

      // Add app title header
      const header = document.createElement('div');
      header.style.cssText = `
        text-align: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
      `;

      const appTitle = document.createElement('h2');
      appTitle.style.cssText = `
        color: white;
        font-size: 18px;
        font-weight: 500;
        margin: 0;
        opacity: 0.9;
      `;
      appTitle.textContent = 'A place where voices unite and hearts connect';

      header.appendChild(appTitle);

      // Add category and time info
      const metaInfo = document.createElement('div');
      metaInfo.style.cssText = `
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
      `;

      const categoryDot = document.createElement('span');
      categoryDot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        display: inline-block;
      `;

      const categoryName = document.createElement('span');
      categoryName.style.cssText = `
        color: white;
        font-size: 14px;
        font-weight: 500;
      `;
      categoryName.textContent = category?.name || message.category;

      const timeAgo = document.createElement('span');
      timeAgo.style.cssText = `
        color: rgba(255,255,255,0.7);
        font-size: 14px;
      `;
      timeAgo.textContent = `• ${formatTimeAgo(message.createdAt!)}`;

      metaInfo.appendChild(categoryDot);
      metaInfo.appendChild(categoryName);
      metaInfo.appendChild(timeAgo);

      // Add message content
      const content = document.createElement('div');
      content.style.cssText = `
        font-size: 16px;
        line-height: 1.6;
        color: white;
        margin: 20px 0;
        font-style: italic;
      `;
      content.textContent = `"${message.content}"`;

      // Add sender attribution
      const attribution = document.createElement('div');
      attribution.style.cssText = `
        color: rgba(255,255,255,0.8);
        font-style: italic;
        margin: 20px 0;
        text-align: center;
      `;
      attribution.textContent = '— Anonymous Whisper';

      // Add interaction stats
      const stats = document.createElement('div');
      stats.style.cssText = `
        display: flex;
        align-items: center;
        gap: 20px;
        margin: 20px 0;
        padding: 15px 0;
        border-top: 1px solid rgba(255,255,255,0.2);
      `;

      const heartsCount = document.createElement('div');
      heartsCount.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,255,255,0.8);
        font-size: 14px;
      `;
      heartsCount.innerHTML = `♥ ${message.reactionCount || 0} hearts`;

      const repliesCount = document.createElement('div');
      repliesCount.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,255,255,0.8);
        font-size: 14px;
      `;
      const totalReplies = message.replies ? message.replies.length : 0;
      repliesCount.innerHTML = `💬 ${totalReplies} replies`;

      stats.appendChild(heartsCount);
      stats.appendChild(repliesCount);

      // Add footer with app branding
      const footer = document.createElement('div');
      footer.style.cssText = `
        text-align: center;
        color: rgba(255,255,255,0.6);
        font-size: 12px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.2);
      `;
      footer.textContent = `This whisper was shared on Whisper Network • ${new Date().toLocaleDateString()}`;

      // Assemble the message card
      messageCard.appendChild(header);
      messageCard.appendChild(metaInfo);
      messageCard.appendChild(content);
      messageCard.appendChild(attribution);
      messageCard.appendChild(stats);
      messageCard.appendChild(footer);

      downloadContainer.appendChild(messageCard);
      document.body.appendChild(downloadContainer);

      // Generate high-quality image that matches the app design
      const canvas = await html2canvas(downloadContainer, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: 'transparent',
        width: 600,
        height: downloadContainer.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Clean up
      document.body.removeChild(downloadContainer);

      // Download the styled image
      const link = document.createElement('a');
      link.download = `whisper-${message.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
                  ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #06b6d4 100%)'
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
                ? 'rgba(255,255,255,0.15)' 
                : 'rgba(255,255,255,0.9)',
              borderColor: document.documentElement.classList.contains('pink') || document.documentElement.classList.contains('dark') 
                ? 'rgba(255,255,255,0.3)' 
                : 'rgba(0,0,0,0.1)'
            }}
          >
            <blockquote 
              className="text-xl leading-relaxed text-center italic message-text"
              style={{
                color: document.documentElement.classList.contains('pink') || document.documentElement.classList.contains('dark')
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