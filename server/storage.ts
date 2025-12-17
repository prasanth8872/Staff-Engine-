import {
  users,
  tasks,
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type UpdateTask,
  type UserPublic,
  type TaskWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<UserPublic[]>;

  getTask(id: string): Promise<TaskWithRelations | undefined>;
  getAllTasks(): Promise<TaskWithRelations[]>;
  getTasksByCreator(creatorId: string): Promise<TaskWithRelations[]>;
  getTasksByAssignee(assigneeId: string): Promise<TaskWithRelations[]>;
  createTask(task: InsertTask, creatorId: string): Promise<TaskWithRelations>;
  updateTask(id: string, data: UpdateTask): Promise<TaskWithRelations | undefined>;
  deleteTask(id: string): Promise<boolean>;
}

function toPublicUser(user: User): UserPublic {
  const { password, ...publicUser } = user;
  return publicUser;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<UserPublic[]> {
    const allUsers = await db.select().from(users);
    return allUsers.map(toPublicUser);
  }

  private async enrichTask(task: Task): Promise<TaskWithRelations> {
    const [creator] = await db.select().from(users).where(eq(users.id, task.creatorId));
    let assignedTo: UserPublic | null = null;
    if (task.assignedToId) {
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedToId));
      assignedTo = assignee ? toPublicUser(assignee) : null;
    }
    return {
      ...task,
      creator: toPublicUser(creator),
      assignedTo,
    };
  }

  async getTask(id: string): Promise<TaskWithRelations | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    return this.enrichTask(task);
  }

  async getAllTasks(): Promise<TaskWithRelations[]> {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    return Promise.all(allTasks.map((t) => this.enrichTask(t)));
  }

  async getTasksByCreator(creatorId: string): Promise<TaskWithRelations[]> {
    const creatorTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.creatorId, creatorId))
      .orderBy(desc(tasks.createdAt));
    return Promise.all(creatorTasks.map((t) => this.enrichTask(t)));
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskWithRelations[]> {
    const assigneeTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedToId, assigneeId))
      .orderBy(desc(tasks.createdAt));
    return Promise.all(assigneeTasks.map((t) => this.enrichTask(t)));
  }

  async createTask(insertTask: InsertTask, creatorId: string): Promise<TaskWithRelations> {
    const id = randomUUID();
    const now = new Date();
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        id,
        creatorId,
        dueDate: insertTask.dueDate ? new Date(insertTask.dueDate) : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return this.enrichTask(task);
  }

  async updateTask(id: string, data: UpdateTask): Promise<TaskWithRelations | undefined> {
    const updateData: Partial<Task> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    if (!task) return undefined;
    return this.enrichTask(task);
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
