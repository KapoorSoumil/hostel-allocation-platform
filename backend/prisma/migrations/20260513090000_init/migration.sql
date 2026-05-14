-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "RoommateRequestStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('ROOMMATE_VERIFICATION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "registration_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "department" VARCHAR(100),
    "year" INTEGER,
    "gender" "Gender",
    "cgpa" DECIMAL(4,2) NOT NULL,
    "rank" INTEGER,
    "is_allocated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "min_rank" INTEGER NOT NULL,
    "max_rank" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "gender" "Gender",
    "description" TEXT,
    "total_rooms" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hostel_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hostel_block_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "room_number" VARCHAR(30) NOT NULL,
    "floor" INTEGER,
    "capacity" INTEGER NOT NULL,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roommate_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requester_student_id" UUID NOT NULL,
    "roommate_student_id" UUID NOT NULL,
    "room_id" UUID,
    "status" "RoommateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roommate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roommate_request_id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'ROOMMATE_VERIFICATION',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "allocated_by_user_id" UUID,
    "allocation_group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_occupants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_occupants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_number_key" ON "students"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_phone_key" ON "students"("phone");

-- CreateIndex
CREATE INDEX "students_cgpa_idx" ON "students"("cgpa");

-- CreateIndex
CREATE INDEX "students_rank_idx" ON "students"("rank");

-- CreateIndex
CREATE INDEX "students_is_allocated_idx" ON "students"("is_allocated");

-- CreateIndex
CREATE INDEX "students_department_year_idx" ON "students"("department", "year");

-- CreateIndex
CREATE INDEX "students_gender_idx" ON "students"("gender");

-- CreateIndex
CREATE INDEX "counseling_slots_min_rank_max_rank_idx" ON "counseling_slots"("min_rank", "max_rank");

-- CreateIndex
CREATE INDEX "counseling_slots_start_time_end_time_idx" ON "counseling_slots"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "counseling_slots_is_active_idx" ON "counseling_slots"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_blocks_name_key" ON "hostel_blocks"("name");

-- CreateIndex
CREATE INDEX "hostel_blocks_gender_idx" ON "hostel_blocks"("gender");

-- CreateIndex
CREATE INDEX "hostel_blocks_is_active_idx" ON "hostel_blocks"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "room_categories_name_key" ON "room_categories"("name");

-- CreateIndex
CREATE INDEX "rooms_hostel_block_id_idx" ON "rooms"("hostel_block_id");

-- CreateIndex
CREATE INDEX "rooms_category_id_idx" ON "rooms"("category_id");

-- CreateIndex
CREATE INDEX "rooms_is_available_idx" ON "rooms"("is_available");

-- CreateIndex
CREATE INDEX "rooms_hostel_block_id_category_id_is_available_idx" ON "rooms"("hostel_block_id", "category_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_hostel_block_id_room_number_key" ON "rooms"("hostel_block_id", "room_number");

-- CreateIndex
CREATE INDEX "roommate_requests_requester_student_id_idx" ON "roommate_requests"("requester_student_id");

-- CreateIndex
CREATE INDEX "roommate_requests_roommate_student_id_idx" ON "roommate_requests"("roommate_student_id");

-- CreateIndex
CREATE INDEX "roommate_requests_status_idx" ON "roommate_requests"("status");

-- CreateIndex
CREATE INDEX "roommate_requests_room_id_status_idx" ON "roommate_requests"("room_id", "status");

-- CreateIndex
CREATE INDEX "otp_verifications_phone_idx" ON "otp_verifications"("phone");

-- CreateIndex
CREATE INDEX "otp_verifications_expires_at_idx" ON "otp_verifications"("expires_at");

-- CreateIndex
CREATE INDEX "otp_verifications_roommate_request_id_purpose_idx" ON "otp_verifications"("roommate_request_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "allocations_student_id_key" ON "allocations"("student_id");

-- CreateIndex
CREATE INDEX "allocations_room_id_idx" ON "allocations"("room_id");

-- CreateIndex
CREATE INDEX "allocations_allocation_group_id_idx" ON "allocations"("allocation_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_occupants_student_id_key" ON "room_occupants"("student_id");

-- CreateIndex
CREATE INDEX "room_occupants_room_id_idx" ON "room_occupants"("room_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostel_block_id_fkey" FOREIGN KEY ("hostel_block_id") REFERENCES "hostel_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "room_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_requests" ADD CONSTRAINT "roommate_requests_requester_student_id_fkey" FOREIGN KEY ("requester_student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_requests" ADD CONSTRAINT "roommate_requests_roommate_student_id_fkey" FOREIGN KEY ("roommate_student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roommate_requests" ADD CONSTRAINT "roommate_requests_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_roommate_request_id_fkey" FOREIGN KEY ("roommate_request_id") REFERENCES "roommate_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_allocated_by_user_id_fkey" FOREIGN KEY ("allocated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_occupants" ADD CONSTRAINT "room_occupants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Database validation constraints
ALTER TABLE "students"
  ADD CONSTRAINT "students_cgpa_range_check" CHECK ("cgpa" >= 0 AND "cgpa" <= 10),
  ADD CONSTRAINT "students_rank_positive_check" CHECK ("rank" IS NULL OR "rank" > 0),
  ADD CONSTRAINT "students_year_positive_check" CHECK ("year" IS NULL OR "year" > 0);

ALTER TABLE "counseling_slots"
  ADD CONSTRAINT "counseling_slots_time_range_check" CHECK ("end_time" > "start_time"),
  ADD CONSTRAINT "counseling_slots_rank_range_check" CHECK ("min_rank" > 0 AND "max_rank" >= "min_rank");

ALTER TABLE "hostel_blocks"
  ADD CONSTRAINT "hostel_blocks_total_rooms_non_negative_check" CHECK ("total_rooms" >= 0);

ALTER TABLE "room_categories"
  ADD CONSTRAINT "room_categories_supported_capacity_check" CHECK ("capacity" IN (1, 2, 3, 4, 6));

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_supported_capacity_check" CHECK ("capacity" IN (1, 2, 3, 4, 6)),
  ADD CONSTRAINT "rooms_occupancy_range_check" CHECK ("current_occupancy" >= 0 AND "current_occupancy" <= "capacity"),
  ADD CONSTRAINT "rooms_floor_positive_check" CHECK ("floor" IS NULL OR "floor" >= 0);

ALTER TABLE "roommate_requests"
  ADD CONSTRAINT "roommate_requests_no_self_request_check" CHECK ("requester_student_id" <> "roommate_student_id");

ALTER TABLE "otp_verifications"
  ADD CONSTRAINT "otp_verifications_attempts_range_check" CHECK ("attempts" >= 0 AND "attempts" <= 5);

