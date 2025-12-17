import { Calendar, User, Flag } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { TaskWithRelations, Priority, Status } from "@shared/schema";

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  onStatusChange?: (completed: boolean) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "Low", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

const statusConfig: Record<Status, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  review: { label: "Review", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

function formatDueDate(date: Date | string | null): { text: string; isOverdue: boolean; isUrgent: boolean } {
  if (!date) return { text: "", isOverdue: false, isUrgent: false };
  
  const d = new Date(date);
  const isOverdue = isPast(d) && !isToday(d);
  const isUrgent = isToday(d) || isTomorrow(d);
  
  if (isToday(d)) {
    return { text: "Today", isOverdue: false, isUrgent: true };
  }
  if (isTomorrow(d)) {
    return { text: "Tomorrow", isOverdue: false, isUrgent: true };
  }
  if (isOverdue) {
    return { text: format(d, "MMM d"), isOverdue: true, isUrgent: false };
  }
  return { text: format(d, "MMM d"), isOverdue: false, isUrgent: false };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({ task, onClick, onStatusChange }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const dueInfo = formatDueDate(task.dueDate);
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];

  const handleCheckboxChange = (checked: boolean) => {
    onStatusChange?.(checked);
  };

  return (
    <Card
      className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all duration-200"
      onClick={onClick}
      data-testid={`card-task-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5"
          data-testid={`checkbox-task-${task.id}`}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-base font-medium truncate ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
              data-testid={`text-task-title-${task.id}`}
            >
              {task.title}
            </h3>
            <Badge
              variant="secondary"
              className={`shrink-0 text-xs ${priority.className}`}
              data-testid={`badge-priority-${task.id}`}
            >
              <Flag className="h-3 w-3 mr-1" />
              {priority.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {dueInfo.text && (
              <div
                className={`flex items-center gap-1.5 text-sm ${
                  dueInfo.isOverdue
                    ? "text-red-600 dark:text-red-400"
                    : dueInfo.isUrgent
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground"
                }`}
                data-testid={`text-due-date-${task.id}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>{dueInfo.text}</span>
              </div>
            )}
            
            {task.assignedTo && (
              <div className="flex items-center gap-1.5" data-testid={`assignee-${task.id}`}>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-muted">
                    {getInitials(task.assignedTo.displayName || task.assignedTo.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {task.assignedTo.displayName || task.assignedTo.username}
                </span>
              </div>
            )}
            
            <Badge
              variant="secondary"
              className={`text-xs ${status.className}`}
              data-testid={`badge-status-${task.id}`}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
