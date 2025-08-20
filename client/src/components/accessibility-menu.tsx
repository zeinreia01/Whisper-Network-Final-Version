import { useState, useEffect, useRef } from "react";
import { Settings, Moon, Sun, User, Shield, Info, Heart, Trophy } from "lucide-react";
import { InfoDialog } from "@/components/info-dialog";
import { useAuth } from "@/hooks/use-auth";
import { UserAccountModal } from "@/components/user-account-modal";

type Theme = 'light' | 'dark' | 'pink';

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showUserAccount, setShowUserAccount] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { user, admin } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    if (largeText) {
      document.body.classList.add('large-text');
    } else {
      document.body.classList.remove('large-text');
    }
  }, [largeText]);

  useEffect(() => {
    if (reducedMotion) {
      document.body.classList.add('reduced-motion');
    } else {
      document.body.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'pink');
    
    // Add the appropriate theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'pink') {
      document.documentElement.classList.add('pink');
    }
  }, [theme]);

  // Load settings from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedLargeText = localStorage.getItem('largeText') === 'true';
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';
    
    setTheme(savedTheme);
    setHighContrast(savedHighContrast);
    setLargeText(savedLargeText);
    setReducedMotion(savedReducedMotion);
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('largeText', largeText.toString());
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion.toString());
  }, [reducedMotion]);

  return (
    <>
      <div ref={menuRef} className="fixed top-16 right-5 z-30 flex flex-col items-end space-y-2">
        {/* Leaderboard button */}
        <a
          href="/leaderboard"
          className="bg-white dark:bg-gray-800 pink:bg-pink-50 rounded-full p-3 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 pink:border-pink-200 transition-all duration-300 inline-flex items-center justify-center"
          aria-label="View Leaderboard"
        >
          <Trophy className="w-5 h-5 text-primary" />
        </a>

        {/* Info button as separate circular button */}
        <InfoDialog 
          trigger={
            <button
              className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300"
              aria-label="About Whispering Network"
            >
              <Info className="w-5 h-5 text-primary" />
            </button>
          }
        />

        {/* Dynamic Island-style container */}
        <div className={`
          transition-all duration-500 ease-out
          ${isOpen ? 'bg-white/95 dark:bg-gray-900/95 pink:bg-pink-50/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 pink:border-pink-200/50 rounded-2xl p-1 shadow-2xl' : 'bg-transparent'}
        `}>
          {/* Main settings button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              transition-all duration-300
              ${isOpen 
                ? 'bg-gray-100 dark:bg-gray-800 pink:bg-pink-100 rounded-xl p-2 m-1' 
                : 'bg-white dark:bg-gray-800 pink:bg-pink-50 rounded-full p-3 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 pink:border-pink-200'
              }
            `}
            aria-label="Settings & Options"
          >
            <Settings className={`${isOpen ? 'w-4 h-4' : 'w-5 h-5'} text-primary transition-all duration-300`} />
          </button>

          {/* Quick action buttons when expanded */}
          {isOpen && (
            <div className="flex items-center space-x-1 p-1">
              {/* Theme toggle buttons */}
              <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-xl transition-colors ${
                  theme === 'light' 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 pink:hover:bg-pink-100 text-gray-600 dark:text-gray-400'
                }`}
                aria-label="Light theme"
              >
                <Sun className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-xl transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-gray-200' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 pink:hover:bg-pink-100 text-gray-600 dark:text-gray-400'
                }`}
                aria-label="Dark theme"
              >
                <Moon className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setTheme('pink')}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  theme === 'pink' 
                    ? 'romantic-gradient text-white shadow-lg pink-glow' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 pink:hover:bg-pink-100 text-gray-600 dark:text-gray-400 hover:text-pink-500'
                }`}
                aria-label="Tea Rose Pink theme"
              >
                <Heart className="w-4 h-4" />
              </button>





              {/* User account (only for logged in users) */}
              {(user || admin) && (
                <button
                  onClick={() => setShowUserAccount(true)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Account settings"
                >
                  {admin ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Accessibility panel */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-gray-900/95 pink:bg-pink-50/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 pink:border-pink-200/50 animate-slide-up">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-4 text-gray-900 dark:text-gray-100 pink:text-pink-900">Accessibility & Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">High Contrast</span>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Large Text</span>
                  <input
                    type="checkbox"
                    checked={largeText}
                    onChange={(e) => setLargeText(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Reduce Motion</span>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Account Modal */}
      <UserAccountModal 
        isOpen={showUserAccount} 
        onClose={() => setShowUserAccount(false)} 
        user={user}
        admin={admin}
      />
    </>
  );
}
