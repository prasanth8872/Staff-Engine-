import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import type { UserPublic, TaskWithRelations } from "@shared/schema";
import { isPast, isToday } from "date-fns";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface TeamMemberStats {
  user: UserPublic;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
}

function TeamMemberSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const { data: users = [], isLoading: usersLoading } = useQuery<UserPublic[]>({
    queryKey: ["/api/users"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const isLoading = usersLoading || tasksLoading;

  const teamStats: TeamMemberStats[] = users.map((user) => {
    const assignedTasks = tasks.filter((t) => t.assignedToId === user.id);
    const completedTasks = assignedTasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = assignedTasks.filter((t) => t.status === "in_progress").length;
    const overdueTasks = assignedTasks.filter(
      (t) => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== "completed"
    ).length;

    return {
      user,
      assignedTasks: assignedTasks.length,
      completedTasks,
      overdueTasks,
      inProgressTasks,
    };
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-team-title">
          Team
        </h1>
        <p className="text-muted-foreground mt-1">
          View team members and their task assignments
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TeamMemberSkeleton key={i} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Team members will appear here once they register"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {teamStats.map(({ user, assignedTasks, completedTasks, overdueTasks, inProgressTasks }) => (
            <Card key={user.id} className="p-6" data-testid={`card-team-member-${user.id}`}>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getInitials(user.displayName || user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" data-testid={`text-member-name-${user.id}`}>
                    {user.displayName || user.username}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate" data-testid={`text-member-email-${user.id}`}>
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{user.username}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold" data-testid={`stat-assigned-${user.id}`}>
                      {assignedTasks}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Assigned</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold" data-testid={`stat-completed-${user.id}`}>
                      {completedTasks}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                </div>

                {overdueTasks > 0 && (
                  <div className="col-span-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                      {overdueTasks} overdue
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
