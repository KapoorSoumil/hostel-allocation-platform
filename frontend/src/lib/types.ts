export type AuthUser = {
  id: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  student?: {
    id: string;
    registrationNumber: string;
    name: string;
    rank: number | null;
    isAllocated: boolean;
  };
};

export type Student = {
  id: string;
  registrationNumber: string;
  name: string;
  phone: string;
  department: string | null;
  year: number | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  cgpa: number;
  rank: number | null;
  isAllocated: boolean;
};

export type CounselingSlot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  minRank: number;
  maxRank: number;
  isActive: boolean;
};

export type SlotStatus = "ACTIVE" | "UPCOMING" | "ENDED" | "NOT_ASSIGNED";

export type HostelBlock = {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  description: string | null;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
};

export type RoomCategory = {
  id: string;
  name: string;
  capacity: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
};

export type RoomListItem = {
  id: string;
  roomNumber: string;
  floor: number | null;
  capacity: number;
  currentOccupancy: number;
  availableBeds: number;
  isAvailable: boolean;
  occupantCount: number;
  category: {
    id: string;
    name: string;
    capacity: number;
  };
};

export type HostelRoomSummary = {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
};

export type RoomDetail = {
  id: string;
  roomNumber: string;
  floor: number | null;
  capacity: number;
  currentOccupancy: number;
  availableBeds: number;
  isAvailable: boolean;
  hostelBlock: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    description: string | null;
  };
  category: {
    id: string;
    name: string;
    capacity: number;
  };
  occupants: Array<{
    id: string;
    registrationNumber: string;
    name: string;
    department: string | null;
  }>;
};
