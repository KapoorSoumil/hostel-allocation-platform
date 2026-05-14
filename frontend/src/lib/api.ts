import type {
  AuthUser,
  CounselingSlot,
  HostelBlock,
  HostelRoomSummary,
  RoomDetail,
  RoomListItem,
  RoomCategory,
  SlotStatus,
  Student
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type LoginResult = {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed");
  }

  return payload as ApiResponse<T>;
}

export function studentLogin(input: {
  registrationNumber: string;
  password: string;
}) {
  return request<LoginResult>("/auth/student/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getStudentProfile(token: string) {
  return request<{ student: Student }>("/students/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getStudentSlot(token: string) {
  return request<{
    slot: CounselingSlot | null;
    status: SlotStatus;
    serverTime: string;
  }>("/students/me/slot", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getHostels(token: string) {
  return request<{ hostels: HostelBlock[] }>("/hostels", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getRoomCategories(token: string) {
  return request<{ categories: RoomCategory[] }>("/rooms/available", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getHostelRooms(
  token: string,
  hostelId: string,
  filters: { categoryId?: string; search?: string } = {}
) {
  const params = new URLSearchParams();

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  return request<{
    hostel: HostelBlock;
    summary: HostelRoomSummary;
    rooms: RoomListItem[];
  }>(`/hostels/${hostelId}/rooms${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getRoomDetail(token: string, roomId: string) {
  return request<{ room: RoomDetail }>(`/rooms/${roomId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
