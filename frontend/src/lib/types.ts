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

export type Allocation = {
  id: string;
  allocationGroupId: string;
  allocatedAt: string;
  student: {
    id: string;
    registrationNumber: string;
    name: string;
    department: string | null;
    year: number | null;
  };
  room: {
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
    };
    category: {
      id: string;
      name: string;
      capacity: number;
    };
  };
  receipt: {
    receiptNumber: string;
    issuedAt: string;
    message: string;
  };
};

export type AllocationStatus = {
  isAllocated: boolean;
  canAllocate: boolean;
  slotStatus: SlotStatus | "INACTIVE";
  slot: CounselingSlot | null;
  serverTime: string;
};

export type AdminDashboardData = {
  stats: {
    totalStudents: number;
    allocatedStudents: number;
    unallocatedStudents: number;
    totalHostels: number;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    activeSlots: number;
  };
  hostels: Array<HostelBlock & { isActive: boolean }>;
  rooms: Array<RoomListItem & {
    hostelBlock: { id: string; name: string };
  }>;
  categories: RoomCategory[];
  slots: CounselingSlot[];
  recentAllocations: Array<{
    id: string;
    createdAt: string;
    allocationGroupId: string;
    student: {
      id: string;
      registrationNumber: string;
      name: string;
    };
    room: {
      id: string;
      roomNumber: string;
      hostelBlock: {
        id: string;
        name: string;
      };
    };
  }>;
  roommateRequestSummary: Array<{
    status: RoommateRequestStatus;
    count: number;
  }>;
};

export type AllocationReportRow = {
  id: string;
  allocatedAt: string;
  registrationNumber: string;
  studentName: string;
  department: string | null;
  year: number | null;
  rank: number | null;
  hostel: string;
  roomNumber: string;
  category: string;
};

export type RoommateRequestStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type RoommateRequest = {
  id: string;
  status: RoommateRequestStatus;
  createdAt: string;
  verifiedAt: string | null;
  requesterStudent: {
    id: string;
    registrationNumber: string;
    name: string;
    department: string | null;
    year: number | null;
  };
  roommateStudent: {
    id: string;
    registrationNumber: string;
    name: string;
    phone?: string;
    department: string | null;
    year: number | null;
  };
  room: {
    id: string;
    roomNumber: string;
    hostelBlock: {
      id: string;
      name: string;
    };
  } | null;
  otp: {
    expiresAt: string;
    attemptsRemaining: number;
    isVerified: boolean;
  } | null;
};

export type RoommateOtpDelivery = {
  maskedPhone: string;
  expiresAt: string;
  developmentOtp?: string;
};
