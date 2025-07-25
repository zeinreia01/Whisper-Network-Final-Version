import { Shield, User, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserBadgeProps {
  userType: "user" | "admin" | "anonymous";
  variant?: "default" | "small";
  className?: string;
}

export function UserBadge({ userType, variant = "default", className }: UserBadgeProps) {
  if (userType === "anonymous") {
    return null; // No badge for anonymous users
  }

  const badgeConfig = {
    user: {
      label: "Silent Messenger",
      icon: User,
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
    },
    admin: {
      label: "Whisper Listener",
      icon: Crown,
      className: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700",
    },
  };

  const config = badgeConfig[userType];
  if (!config) {
    return null; // Return null if userType is not valid
  }
  const Icon = config.icon;

  const sizeClasses = variant === "small" 
    ? "text-xs px-1.5 py-0.5 h-5" 
    : "text-xs px-2 py-1 h-6";

  return (
    <Badge
      variant="outline"
      className={`
        inline-flex items-center gap-1 font-medium border rounded-full
        ${config.className}
        ${sizeClasses}
        ${className}
      `}
    >
      <Icon className={variant === "small" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      <span>{config.label}</span>
    </Badge>
  );
}