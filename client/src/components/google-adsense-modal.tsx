import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface GoogleAdSenseModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function GoogleAdSenseModal({ isVisible, onClose }: GoogleAdSenseModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Advertisement
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-auto w-auto text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Google AdSense Ad Unit */}
          <div className="min-h-[100px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
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
  pageType: "home" | "dashboard" | "userboard" | "leaderboard" | "anonymous";
}

export function AdSenseContainer({ pageType }: AdSenseContainerProps) {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed ads for this session
    const dismissed = sessionStorage.getItem(`ad-dismissed-${pageType}`);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show ad after a delay based on page type
    const delay = pageType === "anonymous" ? 5000 : 3000; // Longer delay for anonymous pages
    
    const timer = setTimeout(() => {
      setIsAdVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [pageType]);

  const handleCloseAd = () => {
    setIsAdVisible(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem(`ad-dismissed-${pageType}`, 'true');
  };

  if (isDismissed) return null;

  return (
    <GoogleAdSenseModal 
      isVisible={isAdVisible} 
      onClose={handleCloseAd} 
    />
  );
}