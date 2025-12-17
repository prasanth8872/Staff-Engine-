import { CheckCircle, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCardSkeleton } from "./task-skeleton";

interface StatsCardsProps {
  assignedToMe: number;
  createdByMe: number;
  overdue: number;
  completed: number;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: typeof CheckCircle;
  value: number;
  label: string;
  iconClassName: string;
  testId: string;
}

function StatCard({ icon: Icon, value, label, iconClassName, testId }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold" data-testid={testId}>{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export function StatsCards({ assignedToMe, createdByMe, overdue, completed, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={ListTodo}
        value={assignedToMe}
        label="Assigned to me"
        iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        testId="stat-assigned-to-me"
      />
      <StatCard
        icon={Clock}
        value={createdByMe}
        label="Created by me"
        iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        testId="stat-created-by-me"
      />
      <StatCard
        icon={AlertTriangle}
        value={overdue}
        label="Overdue"
        iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        testId="stat-overdue"
      />
      <StatCard
        icon={CheckCircle}
        value={completed}
        label="Completed"
        iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        testId="stat-completed"
      />
    </div>
  );
}
