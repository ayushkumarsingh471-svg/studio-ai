import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { UsersTable } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Stripe Engine Start
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
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

  // 💡 HELPER: Kitne paise aaye uske hisaab se credits calculate karna (UPDATED TO ₹899)
  const getCreditsToAdd = (amountInPaise: number | null) => {
    if (amountInPaise === 29900) return 100; // Basic Plan ₹299
    if (amountInPaise === 89900) return 500; // Pro Plan ₹899
    return 0; // Agar match na ho
  };

  // ==========================================
  // SCENARIO 1: Jab user pehli baar plan kharide
  // ==========================================
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const clerkId = session?.metadata?.clerkId;
    if (!clerkId) {
      return new NextResponse("User ID missing", { status: 400 });
    }

    const creditsToAdd = getCreditsToAdd(session.amount_total);

    console.log(`💰 Payment Success! Adding ${creditsToAdd} Credits for User:`, clerkId);

    const [user] = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, clerkId));
    const currentCredits = user?.credits || 0;

    await db.update(UsersTable).set({
      isPro: true,
      credits: currentCredits + creditsToAdd, 
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    }).where(eq(UsersTable.clerkId, clerkId));
  }

  // ==========================================
  // SCENARIO 2: Jab user ka agle mahine ka payment automatic cut jaye
  // ==========================================
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const amountPaid = session.amount_paid; 
    const creditsToAdd = getCreditsToAdd(amountPaid);

    const [user] = await db.select().from(UsersTable).where(eq(UsersTable.stripeSubscriptionId, subscription.id));
    
    if (user) {
      const currentCredits = user.credits || 0;
      
      console.log(`🔄 Renewal Success! Adding ${creditsToAdd} Credits to User`);
      
      await db.update(UsersTable).set({
        credits: currentCredits + creditsToAdd, 
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      }).where(eq(UsersTable.stripeSubscriptionId, subscription.id));
    }
  }

  return new NextResponse(null, { status: 200 });
}