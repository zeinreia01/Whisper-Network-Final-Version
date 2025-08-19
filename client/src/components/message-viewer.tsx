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
        cardBackground = 'linear-gradient(135deg, #f472b6 0%, #ec4899 25%, #db2777 50%, #be185d 75%, #9d174d 100%)';
      } else if (isDark) {
        cardBackground = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #4338ca 75%, #4f46e5 100%)';
      } else {
        cardBackground = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 50%, #e2e8f0 75%, #cbd5e1 100%)';
      }

      messageCard.style.cssText = `
        background: ${cardBackground};
        border-radius: 16px;
        padding: 24px;
        color: ${isPink ? '#4c1d95' : isDark ? 'white' : '#1e293b'};
        position: relative;
        width: 400px;
        display: flex;
        flex-direction: column;
        border: 1px solid ${isPink ? 'rgba(168, 85, 247, 0.3)' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
        box-shadow: ${isPink ? '0 8px 32px rgba(168, 85, 247, 0.15)' : '0 8px 32px rgba(0, 0, 0, 0.2)'};
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
        titleGradient = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)';
      } else if (isDark) {
        titleGradient = 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)';
      } else {
        titleGradient = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
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
        color: ${isPink ? 'rgba(76, 29, 149, 0.7)' : isDark ? 'rgba(255,255,255,0.7)' : 'rgba(30, 41, 59, 0.7)'};
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
        background: ${isPink ? 'rgba(76, 29, 149, 0.8)' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30, 41, 59, 0.8)'};
        border-radius: 50%;
      `;

      const categoryText = document.createElement('span');
      categoryText.style.cssText = `
        font-size: 12px;
        color: ${isPink ? 'rgba(76, 29, 149, 0.8)' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30, 41, 59, 0.8)'};
        font-weight: 500;
      `;
      categoryText.textContent = category?.name || message.category;

      const timeText = document.createElement('span');
      timeText.style.cssText = `
        font-size: 12px;
        color: ${isPink ? 'rgba(76, 29, 149, 0.6)' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30, 41, 59, 0.6)'};
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
        messageBoxBg = 'rgba(76, 29, 149, 0.15)';
        messageBoxBorder = 'rgba(76, 29, 149, 0.25)';
      } else if (isDark) {
        messageBoxBg = 'rgba(255,255,255,0.1)';
        messageBoxBorder = 'rgba(255,255,255,0.15)';
      } else {
        messageBoxBg = 'rgba(30, 41, 59, 0.1)';
        messageBoxBorder = 'rgba(30, 41, 59, 0.15)';
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
        color: ${isPink ? '#4c1d95' : isDark ? 'white' : '#1e293b'};
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
        color: ${isPink ? 'rgba(76, 29, 149, 0.6)' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30, 41, 59, 0.6)'};
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
        color: ${isPink ? 'rgba(76, 29, 149, 0.8)' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30, 41, 59, 0.8)'};
        font-size: 12px;
      `;
      heartsCount.innerHTML = `♥ ${message.reactionCount || 0} hearts`;

      const repliesCount = document.createElement('div');
      repliesCount.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        color: ${isPink ? 'rgba(76, 29, 149, 0.8)' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(30, 41, 59, 0.8)'};
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
        color: ${isPink ? 'rgba(76, 29, 149, 0.5)' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30, 41, 59, 0.5)'};
        font-size: 10px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid ${isPink ? 'rgba(76, 29, 149, 0.1)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30, 41, 59, 0.1)'};
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
              ? 'linear-gradient(135deg, #f472b6 0%, #ec4899 25%, #db2777 50%, #be185d 75%, #9d174d 100%)'
              : document.documentElement.classList.contains('dark')
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #4338ca 75%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #f1f5f9 50%, #e2e8f0 75%, #cbd5e1 100%)',
            border: document.documentElement.classList.contains('pink') 
              ? '1px solid rgba(168, 85, 247, 0.3)'
              : document.documentElement.classList.contains('dark')
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
            boxShadow: document.documentElement.classList.contains('pink')
              ? '0 8px 32px rgba(168, 85, 247, 0.15)'
              : document.documentElement.classList.contains('dark')
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: document.documentElement.classList.contains('pink') 
              ? '#4c1d95'
              : document.documentElement.classList.contains('dark')
              ? '#ffffff'
              : '#1e293b'
          }}
        >
          {/* Header with branding - exactly like reference */}
          <div className="text-center mb-5">
            <h1 className="text-xl font-bold mb-1" style={{
              background: document.documentElement.classList.contains('pink') 
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
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

          {/* Attribution - exactly like reference */}
          <div className="text-center mb-4">
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