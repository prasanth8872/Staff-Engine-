import { TaskCard } from "./task-card";
import { TaskSkeleton } from "./task-skeleton";
import { EmptyState } from "./empty-state";
import type { TaskWithRelations } from "@shared/schema";
import { CheckSquare, Inbox, AlertCircle } from "lucide-react";

interface TaskListProps {
  tasks: TaskWithRelations[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: "tasks" | "inbox" | "alert";
  onTaskClick?: (task: TaskWithRelations) => void;
  onStatusChange?: (taskId: string, completed: boolean) => void;
}

const emptyIcons = {
  tasks: CheckSquare,
  inbox: Inbox,
  alert: AlertCircle,
};

export function TaskList({
  tasks,
  isLoading,
  emptyTitle = "No tasks yet",
  emptyDescription = "Create your first task to get started",
  emptyIcon = "tasks",
  onTaskClick,
  onStatusChange,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="task-list-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={emptyIcons[emptyIcon]}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onTaskClick?.(task)}
          onStatusChange={(completed) => onStatusChange?.(task.id, completed)}
        />
      ))}
    </div>
  );
}
