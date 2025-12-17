import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, AlertTriangle, Clock, UserCheck } from "lucide-react";
import { isPast, isToday } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { StatsCards } from "@/components/stats-cards";
import { TaskList } from "@/components/task-list";
import { TaskModal } from "@/components/task-modal";
import { NotificationStack, type Notification } from "@/components/notification-toast";
import type { TaskWithRelations, UserPublic } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
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

      if (event.type === "task:updated") {
        addNotification({
          type: "success",
          title: "Task updated",
          message: "A task has been updated in real-time",
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

  const stats = useMemo(() => {
    const assignedToMe = tasks.filter((t) => t.assignedToId === user?.id).length;
    const createdByMe = tasks.filter((t) => t.creatorId === user?.id).length;
    const overdue = tasks.filter(
      (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "completed"
    ).length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { assignedToMe, createdByMe, overdue, completed };
  }, [tasks, user?.id]);

  const myTasks = useMemo(() => {
    return tasks
      .filter((t) => t.assignedToId === user?.id && t.status !== "completed")
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [tasks, user?.id]);

  const overdueTasks = useMemo(() => {
    return tasks
      .filter(
        (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "completed"
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.creatorId === user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tasks, user?.id]);

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

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.displayName || user?.username}
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} data-testid="button-create-task">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <StatsCards
        assignedToMe={stats.assignedToMe}
        createdByMe={stats.createdByMe}
        overdue={stats.overdue}
        completed={stats.completed}
        isLoading={tasksLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">Assigned to me</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {myTasks.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <TaskList
                tasks={myTasks}
                isLoading={tasksLoading}
                emptyTitle="No tasks assigned"
                emptyDescription="Tasks assigned to you will appear here"
                emptyIcon="inbox"
                onTaskClick={handleOpenModal}
                onStatusChange={handleStatusChange}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-lg">Overdue</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {overdueTasks.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <TaskList
                tasks={overdueTasks}
                isLoading={tasksLoading}
                emptyTitle="No overdue tasks"
                emptyDescription="You're all caught up!"
                emptyIcon="tasks"
                onTaskClick={handleOpenModal}
                onStatusChange={handleStatusChange}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-lg">Recently created</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {recentTasks.length}
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <TaskList
                tasks={recentTasks}
                isLoading={tasksLoading}
                emptyTitle="No tasks created"
                emptyDescription="Create your first task to get started"
                emptyIcon="tasks"
                onTaskClick={handleOpenModal}
                onStatusChange={handleStatusChange}
              />
            </ScrollArea>
          </CardContent>
        </Card>
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
