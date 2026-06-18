"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, Download } from 'lucide-react';

export default function StudioWorkspace() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [bgContext, setBgContext] = useState("Minimalist Studio Backdrop");
  const [lighting, setLighting] = useState("Cinematic Rim Lighting");
  const [lens, setLens] = useState("85mm Portrait (Shallow Depth)");

  const [productFile, setProductFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop");
  
  // Default demo image
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string>("https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop");

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProductFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // NAYA FUNCTION: Image Download Karne Ke Liye
  const handleDownload = async () => {
    try {
      const response = await fetch(aiGeneratedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StudioAI_Asset_${Date.now()}.png`; // File ka automatic professional naam
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed", error);
      alert("Download me problem aayi. Kripya image par right-click karke 'Save Image As' karein.");
    }
  };

  const handleGenerate = async () => {
    if (!productFile) {
      alert("Boss Ayush, please upload a product photo first from the right menu! 📸");
      return;
    }

    setIsGenerating(true);
    try {
      const base64Image = await fileToBase64(productFile);
      
      const finalPrompt = `A hyper-realistic professional product photo of the main subject. Background: ${bgContext}. Lighting: ${lighting}. Camera Lens: ${lens}. 8k resolution, highly detailed, beautiful commercial photography, photorealistic, cinematic.`;
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, image: base64Image })
      });
      
      const data = await res.json();
      
      if (data.imageUrl) {
        setAiGeneratedImage(data.imageUrl);
      } else {
        alert("Oops! Generation failed. Error in backend.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to AI Server. Backend ka terminal check karein.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between z-10">
        <div className="space-y-8">
          <div className="font-black text-2xl tracking-widest text-white">STUDIO<span className="text-emerald-500">.AI</span></div>
          <nav className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800">Dashboard</Button>
            <Button variant="secondary" className="w-full justify-start bg-neutral-800 text-white hover:bg-neutral-700">AI Generator</Button>
            <Button variant="ghost" className="w-full justify-start text-neutral-400 hover:text-white hover:bg-neutral-800">Billing & Plans</Button>
          </nav>
        </div>
      </aside>

      {/* CENTER WORKSPACE */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-950 relative">
        <div className="absolute top-8 left-8 flex justify-between w-[calc(100%-4rem)] items-start">
          <div>
            <h1 className="text-2xl font-semibold">Product Image Workspace</h1>
            <p className="text-neutral-500 text-sm mt-1">Configure lighting and generate AI asset.</p>
          </div>
          
          {/* NAYA DOWNLOAD BUTTON */}
          <Button onClick={handleDownload} variant="outline" className="bg-neutral-900 border-neutral-700 hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all flex gap-2 items-center">
            <Download size={16} /> Download Asset
          </Button>
        </div>

        <div className="relative w-full max-w-2xl aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center group mt-8">
          
          <div className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-all duration-75" style={{ backgroundImage: `url(${aiGeneratedImage})`, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }} />
          <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewUrl})`, clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }} />

          <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20" style={{ left: `calc(${sliderPos}% - 2px)` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black text-xs font-bold">◂ ▸</span>
            </div>
          </div>
          <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
          
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold z-10 flex items-center gap-2"><ImageIcon size={14}/> AI Generated</div>
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold z-10 flex items-center gap-2"><ImageIcon size={14}/> Raw Product</div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 border-l border-neutral-800 bg-neutral-900 p-6 flex flex-col justify-between shadow-xl z-10 relative">
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">AI Settings</h3>
          
          <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Step 1: Upload Product</label>
            <div className="relative">
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <Button variant="outline" className="w-full bg-neutral-900 text-neutral-200 border-dashed border-neutral-600 hover:bg-neutral-800 hover:text-white flex justify-center items-center gap-2">
                <UploadCloud size={18} className="text-emerald-500" />
                {productFile ? productFile.name.substring(0, 20) + '...' : "Choose File..."}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Background Context</label>
            <select value={bgContext} onChange={(e) => setBgContext(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
              <option>Minimalist Studio Backdrop</option>
              <option>Outdoor Natural Marble</option>
              <option>Neon Cyberpunk Cityscape</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Lighting Style</label>
            <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
              <option>Cinematic Rim Lighting</option>
              <option>Softbox Commercial Studio</option>
              <option>Dramatic Hard Shadows</option>
            </select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-6 text-sm bg-white text-black hover:bg-neutral-200 font-bold tracking-wide rounded-lg transition-all disabled:opacity-50 mt-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          {isGenerating ? "Rendering from Replicate..." : "Generate Product Image ✦"}
        </Button>
      </aside>
    </div>
  );
}