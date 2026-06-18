import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Master Switch: Check kar rahe hain ki Mock Mode ON hai ya nahi
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, image } = body;

    // --- MOCK MODE (Free Testing) ---
    if (USE_MOCK_AI) {
      console.log("Mock Mode ON: Generating demo image...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 sec processing delay
      
      return NextResponse.json({
        success: true,
        // Ek premium professional product ki photo
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop",
      });
    }

    // --- REAL AI MODE (Paid API) ---
    console.log("Real AI Mode ON: Generating AI Image...");
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", 
      {
        input: {
          prompt: prompt,
          image: image,
          prompt_strength: 0.8,
          num_outputs: 1
        }
      }
    );

    return NextResponse.json({
      success: true,
      imageUrl: Array.isArray(output) ? output[0] : output,
    });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}