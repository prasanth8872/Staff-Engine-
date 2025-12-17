import { useEffect } from "react";
import { Bell, CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message?: string;
}

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  autoDismissMs?: number;
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: Bell,
  error: AlertCircle,
};

const colorMap = {
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
  success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
};

export function NotificationToast({
  notification,
  onDismiss,
  autoDismissMs = 4000,
}: NotificationToastProps) {
  const Icon = iconMap[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss, autoDismissMs]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-bottom-5 duration-300",
        colorMap[notification.type]
      )}
      data-testid={`notification-${notification.id}`}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" data-testid={`notification-title-${notification.id}`}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-sm opacity-90 mt-0.5" data-testid={`notification-message-${notification.id}`}>
            {notification.message}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-6 w-6"
        onClick={() => onDismiss(notification.id)}
        data-testid={`button-dismiss-${notification.id}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface NotificationStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
