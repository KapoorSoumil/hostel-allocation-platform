import type {
  AuthUser,
  AdminDashboardData,
  Allocation,
  AllocationReportRow,
  AllocationStatus,
  CounselingSlot,
  HostelBlock,
  HostelRoomSummary,
  RoomDetail,
  RoomListItem,
  RoomCategory,
  RoommateOtpDelivery,
  RoommateRequest,
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

export function adminLogin(input: {
  email: string;
  password: string;
}) {
  return request<LoginResult>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getCurrentUser(token: string) {
  return request<{ user: AuthUser }>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
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

export function allocateRoom(token: string, roomId: string) {
  return request<{ allocation: Allocation }>("/allocations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roomId })
  });
}

export function getCurrentAllocation(token: string) {
  return request<{ allocation: Allocation | null }>("/allocations/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getAllocationStatus(token: string) {
  return request<AllocationStatus>("/allocations/status", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getRoommateRequests(token: string) {
  return request<{ requests: RoommateRequest[] }>("/roommates/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function createRoommateRequest(
  token: string,
  input: { registrationNumber: string; phone: string; roomId?: string }
) {
  return request<{
    request: RoommateRequest;
    delivery: RoommateOtpDelivery;
  }>("/roommates/request", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}

export function verifyRoommateOtp(
  token: string,
  input: { requestId: string; otp: string }
) {
  return request<{ request: RoommateRequest }>("/roommates/verify-otp", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}

export function getAdminDashboard(token: string) {
  return request<AdminDashboardData>("/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function getAllocationReport(token: string) {
  return request<{ allocations: AllocationReportRow[] }>("/admin/allocations", {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function importStudents(token: string, csv: string) {
  return request<{ imported: number; defaultPassword: string }>("/admin/students/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ csv })
  });
}

export function createHostel(
  token: string,
  input: { name: string; gender?: string | null; description?: string | null; isActive?: boolean }
) {
  return request<{ hostel: HostelBlock }>("/admin/hostels", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}

export function createRoom(
  token: string,
  input: {
    hostelBlockId: string;
    categoryId: string;
    roomNumber: string;
    floor?: number | null;
    capacity: number;
    isAvailable?: boolean;
  }
) {
  return request<{ room: RoomListItem }>("/admin/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}

export function createCounselingSlot(
  token: string,
  input: {
    name: string;
    startTime: string;
    endTime: string;
    minRank: number;
    maxRank: number;
    isActive?: boolean;
  }
) {
  return request<{ slot: CounselingSlot }>("/admin/counseling-slots", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}

export function updateCounselingSlot(
  token: string,
  id: string,
  input: {
    name: string;
    startTime: string;
    endTime: string;
    minRank: number;
    maxRank: number;
    isActive?: boolean;
  }
) {
  return request<{ slot: CounselingSlot }>(`/admin/counseling-slots/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input)
  });
}
