import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/filter-bar";
import { TaskList } from "@/components/task-list";
import { TaskModal } from "@/components/task-modal";
import { NotificationStack, type Notification } from "@/components/notification-toast";
import type { TaskWithRelations, UserPublic, Priority, Status } from "@shared/schema";

const priorityOrder: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function TasksPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "createdAt" | "priority">("dueDate");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<UserPublic[]>({
    queryKey: ["/api/users"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: unknown) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  useEffect(() => {
    const socket = getSocket();

    const handleTaskEvent = (event: { type: string; taskId: string; data?: unknown; userId?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });

      if (event.type === "task:assigned" && event.userId === user?.id) {
        const taskData = event.data as TaskWithRelations;
        addNotification({
          type: "info",
          title: "New task assigned",
          message: `You've been assigned to "${taskData?.title || "a task"}"`,
        });
      }
    };

    socket.on("task:created", (data) => handleTaskEvent({ type: "task:created", ...data }));
    socket.on("task:updated", (data) => handleTaskEvent({ type: "task:updated", ...data }));
    socket.on("task:deleted", (data) => handleTaskEvent({ type: "task:deleted", ...data }));
    socket.on("task:assigned", (data) => handleTaskEvent({ type: "task:assigned", ...data }));

    return () => {
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("task:assigned");
    };
  }, [user?.id]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "priority":
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, statusFilter, priorityFilter, sortBy]);

  const handleOpenModal = (task?: TaskWithRelations) => {
    setSelectedTask(task || null);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (data: unknown) => {
    if (selectedTask) {
      await updateTaskMutation.mutateAsync({ id: selectedTask.id, data });
    } else {
      await createTaskMutation.mutateAsync(data);
    }
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      await deleteTaskMutation.mutateAsync(selectedTask.id);
    }
  };

  const handleStatusChange = async (taskId: string, completed: boolean) => {
    await updateTaskMutation.mutateAsync({
      id: taskId,
      data: { status: completed ? "completed" : "todo" },
    });
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-tasks-title">
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your tasks in one place
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} data-testid="button-create-task">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        sortBy={sortBy}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSortChange={setSortBy}
        onClear={handleClearFilters}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground" data-testid="text-task-count">
            Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <TaskList
          tasks={filteredTasks}
          isLoading={tasksLoading}
          emptyTitle="No tasks found"
          emptyDescription={
            statusFilter !== "all" || priorityFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first task to get started"
          }
          emptyIcon="tasks"
          onTaskClick={handleOpenModal}
          onStatusChange={handleStatusChange}
        />
      </div>

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask}
        users={users}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isSaving={createTaskMutation.isPending || updateTaskMutation.isPending}
        isDeleting={deleteTaskMutation.isPending}
      />

      <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
