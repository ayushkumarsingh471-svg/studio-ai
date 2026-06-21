import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UsersTable, GenerationsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import Replicate from "replicate";
import { UTApi } from "uploadthing/server"; // Naya Cloud System

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const utapi = new UTApi(); // Cloud Storage Engine Start kiya

export async function POST(req: Request) {
  try {
    console.log("--- NEW GENERATION REQUEST STARTED ---");

    const { prompt, image } = await req.json();
    const user = await currentUser();

    // 1. Security Check
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access. Please sign in." }, { status: 401 });
    }

    // 2. Database & Credit Check
    const userData = await db.select().from(UsersTable).where(eq(UsersTable.clerkId, user.id));

    if (userData.length === 0) {
       return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const userCredits = userData[0].credits ?? 0;
    if (userCredits <= 0) {
       return NextResponse.json({ error: "Credit limit reached. Please upgrade your plan." }, { status: 403 });
    }

    let tempImageUrl = "";

    // 3. AI GENERATION (Mock ya Real)
    if (process.env.USE_MOCK_AI === 'true') {
      console.log("Status: Using MOCK AI...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      tempImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80"; 
    } else {
      console.log("Status: Sending request to Real AI Engine (Replicate)...");
      const output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: prompt,
            image: image,
            width: 1024,
            height: 1024,
            num_inference_steps: 25
          }
        }
      );
      tempImageUrl = (output as string[])[0]; // Yeh link 1 ghante mein expire ho jayega
    }

    // 4. CLOUD BACKUP (Photo ko hamesha ke liye UploadThing par daalna)
    console.log("Status: Uploading to Cloud Storage...");
    const uploadedFile = await utapi.uploadFilesFromUrl(tempImageUrl);
    const finalPermanentUrl = uploadedFile.data?.url || tempImageUrl;
    console.log("Status: Cloud Upload Complete! Permanent URL:", finalPermanentUrl);

    // 5. Deduct 1 Credit
    await db.update(UsersTable)
      .set({ credits: userCredits - 1 })
      .where(eq(UsersTable.clerkId, user.id));

    // 6. Save Permanent URL to Gallery Database
    await db.insert(GenerationsTable).values({
      clerkId: user.id,
      imageUrl: finalPermanentUrl, // Ab yahan permanent wala link save hoga
      prompt: prompt,
    });

    console.log("--- GENERATION SUCCESSFUL ---");
    return NextResponse.json({ imageUrl: finalPermanentUrl });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Failed to generate image. Please check API Credits." }, { status: 500 });
  }
}