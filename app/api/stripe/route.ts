import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UsersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Ab hum POST use karenge kyunki frontend se data (priceId) aa raha hai
export async function POST(req: Request) {
  try {
    console.log("--- STRIPE PAYMENT PROCESS STARTED ---");

    // 0. Get Price ID from Frontend Request
    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      throw new Error("Price ID is missing from the request");
    }
    
    // 1. Secret Key Check
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is missing in .env.local file");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia" as any, // Aapki purani version
    });

    // 2. User Login Check
    console.log("Step 1: Checking User Login...");
    const user = await currentUser();
    if (!user) {
      throw new Error("User is not logged in through Clerk");
    }

    // 3. Database Check
    console.log("Step 2: Checking User in Database...");
    const dbUser = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, user.id));
    if (!dbUser.length) {
      throw new Error("User details not found in Neon Database");
    }

    // 4. Stripe Checkout Session
    console.log("Step 3: Creating Stripe Checkout Page for Price:", priceId);
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: "http://localhost:3000/dashboard?success=true", // 🎉 Payment ke baad patakhe!
      cancel_url: "http://localhost:3000/pricing",
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.emailAddresses[0].emailAddress,
      line_items: [
        {
          price: priceId, // Yahan aayegi hamari Stripe Dashboard wali dynamic ID!
          quantity: 1,
        },
      ],
      metadata: {
        clerkId: user.id,
      },
    });

    console.log("--- STRIPE SUCCESS: SENDING TO CHECKOUT ---");
    return NextResponse.json({ url: stripeSession.url });

  } catch (error: any) {
    console.error("🔥 ACTUAL STRIPE ERROR CAUGHT:", error.message || error);
    return NextResponse.json({ error: error.message || "Payment Gateway failed to start" }, { status: 500 });
  }
}