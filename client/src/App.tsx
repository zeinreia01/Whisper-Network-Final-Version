import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { AccessibilityMenu } from "@/components/accessibility-menu";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import MessageThread from "@/pages/message-thread";
import Login from "@/pages/login";
import { UserProfilePage } from "@/pages/user-profile";
import PersonalArchivePage from "@/pages/personal-archive";
import PersonalPage from "@/pages/personal";
import AdminProfilePage from "@/pages/admin-profile";
import AdminPersonalPage from "@/pages/admin-personal";
import AdminProfileViewPage from "@/pages/admin-profile-view";
import AnonymousMessaging from "@/pages/anonymous-messaging";
import { PasswordManagementPage } from "@/pages/password-management";
import { AdminAnnouncementsPage } from "@/pages/admin-announcements";
import LeaderboardPage from "@/pages/leaderboard";
import UserBoard from "@/pages/user-board";
import Boards from "@/pages/boards";
import { useState, useEffect } from "react";

function Router() {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedWhisperingNetwork');
    if (hasVisited) {
      setShowLanding(false);
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('hasVisitedWhisperingNetwork', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <Landing onEnter={handleEnterApp} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="pb-20 sm:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={Admin} />
          <Route path="/message/:id" component={MessageThread} />
          <Route path="/user/:id" component={UserProfilePage} />
          <Route path="/admin/profile" component={AdminProfilePage} />
          <Route path="/admin/profile/:id" component={AdminProfileViewPage} />
          <Route path="/admin/announcements" component={AdminAnnouncementsPage} />
          <Route path="/admin-profile" component={AdminProfilePage} />
          <Route path="/admin-personal" component={AdminPersonalPage} />
          <Route path="/admin/personal" component={AdminPersonalPage} />
          <Route path="/personal" component={PersonalPage} />
          <Route path="/personal-archive" component={PersonalArchivePage} />
          <Route path="/password-management" component={PasswordManagementPage} />
          <Route path="/announcements" component={AdminAnnouncementsPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/boards" component={Boards} />
          <Route path="/board/:username" component={UserBoard} />
          <Route path="/u/:username" component={AnonymousMessaging} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen">
            <AccessibilityMenu />
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;