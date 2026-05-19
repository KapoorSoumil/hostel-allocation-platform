import { z } from "zod";

export const allocateRoomSchema = z.object({
  roomId: z.string().uuid("A valid room id is required")
});
