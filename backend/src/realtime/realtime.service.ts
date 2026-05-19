import type { Server } from "node:http";
import { URL } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import { verifyAccessToken } from "../utils/tokens";
import { logger } from "../utils/logger";

type RealtimeClient = {
  socket: WebSocket;
  user: {
    id: string;
    role: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
  };
};

export type RealtimeEvent =
  | "ROOM_AVAILABILITY_CHANGED"
  | "OCCUPANCY_CHANGED"
  | "COUNSELING_SLOT_CHANGED"
  | "ALLOCATION_CREATED"
  | "ROOMMATE_REQUEST_CHANGED"
  | "ADMIN_DASHBOARD_CHANGED";

type RealtimePayload = {
  event: RealtimeEvent;
  data?: Record<string, unknown>;
  sentAt: string;
};

const clients = new Set<RealtimeClient>();

function send(client: RealtimeClient, payload: RealtimePayload) {
  if (client.socket.readyState !== WebSocket.OPEN) {
    return;
  }

  client.socket.send(JSON.stringify(payload));
}

export function initializeRealtime(server: Server) {
  const wss = new WebSocketServer({ server, path: "/realtime" });

  wss.on("connection", (socket, request) => {
    try {
      const url = new URL(request.url ?? "", "http://localhost");
      const token = url.searchParams.get("token");

      if (!token) {
        socket.close(1008, "Authentication token is required");
        return;
      }

      const payload = verifyAccessToken(token);
      const client: RealtimeClient = {
        socket,
        user: {
          id: payload.id,
          role: payload.role
        }
      };

      clients.add(client);
      send(client, {
        event: "ADMIN_DASHBOARD_CHANGED",
        data: { connected: true },
        sentAt: new Date().toISOString()
      });

      socket.on("close", () => {
        clients.delete(client);
      });

      socket.on("error", (error) => {
        logger.warn({ error }, "Realtime socket error");
        clients.delete(client);
      });
    } catch {
      socket.close(1008, "Invalid or expired authentication token");
    }
  });

  logger.info("Realtime WebSocket server mounted at /realtime");
}

export function broadcastRealtime(event: RealtimeEvent, data: Record<string, unknown> = {}) {
  const payload = {
    event,
    data,
    sentAt: new Date().toISOString()
  };

  for (const client of clients) {
    send(client, payload);
  }
}

export function broadcastAdminRealtime(event: RealtimeEvent, data: Record<string, unknown> = {}) {
  const payload = {
    event,
    data,
    sentAt: new Date().toISOString()
  };

  for (const client of clients) {
    if (client.user.role === "ADMIN" || client.user.role === "SUPER_ADMIN") {
      send(client, payload);
    }
  }
}
