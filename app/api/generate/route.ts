import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UsersTable } from "@/lib/schema"; 
import { eq } from "drizzle-orm";
import Replicate from "replicate"; // 🚀 SOYA HUA ENGINE ZINDA HO GAYA!

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, image } = body;

    // 1. Basic Check
    if (!prompt || !image) {
      return NextResponse.json({ error: "Prompt aur Image dono zaroori hain!" }, { status: 400 });
    }

    // 2. User Verification (Clerk)
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication failed. Kripya login karein." }, { status: 401 });
    }

    // 3. Database Check (Credits bache hain ya nahi?)
    const [dbUser] = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, user.id));

    if (!dbUser || (dbUser.credits || 0) <= 0) {
      return NextResponse.json({ 
        error: "Aapke credits khatam ho gaye hain. Kripya naya plan upgrade karein." 
      }, { status: 403 });
    }

    console.log(`🚀 Asli AI Engine Started! User: ${user.firstName} | Prompt: ${prompt.substring(0, 50)}...`);

    // ==========================================
    // 🧠 REAL AI GENERATION ENGINE (Replicate SDXL)
    // ==========================================
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Replicate ke Supercomputer ko request bhej rahe hain
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // Yeh ek bohot powerful Image Model hai
      {
        input: {
          prompt: prompt,
          image: image, // Frontend se aaya hua base64 photo
          negative_prompt: "ugly, blurry, poorly drawn, distorted, low quality, watermark",
          prompt_strength: 0.8 // 0.8 ka matlab: Original image aur text dono ka balance rakhega
        }
      }
    ) as string[];

    // Replicate hamesha ek array (list) bhejta hai, hume pehli image nikalni hai
    const finalImageUrl = output[0];

    // ==========================================
    // 💰 DEDUCT 1 CREDIT (Paisa Katna)
    // ==========================================
    const newCreditBalance = (dbUser.credits || 1) - 1;
    
    await db.update(UsersTable)
      .set({ credits: newCreditBalance })
      .where(eq(UsersTable.clerkId, user.id));

    console.log(`✅ Success! Asli photo ban gayi aur 1 Credit Deducted. New Balance: ${newCreditBalance}`);

    // 4. Return Final Image to Frontend
    return NextResponse.json({ imageUrl: finalImageUrl });

  } catch (error: any) {
    console.error("🔥 AI Generation Error:", error.message || error);
    return NextResponse.json({ error: "AI Engine fail ho gaya. Error: " + error.message }, { status: 500 });
  }
}