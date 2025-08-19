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
      // Create a clean container for download image with proper sizing
      const downloadContainer = document.createElement('div');
      downloadContainer.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 400px;
        background: transparent;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
        box-sizing: border-box;
      `;

      // Create the message card with proper theme colors and gradients
      const messageCard = document.createElement('div');
      const isDark = document.documentElement.classList.contains('dark');
      const isPink = document.documentElement.classList.contains('pink');
      
      let cardBackground;
      if (isPink) {
        cardBackground = 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 25%, #c084fc 50%, #e879f9 75%, #f0abfc 100%)';
      } else if (isDark) {
        cardBackground = 'linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)';
      } else {
        cardBackground = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)';
      }
      
      messageCard.style.cssText = `
        background: ${cardBackground};
        border-radius: 16px;
        padding: 24px;
        color: ${isPink || isDark ? 'white' : '#1e293b'};
        position: relative;
        width: 400px;
        display: flex;
        flex-direction: column;
        border: 1px solid ${isPink || isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
      `;

      // Header with branding - exactly like reference
      const header = document.createElement('div');
      header.style.cssText = `
        text-align: center;
        margin-bottom: 20px;
      `;

      const appTitle = document.createElement('h1');
      let titleGradient;
      if (isPink) {
        titleGradient = 'linear-gradient(135deg, #f0abfc 0%, #e879f9 50%, #c084fc 100%)';
      } else if (isDark) {
        titleGradient = 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)';
      } else {
        titleGradient = 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)';
      }
      
      appTitle.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 4px 0;
        background: ${titleGradient};
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      `;
      appTitle.textContent = 'Whisper Network';

      const subtitle = document.createElement('p');
      subtitle.style.cssText = `
        font-size: 12px;
        color: ${isPink || isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'};
        margin: 0 0 8px 0;
        font-weight: 400;
      `;
      subtitle.textContent = 'A place where voices unite and hearts connect';

      // Category and time - exactly like reference
      const categoryTime = document.createElement('div');
      categoryTime.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;
      `;

      const categoryDot = document.createElement('div');
      categoryDot.style.cssText = `
        width: 6px;
        height: 6px;
        background: rgba(255,255,255,0.8);
        border-radius: 50%;
      `;

      const categoryText = document.createElement('span');
      categoryText.style.cssText = `
        font-size: 12px;
        color: ${isPink || isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'};
        font-weight: 500;
      `;
      categoryText.textContent = category?.name || message.category;

      const timeText = document.createElement('span');
      timeText.style.cssText = `
        font-size: 12px;
        color: ${isPink || isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
        margin-left: 8px;
      `;
      timeText.textContent = formatTimeAgo(message.createdAt!);

      categoryTime.appendChild(categoryDot);
      categoryTime.appendChild(categoryText);
      categoryTime.appendChild(timeText);

      header.appendChild(appTitle);
      header.appendChild(subtitle);
      header.appendChild(categoryTime);

      // Main message content in box with proper theme colors
      const messageBox = document.createElement('div');
      let messageBoxBg, messageBoxBorder;
      if (isPink) {
        messageBoxBg = 'rgba(255,255,255,0.15)';
        messageBoxBorder = 'rgba(255,255,255,0.25)';
      } else if (isDark) {
        messageBoxBg = 'rgba(255,255,255,0.1)';
        messageBoxBorder = 'rgba(255,255,255,0.15)';
      } else {
        messageBoxBg = 'rgba(0,0,0,0.1)';
        messageBoxBorder = 'rgba(0,0,0,0.15)';
      }
      
      messageBox.style.cssText = `
        background: ${messageBoxBg};
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        border: 1px solid ${messageBoxBorder};
      `;

      const messageContent = document.createElement('div');
      messageContent.style.cssText = `
        font-size: 16px;
        line-height: 1.4;
        color: ${isPink || isDark ? 'white' : '#1e293b'};
        text-align: center;
        font-weight: 400;
      `;
      messageContent.textContent = `"${message.content}"`;

      messageBox.appendChild(messageContent);

      // Attribution with proper theme colors
      const attribution = document.createElement('div');
      attribution.style.cssText = `
        text-align: center;
        font-size: 12px;
        color: ${isPink || isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
        font-style: italic;
        margin: 12px 0;
      `;
      // Show registered user info if available
      if (message.userId && message.user) {
        attribution.textContent = `— ${message.user.displayName || message.user.username} (Registered User)`;
      } else if (message.adminId && message.admin) {
        attribution.textContent = `— ${message.admin.displayName} (Admin)`;
      } else if (message.senderName) {
        attribution.textContent = `— ${message.senderName}`;
      } else {
        attribution.textContent = '— Anonymous Whisper';
      }

      // Stats section - exactly like reference
      const stats = document.createElement('div');
      stats.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin: 16px 0;
      `;

      const heartsCount = document.createElement('div');
      heartsCount.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.8);
        font-size: 12px;
      `;
      heartsCount.innerHTML = `♥ ${message.reactionCount || 0} hearts`;

      const repliesCount = document.createElement('div');
      repliesCount.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.8);
        font-size: 12px;
      `;
      const totalReplies = message.replies ? message.replies.length : 0;
      repliesCount.innerHTML = `💬 ${totalReplies} replies`;

      stats.appendChild(heartsCount);
      stats.appendChild(repliesCount);

      // Footer - exactly like reference
      const footer = document.createElement('div');
      footer.style.cssText = `
        text-align: center;
        color: rgba(255,255,255,0.5);
        font-size: 10px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
      `;
      footer.textContent = `This whisper was shared on Whisper Network • ${new Date(message.createdAt!).toLocaleDateString()}`;

      // Assemble the card
      messageCard.appendChild(header);
      messageCard.appendChild(messageBox);
      messageCard.appendChild(attribution);
      messageCard.appendChild(stats);
      messageCard.appendChild(footer);
      downloadContainer.appendChild(messageCard);
      document.body.appendChild(downloadContainer);

      // Generate image with proper sizing and background
      const canvas = await html2canvas(downloadContainer, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        backgroundColor: null, // Transparent background
        width: 440, // Add padding space
        height: downloadContainer.scrollHeight + 40,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Clean up
      document.body.removeChild(downloadContainer);

      // Download the image
      const link = document.createElement('a');
      link.download = `whisper-${message.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
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

        {/* Instagram-style Message Display - matching reference exactly */}
        <div 
          ref={messageRef}
          className="p-6 rounded-xl border relative overflow-hidden bg-card"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '400px',
            margin: '0 auto',
            background: document.documentElement.classList.contains('pink') 
              ? 'linear-gradient(135deg, #4c1d95 0%, #581c87 30%, #6b21a8 70%, #7c3aed 100%)'
              : document.documentElement.classList.contains('dark')
              ? 'linear-gradient(135deg, #1f2937 0%, #374151 30%, #4b5563 70%, #6b7280 100%)'
              : 'linear-gradient(135deg, #1f2937 0%, #374151 30%, #4b5563 70%, #6b7280 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: '#ffffff'
          }}
        >
          {/* Header with branding - exactly like reference */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold mb-1" style={{
              background: document.documentElement.classList.contains('pink') 
                ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                : 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Whisper Network
            </h1>
            <p className="text-xs text-white opacity-70 mb-2">
              A place where voices unite and hearts connect
            </p>
            
            {/* Category and time - exactly like reference */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-white opacity-80 rounded-full"></div>
              <span className="text-xs text-white opacity-80 font-medium">
                {category?.name || message.category}
              </span>
              <span className="text-xs text-white opacity-60 ml-2">
                {formatTimeAgo(message.createdAt!)}
              </span>
            </div>
          </div>

          {/* Message content in box - exactly like reference */}
          <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-3 border border-white border-opacity-15">
            <p className="text-white text-center text-base leading-relaxed">
              "{message.content}"
            </p>
          </div>

          {/* Attribution - exactly like reference */}
          <div className="text-center mb-4">
            <p className="text-xs text-white opacity-60 italic">
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
              <span className="text-white opacity-80 text-xs">♥ {message.reactionCount || 0} hearts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-white opacity-80 text-xs">💬 {message.replies?.length || 0} replies</span>
            </div>
          </div>

          {/* Footer - exactly like reference */}
          <div className="text-center pt-3 border-t border-white border-opacity-10">
            <p className="text-white opacity-50 text-xs">
              This whisper was shared on Whisper Network • {new Date(message.createdAt!).toLocaleDateString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}