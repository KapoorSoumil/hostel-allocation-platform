export type RealtimeEventName =
  | "ROOM_AVAILABILITY_CHANGED"
  | "OCCUPANCY_CHANGED"
  | "COUNSELING_SLOT_CHANGED"
  | "ALLOCATION_CREATED"
  | "ROOMMATE_REQUEST_CHANGED"
  | "ADMIN_DASHBOARD_CHANGED";

export type RealtimeMessage = {
  event: RealtimeEventName;
  data?: Record<string, unknown>;
  sentAt: string;
};

export function getRealtimeUrl(token: string) {
  const configuredUrl = import.meta.env.VITE_REALTIME_URL as string | undefined;

  if (configuredUrl) {
    const url = new URL(configuredUrl);
    url.searchParams.set("token", token);
    return url.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.port === "5173" ? "localhost:4000" : window.location.host;
  const url = new URL(`${protocol}//${host}/realtime`);
  url.searchParams.set("token", token);
  return url.toString();
}
