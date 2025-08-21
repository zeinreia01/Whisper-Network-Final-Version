import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/hooks/use-auth";
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

const dashboardWalkthroughSteps: WalkthroughStep[] = [
  {
    id: "create-message",
    title: "Share Your Thoughts 💭",
    description: "Click here to create and post new messages to the community. Express yourself freely and connect with others.",
    target: "[data-tour-create-message]",
    position: "bottom"
  },
  {
    id: "message-feed",
    title: "Community Messages 🌊",
    description: "This is where all community messages appear. Browse through what others are sharing and discover new perspectives.",
    target: "[data-tour-message-feed]",
    position: "top"
  },
  {
    id: "filter-controls",
    title: "Filter & Sort 🔍",
    description: "Use these controls to filter messages by category, sort by date or popularity, and find exactly what interests you.",
    target: "[data-tour-filter-controls]",
    position: "bottom"
  },
  {
    id: "user-stats",
    title: "Your Activity 📊",
    description: "Track your contributions to the community - messages posted, hearts received, and engagement metrics.",
    target: "[data-tour-user-stats]",
    position: "left"
  },
  {
    id: "navigation",
    title: "Navigate Around 🧭",
    description: "Use the navigation menu to explore different sections like your profile, leaderboard, and settings.",
    target: "[data-tour-navigation]",
    position: "right"
  },
  {
    id: "theme-toggle",
    title: "Customize Appearance 🎨",
    description: "Switch between light, dark, and pink themes to personalize your Whisper Network experience.",
    target: "[data-tour-theme-toggle]",
    position: "bottom"
  }
];

export function GuidedWalkthroughDashboard() {
  const { user, admin } = useAuth();
  const [location] = useLocation();
  const [hasShownTour, setHasShownTour] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const waitForElement = (selector: string, maxWait = 5000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime < maxWait) {
          setTimeout(checkElement, 100);
        } else {
          resolve(null);
        }
      };
      checkElement();
    });
  };

  const startTour = async () => {
    // Wait for essential elements to be available
    await waitForElement('[data-tour-filter-controls]');
    await waitForElement('[data-tour-message-feed]');

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      doneBtnText: 'Finish Tour',
      nextBtnText: 'Next →',
      prevBtnText: '← Previous',
      steps: [
        {
          element: '[data-tour-filter-controls]',
          popover: {
            title: 'Search & Discover',
            description: 'Use the search bar to find specific messages or explore different topics. Try searching for keywords like "love", "advice", or any topic you\'re interested in!',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '[data-tour-message-feed]',
          popover: {
            title: 'Community Messages',
            description: 'Here you\'ll see messages from the community. Each message shows the content, category, and you can interact with them by liking or replying. Messages are displayed in a beautiful card layout for easy reading.',
            side: "top",
            align: 'start'
          }
        }
      ],
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the tour?")) {
          driverObj.destroy();
          localStorage.setItem('hasSeenDashboardTour', 'true');
          setHasShownTour(true);
        }
      },
      onDestroyed: () => {
        localStorage.setItem('hasSeenDashboardTour', 'true');
        setHasShownTour(true);
      }
    });

    driverObj.drive();
  };

  useEffect(() => {
    // Check if user has seen the dashboard walkthrough before
    const hasSeenWalkthrough = localStorage.getItem('whisper-network-dashboard-walkthrough-completed');

    // Only show on dashboard page and if user hasn't seen it
    const isDashboardPage = window.location.pathname === '/dashboard' || window.location.pathname === '/';

    if (!hasSeenWalkthrough && isDashboardPage) {
      setTimeout(() => {
        setIsVisible(true);
        startTour();
      }, 2000); // Delay to let page content load
    }
  }, [location]); // Re-run effect when location changes

  const highlightStep = (stepIndex: number) => {
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.style.position = '';
      highlightedElement.style.zIndex = '';
      highlightedElement.style.boxShadow = '';
      highlightedElement.style.borderRadius = '';
    }

    const step = dashboardWalkthroughSteps[stepIndex];
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
    if (currentStep < dashboardWalkthroughSteps.length - 1) {
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
    localStorage.setItem('whisper-network-dashboard-walkthrough-completed', 'true');
    setIsVisible(false);
  };

  const getTooltipPosition = (step: WalkthroughStep) => {
    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) return { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      maxWidth: 'calc(100vw - 32px)',
      position: 'fixed' as const,
      zIndex: 10000
    };

    const rect = targetElement.getBoundingClientRect();
    const tooltipOffset = 20;
    const isMobile = window.innerWidth < 768;
    const maxWidth = isMobile ? 'calc(100vw - 32px)' : '384px';

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let position: any = {
      maxWidth,
      position: 'fixed' as const,
      zIndex: 10000
    };

    if (isMobile) {
      // On mobile, always position at bottom with some padding
      position = {
        ...position,
        bottom: '80px',
        left: '16px',
        right: '16px',
        transform: 'none',
        width: 'auto'
      };
    } else {
      switch (step.position) {
        case 'top':
          let topPos = rect.top - tooltipOffset;
          let leftPos = rect.left + rect.width / 2;

          if (topPos < 20) topPos = rect.bottom + tooltipOffset;
          if (leftPos < 192) leftPos = 192;
          if (leftPos > viewportWidth - 192) leftPos = viewportWidth - 192;

          position = {
            ...position,
            top: `${topPos}px`,
            left: `${leftPos}px`,
            transform: topPos === rect.bottom + tooltipOffset ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
          };
          break;
        case 'bottom':
          let bottomTopPos = rect.bottom + tooltipOffset;
          let bottomLeftPos = rect.left + rect.width / 2;

          if (bottomTopPos > viewportHeight - 200) bottomTopPos = rect.top - tooltipOffset;
          if (bottomLeftPos < 192) bottomLeftPos = 192;
          if (bottomLeftPos > viewportWidth - 192) bottomLeftPos = viewportWidth - 192;

          position = {
            ...position,
            top: `${bottomTopPos}px`,
            left: `${bottomLeftPos}px`,
            transform: bottomTopPos === rect.top - tooltipOffset ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
          };
          break;
        case 'left':
          let leftTopPos = rect.top + rect.height / 2;
          let leftLeftPos = rect.left - tooltipOffset;

          if (leftLeftPos < 20) leftLeftPos = rect.right + tooltipOffset;
          if (leftTopPos < 100) leftTopPos = 100;
          if (leftTopPos > viewportHeight - 100) leftTopPos = viewportHeight - 100;

          position = {
            ...position,
            top: `${leftTopPos}px`,
            left: `${leftLeftPos}px`,
            transform: leftLeftPos === rect.right + tooltipOffset ? 'translate(0, -50%)' : 'translate(-100%, -50%)'
          };
          break;
        case 'right':
          let rightTopPos = rect.top + rect.height / 2;
          let rightLeftPos = rect.right + tooltipOffset;

          if (rightLeftPos > viewportWidth - 400) rightLeftPos = rect.left - tooltipOffset;
          if (rightTopPos < 100) rightTopPos = 100;
          if (rightTopPos > viewportHeight - 100) rightTopPos = viewportHeight - 100;

          position = {
            ...position,
            top: `${rightTopPos}px`,
            left: `${rightLeftPos}px`,
            transform: rightLeftPos === rect.left - tooltipOffset ? 'translate(-100%, -50%)' : 'translate(0, -50%)'
          };
          break;
        default:
          position = {
            ...position,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          };
      }
    }

    return position;
  };

  if (!isVisible) return null;

  const currentStepData = dashboardWalkthroughSteps[currentStep];

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
              {currentStep + 1} of {dashboardWalkthroughSteps.length}
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
                {currentStep === dashboardWalkthroughSteps.length - 1 ? (
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
              Skip Dashboard Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}