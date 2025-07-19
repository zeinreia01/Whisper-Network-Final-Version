import { useState, useEffect, useRef } from "react";
import { Settings } from "lucide-react";

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={menuRef} className="fixed top-5 right-5 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
        aria-label="Accessibility Options"
      >
        <Settings className="w-5 h-5 text-primary" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 animate-slide-up">
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-3">Accessibility</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">High Contrast</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={largeText}
                  onChange={(e) => setLargeText(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Large Text</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Reduce Motion</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
