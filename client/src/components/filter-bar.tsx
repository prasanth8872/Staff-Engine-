import { Filter, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Status, Priority } from "@shared/schema";

interface FilterBarProps {
  statusFilter: Status | "all";
  priorityFilter: Priority | "all";
  sortBy: "dueDate" | "createdAt" | "priority";
  onStatusChange: (value: Status | "all") => void;
  onPriorityChange: (value: Priority | "all") => void;
  onSortChange: (value: "dueDate" | "createdAt" | "priority") => void;
  onClear: () => void;
}

export function FilterBar({
  statusFilter,
  priorityFilter,
  sortBy,
  onStatusChange,
  onPriorityChange,
  onSortChange,
  onClear,
}: FilterBarProps) {
  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filter:</span>
      </div>

      <Select
        value={statusFilter}
        onValueChange={(value) => onStatusChange(value as Status | "all")}
      >
        <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="todo">To Do</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={priorityFilter}
        onValueChange={(value) => onPriorityChange(value as Priority | "all")}
      >
        <SelectTrigger className="w-[140px]" data-testid="select-filter-priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-2">
        <ArrowUpDown className="h-4 w-4" />
        <span>Sort:</span>
      </div>

      <Select
        value={sortBy}
        onValueChange={(value) => onSortChange(value as "dueDate" | "createdAt" | "priority")}
      >
        <SelectTrigger className="w-[140px]" data-testid="select-sort">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dueDate">Due Date</SelectItem>
          <SelectItem value="createdAt">Created Date</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground"
          data-testid="button-clear-filters"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
