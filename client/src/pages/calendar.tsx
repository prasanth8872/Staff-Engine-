import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskWithRelations, Priority } from "@shared/schema";

const priorityColors: Record<Priority, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: tasks = [] } = useQuery<TaskWithRelations[]>({
    queryKey: ["/api/tasks"],
  });

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-calendar-title">
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View tasks by their due dates
          </p>
        </div>
        <Button variant="outline" onClick={goToToday} data-testid="button-today">
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl" data-testid="text-current-month">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} data-testid="button-next-month">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-muted px-2 py-3 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDate.get(dateKey) || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-24 p-2 bg-background text-left transition-colors hover-elevate",
                      !isCurrentMonth && "text-muted-foreground bg-muted/50",
                      isSelected && "ring-2 ring-primary ring-inset",
                      isToday(day) && "bg-primary/5"
                    )}
                    data-testid={`button-day-${dateKey}`}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isToday(day) && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              priorityColors[task.priority]
                            )}
                            title={task.title}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Click on a date to see tasks
              </p>
            ) : selectedDateTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No tasks due on this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                    data-testid={`calendar-task-${task.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] shrink-0",
                          task.priority === "urgent" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          task.priority === "high" && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                          task.priority === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                          task.priority === "low" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
