import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bell, Heart, MessageSquare, Check, CheckCheck, UserPlus, X } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Link } from "wouter";
import type { NotificationWithDetails } from "@shared/schema";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, admin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: user
      ? [`/api/notifications/user/${user.id}`]
      : admin
      ? [`/api/notifications/admin/${admin.id}`]
      : [],
    enabled: !!(user || admin),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: user
          ? [`/api/notifications/user/${user.id}`]
          : [`/api/notifications/admin/${admin?.id}`]
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const data = user ? { userId: user.id } : { adminId: admin?.id };
      const response = await apiRequest("PATCH", "/api/notifications/mark-all-read", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: user
          ? [`/api/notifications/user/${user.id}`]
          : [`/api/notifications/admin/${admin?.id}`]
      });
      toast({
        title: "All notifications marked as read",
        description: "Your notification center has been cleared.",
      });
    },
  });

  if (!user && !admin) return null;

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: NotificationWithDetails) => !n.isRead).length : 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reaction":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "reply":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: NotificationWithDetails) => {
    if (notification.type === "follow" && notification.fromUserId) {
      return `/user/${notification.fromUserId}`;
    }
    if (notification.messageId) {
      return `/message/${notification.messageId}`;
    }
    return "/dashboard";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex items-center space-x-2">
                {Array.isArray(notifications) && notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : Array.isArray(notifications) && notifications.length > 0 ? (
                <div className="divide-y">
                  {Array.isArray(notifications) && notifications.map((notification: NotificationWithDetails) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        !notification.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={getNotificationLink(notification)}
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsReadMutation.mutate(notification.id);
                              }
                              setIsOpen(false);
                            }}
                          >
                            <p className="text-sm text-foreground mb-1 hover:text-primary cursor-pointer">
                              {notification.content}
                            </p>
                          </Link>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt!)}
                            </p>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">No notifications</h3>
                  <p className="text-xs text-muted-foreground">
                    You're all caught up! Notifications will appear here.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}