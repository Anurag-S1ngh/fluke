import { db } from "@/services";
import { AppError } from "@/types/error";
import { usersTable } from "@fluke/db/schema/index";
import { eq } from "drizzle-orm";

export const assertCanViewDraft = async (viewerId?: string) => {
  if (!viewerId) {
    throw new AppError("market not found", 404);
  }
  const [viewer] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, viewerId))
    .limit(1);
  if (viewer?.role !== "ADMIN") {
    throw new AppError("market not found", 404);
  }
};
