import { PrismaClient, Gender, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const roomCategories = [
  { name: "1-bed", capacity: 1 },
  { name: "2-bed", capacity: 2 },
  { name: "3-bed", capacity: 3 },
  { name: "4-bed", capacity: 4 },
  { name: "6-bed", capacity: 6 }
];

const hostels = [
  {
    name: "Aravali Block",
    gender: Gender.MALE,
    description: "Senior boys hostel block close to the academic building."
  },
  {
    name: "Nilgiri Block",
    gender: Gender.FEMALE,
    description: "Girls hostel block with mixed room categories."
  },
  {
    name: "Vindhya Block",
    gender: Gender.MALE,
    description: "General boys hostel block for second and third year students."
  }
];

const students = [
  ["22CSE001", "Aarav Sharma", "aarav.sharma@example.edu", "9876500001", "Computer Science", 3, Gender.MALE, 9.72],
  ["22CSE002", "Meera Iyer", "meera.iyer@example.edu", "9876500002", "Computer Science", 3, Gender.FEMALE, 9.61],
  ["22ECE003", "Kabir Khan", "kabir.khan@example.edu", "9876500003", "Electronics", 2, Gender.MALE, 9.48],
  ["22EEE004", "Ananya Rao", "ananya.rao@example.edu", "9876500004", "Electrical", 2, Gender.FEMALE, 9.32],
  ["22MEC005", "Rohan Das", "rohan.das@example.edu", "9876500005", "Mechanical", 3, Gender.MALE, 9.1],
  ["22CIV006", "Priya Nair", "priya.nair@example.edu", "9876500006", "Civil", 2, Gender.FEMALE, 8.96],
  ["22CSE007", "Dev Patel", "dev.patel@example.edu", "9876500007", "Computer Science", 2, Gender.MALE, 8.84],
  ["22ECE008", "Sara Thomas", "sara.thomas@example.edu", "9876500008", "Electronics", 3, Gender.FEMALE, 8.72],
  ["22EEE009", "Nikhil Verma", "nikhil.verma@example.edu", "9876500009", "Electrical", 2, Gender.MALE, 8.55],
  ["22MEC010", "Isha Gupta", "isha.gupta@example.edu", "9876500010", "Mechanical", 3, Gender.FEMALE, 8.41]
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@example.edu" },
    update: {},
    create: {
      email: "admin@example.edu",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  for (const category of roomCategories) {
    await prisma.roomCategory.upsert({
      where: { name: category.name },
      update: { capacity: category.capacity },
      create: category
    });
  }

  for (const hostel of hostels) {
    await prisma.hostelBlock.upsert({
      where: { name: hostel.name },
      update: hostel,
      create: hostel
    });
  }

  const categories = await prisma.roomCategory.findMany();
  const blocks = await prisma.hostelBlock.findMany();

  for (const block of blocks) {
    let roomCount = 0;

    for (const category of categories) {
      for (let roomIndex = 1; roomIndex <= 3; roomIndex += 1) {
        roomCount += 1;
        await prisma.room.upsert({
          where: {
            hostelBlockId_roomNumber: {
              hostelBlockId: block.id,
              roomNumber: `${category.capacity}${roomIndex.toString().padStart(2, "0")}`
            }
          },
          update: {
            categoryId: category.id,
            capacity: category.capacity,
            isAvailable: true
          },
          create: {
            hostelBlockId: block.id,
            categoryId: category.id,
            roomNumber: `${category.capacity}${roomIndex.toString().padStart(2, "0")}`,
            floor: category.capacity <= 2 ? 1 : 2,
            capacity: category.capacity
          }
        });
      }
    }

    await prisma.hostelBlock.update({
      where: { id: block.id },
      data: { totalRooms: roomCount }
    });
  }

  const rankedStudents = [...students]
    .sort((a, b) => b[7] - a[7] || a[0].localeCompare(b[0]))
    .map((student, index) => ({ student, rank: index + 1 }));

  for (const { student, rank } of rankedStudents) {
    const [
      registrationNumber,
      name,
      email,
      phone,
      department,
      year,
      gender,
      cgpa
    ] = student;

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        role: UserRole.STUDENT,
        student: {
          create: {
            registrationNumber,
            name,
            phone,
            department,
            year,
            gender,
            cgpa,
            rank
          }
        }
      }
    });
  }

  await prisma.counselingSlot.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Slot 1 - Top 5 CGPA Rank",
      startTime: new Date("2026-06-01T09:00:00.000Z"),
      endTime: new Date("2026-06-01T12:00:00.000Z"),
      minRank: 1,
      maxRank: 5,
      isActive: false
    }
  });

  await prisma.counselingSlot.upsert({
    where: { id: "22222222-2222-4222-8222-222222222222" },
    update: {},
    create: {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Slot 2 - Rank 6 to 10",
      startTime: new Date("2026-06-01T13:00:00.000Z"),
      endTime: new Date("2026-06-01T16:00:00.000Z"),
      minRank: 6,
      maxRank: 10,
      isActive: false
    }
  });

  console.log("Seed completed");
  console.log("Admin login email: admin@example.edu");
  console.log("Sample password for all seeded users: Password@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
