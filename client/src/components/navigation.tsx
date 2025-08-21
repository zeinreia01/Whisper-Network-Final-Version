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
import { User, Shield, LogOut, Settings, Home, BarChart3, Menu, Archive, Search, Bell, X, Lock, Sparkles, Star, MessageSquare, Users } from "lucide-react";

// Mobile notification button component for bottom navigation
function MobileNotificationButton() {
  const { user, admin } = useAuth();

  if (!user && !admin) return null;

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 relative">
      <NotificationCenter />
      <span className="text-xs mt-0.5 font-medium">Notifications</span>
    </div>
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

            {/* Center - Main Navigation (Desktop Only) */}
            <div className="hidden sm:flex items-center space-x-2">
              <Link href="/">
                <Button
                  variant={location === "/" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button
                  variant={location === "/dashboard" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              {admin && (
                <Link href="/admin">
                  <Button
                    variant={location === "/admin" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}

              {admin && (
                <Link href="/boards">
                  <Button
                    variant={location === "/boards" ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center relative"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Boards
                    <Badge variant="destructive" className="ml-1 text-xs font-bold h-4 px-1">
                      NEW!
                    </Badge>
                  </Button>
                </Link>
              )}

              <Link href="/announcements">
                <Button
                  variant={location === "/announcements" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Updates 🎀🫶
                </Button>
              </Link>
            </div>

            {/* Right side - Search and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Global search for authenticated users */}
              {(user || admin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex"
                  onClick={() => setShowGlobalSearch(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Search</span>
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
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        View My Profile
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Personal Settings
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/password-management">
                      <DropdownMenuItem className="cursor-pointer">
                        <Lock className="h-4 w-4 mr-2" />
                        Password & Security
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/personal-archive">
                      <DropdownMenuItem className="cursor-pointer">
                        <Archive className="h-4 w-4 mr-2" />
                        Personal Archive
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
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
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
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
                        <DropdownMenuItem 
                          onClick={() => setShowAuthModal(true)}
                          className="cursor-pointer"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Silent Messenger
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShowAdminAuthModal(true)}
                          className="cursor-pointer"
                        >
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

          {/* Boards - for all users */}
          {(user || admin) && (
            <Link href="/boards">
              <button
                className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 relative ${
                  location === "/boards"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                data-testid="tab-boards"
              >
                <Users className={`h-5 w-5 ${location === "/boards" ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs mt-0.5 font-medium">Boards</span>
                <Badge variant="destructive" className="absolute -top-1 -right-1 text-[8px] font-bold h-4 px-1 leading-none">
                  NEW!
                </Badge>
              </button>
            </Link>
          )}

          {/* Notifications - for authenticated users */}
          {(user || admin) && (
            <MobileNotificationButton />
          )}

          {/* Updates/Announcements */}
          <Link href="/announcements">
            <button
              className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[48px] transition-all duration-200 ${
                location === "/announcements"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              data-testid="tab-announcements"
            >
              <Sparkles className={`h-5 w-5 ${location === "/announcements" ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs mt-0.5 font-medium">Updates</span>
            </button>
          </Link>

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