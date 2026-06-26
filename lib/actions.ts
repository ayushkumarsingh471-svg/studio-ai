"use server";

import { db } from "./db";
import { UsersTable, GenerationsTable } from "./schema";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto"; // Security ke liye

export async function syncUserAccount(email: string) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("User not authenticated");

    const clerkId = user.id;

    // 1. Check karo ki kya user pehle se Database mein hai?
    const existingUser = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, clerkId));

    let currentCredits = 0;

    if (existingUser.length === 0) {
      // 🚀 UPDATE: NAYA USER: Database mein add karo par 0 Credits do (No Freebies!)
      console.log("New User Detected! Creating DB Entry with 0 Credits...");
      await db.insert(UsersTable).values({
        clerkId: clerkId,
        email: email,
        credits: 0, // 🛑 Free trial band kar diya
      });
      currentCredits = 0;
    } else {
      // PURANA USER: Iske bache hue credits nikal lo
      currentCredits = existingUser[0].credits;
    }

    // 2. Is user ki saari purani generated photos nikal lo
    const userGallery = await db
      .select()
      .from(GenerationsTable)
      .where(eq(GenerationsTable.clerkId, clerkId))
      .orderBy(desc(GenerationsTable.createdAt));

    // 3. Frontend ko data wapas bhej do
    return {
      credits: currentCredits,
      gallery: userGallery,
    };
  } catch (error) {
    console.error("Error Syncing User:", error);
    return { credits: 0, gallery: [] };
  }
}

// Payment Verify karke credits badhana
export async function verifyAndAddCredits(
  orderId: string,
  paymentId: string,
  signature: string,
  creditsToAdd: number
) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Hacker Proofing: Razorpay ki asliyat check karna
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Secret key missing in .env");

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    // Agar signature match nahi hua, toh fake payment hai!
    if (generatedSignature !== signature) {
      return { success: false, error: "Payment verification failed! Fake Payment Detected." };
    }

    // 2. Agar payment asli hai, toh user ke Credits badha do!
    const existingUser = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, user.id));

    if (existingUser.length > 0) {
      const currentCredits = existingUser[0].credits || 0;
      const newTotalCredits = currentCredits + creditsToAdd;

      await db
        .update(UsersTable)
        .set({ credits: newTotalCredits })
        .where(eq(UsersTable.clerkId, user.id));

      return { success: true, message: "Credits successfully added!" };
    }

    return { success: false, error: "User not found in Database." };
  } catch (error) {
    console.error("Webhook Error:", error);
    return { success: false, error: "Internal Server Error" };
  }
}