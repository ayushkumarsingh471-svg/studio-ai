import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Razorpay ka engine start kar rahe hain
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Frontend se ab 'amount', 'userId' aur 'credits' aa rahe hain
    const { amount, userId, credits } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    if (!amount) {
      return NextResponse.json({ error: "Amount is missing" }, { status: 400 });
    }

    const amountInPaise = amount * 100; 

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `studio_ai_${Date.now()}`,
      // 🚀 MAGIC: Razorpay ko yaad rakhne ke liye notes de rahe hain
      notes: {
        userId: userId,
        credits: credits,
      }
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ orderId: order.id, amount: options.amount });
    
  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}