import { Router } from "express";
import { adminRoutes } from "./modules/admin/admin.routes";
import { allocationRoutes } from "./modules/allocations/allocation.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { counselingSlotRoutes } from "./modules/counseling-slots/counseling-slot.routes";
import { hostelRoutes } from "./modules/hostels/hostel.routes";
import { roommateRoutes } from "./modules/roommates/roommate.routes";
import { roomRoutes } from "./modules/rooms/room.routes";
import { studentRoutes } from "./modules/students/student.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/students", studentRoutes);
routes.use("/counseling-slots", counselingSlotRoutes);
routes.use("/hostels", hostelRoutes);
routes.use("/rooms", roomRoutes);
routes.use("/roommates", roommateRoutes);
routes.use("/allocations", allocationRoutes);
routes.use("/admin", adminRoutes);
