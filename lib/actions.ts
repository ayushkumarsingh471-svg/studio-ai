"use server";

import { db } from "./db";
import { UsersTable, GenerationsTable } from "./schema";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUserAccount(email: string) {
  try {
    const user = await currentUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const clerkId = user.id;

    // 1. Check karo ki kya user pehle se Database mein hai?
    const existingUser = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, clerkId));

    let currentCredits = 0;

    if (existingUser.length === 0) {
      // NAYA USER: Isko Database mein add karo aur 3 Credits do
      console.log("New User Detected! Creating DB Entry...");
      await db.insert(UsersTable).values({
        clerkId: clerkId,
        email: email,
        credits: 3, // Freemium limit
      });
      currentCredits = 3;
    } else {
      // PURANA USER: Iske bache hue credits nikal lo
      currentCredits = existingUser[0].credits;
    }

    // 2. Is user ki saari purani generated photos nikal lo (Latest photo sabse upar)
    const userGallery = await db
      .select()
      .from(GenerationsTable)
      .where(eq(GenerationsTable.clerkId, clerkId))
      .orderBy(desc(GenerationsTable.createdAt));

    // 3. Frontend (Dashboard) ko data wapas bhej do
    return {
      credits: currentCredits,
      gallery: userGallery,
    };

  } catch (error) {
    console.error("Error Syncing User:", error);
    return { credits: 0, gallery: [] };
  }
}