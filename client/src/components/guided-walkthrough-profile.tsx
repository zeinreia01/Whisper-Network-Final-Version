import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

const profileWalkthroughSteps: WalkthroughStep[] = [
  {
    id: "profile-header",
    title: "Your Profile Header 👤",
    description: "This shows your profile picture, display name, and bio. Click edit to customize your profile appearance.",
    target: "[data-tour-profile-header]",
    position: "bottom"
  },
  {
    id: "profile-stats",
    title: "Your Activity Stats 📊",
    description: "See your message count, replies, hearts received, and follower statistics at a glance.",
    target: "[data-tour-profile-stats]",
    position: "top"
  },
  {
    id: "anonymous-link",
    title: "Anonymous Messages Link 🔗",
    description: "Share this special link to receive anonymous messages from anyone! Perfect for collecting feedback or confessions.",
    target: "[data-tour-anonymous-link]",
    position: "top"
  },
  {
    id: "music-section",
    title: "Profile Music 🎵",
    description: "Add a Spotify song to your profile to show your music taste! Others can see what you're listening to.",
    target: "[data-tour-music-section]",
    position: "bottom"
  },
  {
    id: "board-posts",
    title: "Your Board 📋",
    description: "This is your personal board where others can post messages. You can customize and manage posts here.",
    target: "[data-tour-board-posts]",
    position: "top"
  },
  {
    id: "public-messages",
    title: "Your Public Messages 💬",
    description: "All your public messages are displayed here. These are visible to everyone in the community.",
    target: "[data-tour-public-messages]",
    position: "top"
  },
  {
    id: "follow-system",
    title: "Follow & Connect 👥",
    description: "Build connections by following other users and letting them follow you back for a closer community experience.",
    target: "[data-tour-follow-system]",
    position: "bottom"
  }
];

export function GuidedWalkthroughProfile() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check if user has seen the profile walkthrough before
    const hasSeenWalkthrough = localStorage.getItem('whisper-network-profile-walkthrough-completed');
    
    // Only show if it's the user's own profile and they haven't seen it
    const isOwnProfile = window.location.pathname.includes('/profile/') && 
                        document.querySelector('[data-tour-profile-header]');
    
    if (!hasSeenWalkthrough && isOwnProfile) {
      setTimeout(() => {
        setIsVisible(true);
        highlightStep(0);
      }, 1500); // Delay to let page content load
    }
  }, []);

  const highlightStep = (stepIndex: number) => {
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
    }

    const step = profileWalkthroughSteps[stepIndex];
    if (!step) return;

    // Find target element
    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (targetElement) {
      // Highlight the element
      targetElement.style.position = 'relative';
      targetElement.style.zIndex = '1001';
      targetElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 0 6px rgba(59, 130, 246, 0.3)';
      targetElement.style.borderRadius = '8px';
      
      // Scroll element into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
      
      setHighlightedElement(targetElement);
    }
  };

  const nextStep = () => {
    if (currentStep < profileWalkthroughSteps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      highlightStep(newStep);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      highlightStep(newStep);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = () => {
    // Remove highlight
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
    }
    
    // Mark as completed
    localStorage.setItem('whisper-network-profile-walkthrough-completed', 'true');
    setIsVisible(false);
  };

  const getTooltipPosition = (step: WalkthroughStep) => {
    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = targetElement.getBoundingClientRect();
    const tooltipOffset = 20;

    switch (step.position) {
      case 'top':
        return {
          top: `${rect.top - tooltipOffset}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + tooltipOffset}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - tooltipOffset}px`,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + tooltipOffset}px`,
          transform: 'translate(0, -50%)'
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  if (!isVisible) return null;

  const currentStepData = profileWalkthroughSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-1000" />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-1002 max-w-sm bg-white dark:bg-gray-800 shadow-2xl border-2 border-blue-500"
        style={getTooltipPosition(currentStepData)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="p-1 h-auto text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {currentStepData.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {currentStep + 1} of {profileWalkthroughSteps.length}
            </span>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </Button>
              )}
              
              <Button
                onClick={nextStep}
                size="sm"
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
              >
                {currentStep === profileWalkthroughSteps.length - 1 ? (
                  "Finish"
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-xs text-gray-500 hover:text-gray-700 w-full"
            >
              Skip Profile Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}