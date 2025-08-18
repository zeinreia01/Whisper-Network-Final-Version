import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AuthModal } from "@/components/auth-modal";
import { AdminAuthModal } from "@/components/admin-auth-modal";
import { GlobalSearch } from "@/components/global-search";
import { NotificationCenter } from "@/components/notification-center";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, Shield, LogOut, Settings, Home, BarChart3, Menu, Archive, Search, Bell, X, Lock } from "lucide-react";

// Mobile notification button component for bottom navigation
function MobileNotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, admin } = useAuth();
  
  const { data: notifications } = useQuery({
    queryKey: user 
      ? [`/api/notifications/user/${user.id}`]
      : admin 
      ? [`/api/notifications/admin/${admin.id}`]
      : [],
    enabled: !!(user || admin),
    refetchInterval: 30000,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 relative"
      data-testid="tab-notifications"
    >
      <Bell className="h-5 w-5 transition-transform" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
      <span className="text-xs mt-0.5 font-medium">Notifications</span>
      
      {/* Full notification center as modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:mx-4 sm:rounded-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p>Notification center coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

export function Navigation() {
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { user, admin, logout } = useAuth();

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  localStorage.removeItem('hasVisitedWhisperingNetwork');
                  window.location.reload();
                }}
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer tracking-tight hover:text-purple-600 transition-colors lowercase"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                whisper network
              </button>
            </div>

            {/* Right side - Search and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Global search for authenticated users - Desktop only */}
              {(user || admin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => setShowGlobalSearch(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              )}

              {/* Desktop notifications */}
              {(user || admin) && (
                <div className="hidden sm:block">
                  <NotificationCenter />
                </div>
              )}

              {/* User authentication section */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <Link href={`/user/${user.id}`}>
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        View My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Personal Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/password-management">
                      <DropdownMenuItem>
                        <Lock className="h-4 w-4 mr-2" />
                        Password & Security
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal-archive">
                      <DropdownMenuItem>
                        <Archive className="h-4 w-4 mr-2" />
                        Personal Archive
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : admin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{admin.displayName}</span>
                      <Badge variant="outline" className="hidden sm:inline-flex ml-2">
                        Listener
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2">
                    <Link href="/admin-profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/password-management">
                      <DropdownMenuItem className="cursor-pointer">
                        <Lock className="h-4 w-4 mr-2" />
                        Password & Security
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex" 
                    onClick={() => setShowAuthModal(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Silent Messenger
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex" 
                    onClick={() => setShowAdminAuthModal(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Whisper Listener
                  </Button>
                  
                  {/* Mobile login menu */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Menu className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 mt-2">
                        <DropdownMenuItem onClick={() => setShowAuthModal(true)}>
                          <User className="h-4 w-4 mr-2" />
                          Silent Messenger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowAdminAuthModal(true)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Whisper Listener
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar - Mobile Only - Thinner with smaller buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 sm:hidden">
        <div className="flex items-center justify-around px-1 py-1">
          {/* Home */}
          <Link href="/">
            <button
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 ${
                location === "/"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="tab-home"
            >
              <Home className={`h-5 w-5 ${location === "/" ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs mt-0.5 font-medium">Home</span>
            </button>
          </Link>

          {/* Dashboard */}
          <Link href="/dashboard">
            <button
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 ${
                location === "/dashboard"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="tab-dashboard"
            >
              <BarChart3 className={`h-5 w-5 ${location === "/dashboard" ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs mt-0.5 font-medium">Dashboard</span>
            </button>
          </Link>



          {/* Notifications - for authenticated users */}
          {(user || admin) && (
            <MobileNotificationButton />
          )}

          {/* Admin Dashboard - for admins only */}
          {admin && (
            <Link href="/admin">
              <button
                className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 ${
                  location === "/admin"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                data-testid="tab-admin"
              >
                <Shield className={`h-5 w-5 ${location === "/admin" ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs mt-0.5 font-medium">Admin</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AdminAuthModal isOpen={showAdminAuthModal} onClose={() => setShowAdminAuthModal(false)} />
      <GlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </>
  );
}