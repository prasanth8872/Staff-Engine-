import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    socket = io(wsUrl, {
      path: "/ws",
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token?: string): void {
  const s = getSocket();
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}

export type TaskEventType = "task:created" | "task:updated" | "task:deleted" | "task:assigned";

export interface TaskEvent {
  type: TaskEventType;
  taskId: string;
  userId?: string;
  data?: unknown;
}
