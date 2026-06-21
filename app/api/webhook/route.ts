import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { UsersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Stripe Engine Start
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    // Yeh check karta hai ki message sach mein Stripe ne bheja hai ya kisi hacker ne
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("⚠️ Webhook signature verification failed.", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // SCENARIO 1: Jab user pehli baar plan kharide
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.clerkId) {
      return new NextResponse("User ID missing", { status: 400 });
    }

    // Database mein user ko 'PRO' bana rahe hain
    console.log("💰 Payment Success! Updating Database for User:", session.metadata.clerkId);
    await db.update(UsersTable).set({
      isPro: true,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    }).where(eq(UsersTable.clerkId, session.metadata.clerkId));
  }

  // SCENARIO 2: Jab user ka agle mahine ka payment automatic cut jaye
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await db.update(UsersTable).set({
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    }).where(eq(UsersTable.stripeSubscriptionId, subscription.id));
  }

  return new NextResponse(null, { status: 200 });
}