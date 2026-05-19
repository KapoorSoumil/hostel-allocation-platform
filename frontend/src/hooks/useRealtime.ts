import { useEffect, useState } from "react";
import { getRealtimeUrl, type RealtimeMessage } from "../lib/realtime";

type RealtimeState = "CONNECTING" | "LIVE" | "OFFLINE";

export function useRealtime(
  token: string,
  onMessage: (message: RealtimeMessage) => void
) {
  const [state, setState] = useState<RealtimeState>("CONNECTING");
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    let isClosed = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | null = null;

    function connect() {
      setState("CONNECTING");
      socket = new WebSocket(getRealtimeUrl(token));

      socket.onopen = () => {
        setState("LIVE");
      };

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data) as RealtimeMessage;
        setLastEventAt(message.sentAt);
        onMessage(message);
      };

      socket.onclose = () => {
        if (isClosed) {
          return;
        }

        setState("OFFLINE");
        reconnectTimer = window.setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        setState("OFFLINE");
        socket?.close();
      };
    }

    connect();

    return () => {
      isClosed = true;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [token, onMessage]);

  return { state, lastEventAt };
}
