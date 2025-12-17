import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for task priority and status
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const statusEnum = pgEnum("status", ["todo", "in_progress", "review", "completed"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: priorityEnum("priority").notNull().default("medium"),
  status: statusEnum("status").notNull().default("todo"),
  creatorId: varchar("creator_id", { length: 36 }).notNull().references(() => users.id),
  assignedToId: varchar("assigned_to_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  creatorIdx: index("tasks_creator_idx").on(table.creatorId),
  assignedIdx: index("tasks_assigned_idx").on(table.assignedToId),
  statusIdx: index("tasks_status_idx").on(table.status),
  priorityIdx: index("tasks_priority_idx").on(table.priority),
  dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks, { relationName: "creator" }),
  assignedTasks: many(tasks, { relationName: "assignee" }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: "assignee",
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required").max(50).optional(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  creatorId: true,
}).extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  dueDate: z.string().nullable().optional(),
});

export const updateTaskSchema = insertTaskSchema.partial();

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPublic = Omit<User, "password">;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in_progress" | "review" | "completed";

// Task with relations
export type TaskWithRelations = Task & {
  creator: UserPublic;
  assignedTo: UserPublic | null;
};
