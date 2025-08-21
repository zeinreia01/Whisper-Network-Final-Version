
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface GoogleAdSenseInlineProps {
  onClose: () => void;
}

export function GoogleAdSenseInline({ onClose }: GoogleAdSenseInlineProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-8 px-4">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Advertisement
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Google AdSense Ad Unit */}
          <div className="min-h-[120px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Advertisement
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Google AdSense
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdSenseContainerProps {
  pageType: "home" | "dashboard" | "userboard" | "leaderboard" | "anonymous" | "boards";
}

export function AdSenseContainer({ pageType }: AdSenseContainerProps) {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);

  useEffect(() => {
    // Check if user has dismissed ads for this session
    const dismissed = sessionStorage.getItem(`ad-dismissed-${pageType}`);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show ad based on scroll position
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show ad when user has scrolled at least 50% of viewport height
      if (scrollPosition > windowHeight * 0.5 && !hasScrolledEnough) {
        setHasScrolledEnough(true);
        
        // Add a delay before showing the ad
        setTimeout(() => {
          setIsAdVisible(true);
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageType, hasScrolledEnough]);

  const handleCloseAd = () => {
    setIsAdVisible(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem(`ad-dismissed-${pageType}`, 'true');
  };

  if (isDismissed || !isAdVisible) return null;

  return <GoogleAdSenseInline onClose={handleCloseAd} />;
}
