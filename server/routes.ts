import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { registerSchema, loginSchema, insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.SESSION_SECRET || "taskflow-secret-key-change-in-production";
const COOKIE_NAME = "taskflow_token";

interface JWTPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function handleError(res: Response, error: unknown, defaultMessage: string) {
  console.error(error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: error.errors[0]?.message || "Validation error" });
  }
  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: defaultMessage });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const io = new SocketIOServer(httpServer, {
    path: "/ws",
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split(COOKIE_NAME + "=")[1]?.split(";")[0];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        (socket as any).user = decoded;
      } catch {
        // Continue without auth for now
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  function emitTaskEvent(event: string, data: unknown) {
    io.emit(event, data);
  }

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email } as JWTPayload,
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password, ...publicUser } = user;
      return res.status(201).json({ user: publicUser });
    } catch (error) {
      return handleError(res, error, "Registration failed");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email } as JWTPayload,
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password, ...publicUser } = user;
      return res.json({ user: publicUser });
    } catch (error) {
      return handleError(res, error, "Login failed");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    return res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...publicUser } = user;
      return res.json({ user: publicUser });
    } catch (error) {
      return handleError(res, error, "Failed to get user");
    }
  });

  // Users routes
  app.get("/api/users", authMiddleware, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      return res.json(allUsers);
    } catch (error) {
      return handleError(res, error, "Failed to get users");
    }
  });

  // Tasks routes
  app.get("/api/tasks", authMiddleware, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      return res.json(allTasks);
    } catch (error) {
      return handleError(res, error, "Failed to get tasks");
    }
  });

  app.get("/api/tasks/:id", authMiddleware, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      return res.json(task);
    } catch (error) {
      return handleError(res, error, "Failed to get task");
    }
  });

  app.post("/api/tasks", authMiddleware, async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data, req.user!.userId);
      
      emitTaskEvent("task:created", { taskId: task.id, data: task });
      
      return res.status(201).json(task);
    } catch (error) {
      return handleError(res, error, "Failed to create task");
    }
  });

  app.patch("/api/tasks/:id", authMiddleware, async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const data = updateTaskSchema.parse(req.body);
      const previousAssignee = existingTask.assignedToId;
      
      const task = await storage.updateTask(req.params.id, data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      emitTaskEvent("task:updated", { taskId: task.id, data: task });

      if (data.assignedToId && data.assignedToId !== previousAssignee) {
        emitTaskEvent("task:assigned", {
          taskId: task.id,
          userId: data.assignedToId,
          data: task,
        });
      }

      return res.json(task);
    } catch (error) {
      return handleError(res, error, "Failed to update task");
    }
  });

  app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
    try {
      const existingTask = await storage.getTask(req.params.id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      emitTaskEvent("task:deleted", { taskId: req.params.id });

      return res.json({ message: "Task deleted successfully" });
    } catch (error) {
      return handleError(res, error, "Failed to delete task");
    }
  });

  return httpServer;
}
