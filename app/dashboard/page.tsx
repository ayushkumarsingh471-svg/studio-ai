"use client";

import React, { useState, useEffect, useMemo } from 'react'; // added useMemo
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, Download, LayoutDashboard, Grid, CreditCard, LogOut, RefreshCcw, Sparkles, Zap, Settings, Check, User } from 'lucide-react';
import { SignInButton, UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { syncUserAccount } from '@/lib/actions';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface GalleryItem {
  id: number;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

const pricingPlans = [
  {
    name: "Basic",
    credits: 100,
    price: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    popular: false,
    description: "Perfect for testing AI image generation.",
    features: ["100 AI Image Credits", "Standard Resolution", "Community Support"],
  },
  {
    name: "Pro",
    credits: 500,
    price: 899,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    popular: true,
    description: "For regular users who want more AI power.",
    features: [
      "500 AI Image Credits",
      "High-Quality 4K Generation",
      "Priority Support",
      "VIP PRO Badge on Profile",
    ],
  },
];

// ==========================================
// 🚀 FALLBACK DEMO IMAGES (For new users)
// ==========================================
const fallbackBgImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400", // Red Shoe
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400", // White Watch
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400", // Headphone
  "https://images.unsplash.com/photo-1583331861140-b4bbeebd02d9?q=80&w=400", // Perfume
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=400", // Colorful Shoes
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=400", // Smart Watch
];

const stars = Array.from({ length: 30 }).map((_, i) => ({
  id: i,
  top: `${(i * 31) % 100}%`,
  left: `${(i * 17) % 100}%`,
  size: (i % 2) + 1,
  duration: (i % 3) + 3,
  delay: (i % 2) * 1,
}));

export default function StudioWorkspace() {
  const { isSignedIn, user } = useUser();
  
  const [credits, setCredits] = useState<number | string>("...");
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'gallery' | 'billing'>('generator');
  
  const [sliderPos, setSliderPos] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null); 
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  const [genMode, setGenMode] = useState<'product_only' | 'with_model'>('product_only');
  
  const [bgContext, setBgContext] = useState("Minimalist Studio Backdrop");
  const [lighting, setLighting] = useState("Cinematic Rim Lighting");
  const [lens, setLens] = useState("85mm Portrait (Shallow Depth)");
  const [productFile, setProductFile] = useState<File | null>(null);
  
  const [previewUrl, setPreviewUrl] = useState<string>("https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop");
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string>("https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop");

  useEffect(() => {
    if (isSignedIn && user) {
      loadDashboardData();
    }
  }, [isSignedIn, user, activeTab]);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowConfetti(true);
      setActiveTab('billing');
      setTimeout(() => setShowConfetti(false), 8000);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress || "user@studio.ai";
      const data = await syncUserAccount(email);
      setCredits(data.credits);
      setGalleryImages(data.gallery as any);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================
  // ✨ LOGIC TO SCAFFER FLOATING IMAGES
  // ==========================================
  const backgroundItems = useMemo(() => {
    // Gallery images se data uthana, agar khali ho toh demo images use karna
    const sourceImages = galleryImages.length > 0 
      ? galleryImages.map(img => img.imageUrl) 
      : fallbackBgImages;

    // Max 10 items scatter karna space mein
    return sourceImages.slice(0, 10).map((url, i) => ({
      id: `bg_${i}`,
      url: url,
      // Random par structured positions (taaki main UI block na ho)
      top: `${10 + (i * 13) % 75}%`,
      left: `${5 + (i * 29) % 85}%`,
      size: 90 + (i % 3) * 30, // Sizes between 90px to 150px
      // Different rotation and float directions
      initialRotate: i * 15,
      yFloat: (i % 2 === 0 ? -25 : 25), // Float up or down
      duration: 15 + (i % 4) * 5, // Slow float durations (15s to 30s)
      delay: i * 0.8,
    }));
  }, [galleryImages]); // Re-calculate jab user image generate kare

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

  const handleDownload = async (imageUrlToDownload: string) => {
    try {
      const response = await fetch(imageUrlToDownload);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `StudioAI_Asset_${Date.now()}.png`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Asset Download Failure:", error);
    }
  };

  const handleCheckout = async (priceId: string | undefined, planName: string) => {
    if (!priceId) return alert("Price ID not found!");
    try {
      setLoadingPlan(planName);
      const response = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleGenerate = async () => {
    if (!isSignedIn) return alert("Please sign in first.");
    if (!productFile) return alert("Please upload a product photo.");
    if (typeof credits === 'number' && credits <= 0) {
      alert("Credit limit reached!");
      setActiveTab('billing');
      return;
    }

    setIsGenerating(true);
    try {
      const base64Image = await fileToBase64(productFile);
      
      let basePrompt = "";
      if (genMode === 'product_only') {
        basePrompt = `A hyper-realistic professional studio product commercial photo of the main item. Seamlessly placed in a setting of ${bgContext}.`;
      } else {
        basePrompt = `A high-end commercial fashion lifestyle photo featuring a professional, stylish model naturally holding, wearing or interacting with the product. Setting: ${bgContext}.`;
      }

      const finalPrompt = `${basePrompt} Lighting: ${lighting}. Camera Lens: ${lens}. 8k resolution, highly detailed, photorealistic, cinematic.`;
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, image: base64Image })
      });
      
      const data = await res.json();
      if (data.imageUrl) {
        setAiGeneratedImage(data.imageUrl);
        await loadDashboardData(); 
      } else {
        alert(data.error || "Generation failed.");
      }
    } catch (error) {
      console.error("Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex h-screen bg-[#030014] text-neutral-50 overflow-hidden font-sans relative selection:bg-emerald-500/30"
    >
      {showConfetti && (
        <div className="absolute inset-0 z-[100] pointer-events-none">
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={600} gravity={0.2} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 🌌 UPDATED SPACE BACKGROUND (WITH FLOATING PHOTOS) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Glow Gradients */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-800 blur-[150px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-900 blur-[150px] rounded-full mix-blend-screen" />
        
        {/* Animated Stars */}
        {stars.map((star) => (
          <motion.div key={star.id} className="absolute bg-white rounded-full z-10" style={{ top: star.top, left: star.left, width: star.size, height: star.size }} animate={{ opacity: [0.05, 0.7, 0.05] }} transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }} />
        ))}

        {/* 🌟 NEW: FLOATING (TAHARTI HUI) BACKGROUND PHOTOS */}
        <AnimatePresence>
          {backgroundItems.map((item) => (
            <motion.div
              key={item.id}
              className="absolute rounded-2xl overflow-hidden border border-white/5 opacity-[0.12] blur-[1px] shadow-2xl shadow-black/50 z-10"
              style={{ top: item.top, left: item.left, width: item.size, height: item.size }}
              // Floating Animation (taharna)
              initial={{ opacity: 0, scale: 0.8, rotate: item.initialRotate - 5 }}
              animate={{ 
                opacity: [0.08, 0.15, 0.08], // Pulses opacity
                scale: [1, 1.05, 1], // Gentle scaling
                y: [0, item.yFloat, 0], // Floats up/down
                rotate: [item.initialRotate, item.initialRotate + 3, item.initialRotate] // Gentle rotate
              }}
              transition={{ duration: item.duration, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
            >
              <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {/* Overlapping glass gradient for premium look */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0f24]/50 backdrop-blur-2xl p-6 flex flex-col justify-between z-20 shrink-0">
        <div className="space-y-8">
          <div className="font-black text-2xl tracking-widest text-white flex items-center gap-2 drop-shadow-md">
            STUDIO<span className="text-emerald-500">.AI</span>
          </div>
          <nav className="space-y-3">
            <Button variant="ghost" onClick={() => setActiveTab('generator')} className={`w-full justify-start border ${activeTab === 'generator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5"/> AI Generator
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('gallery')} className={`w-full justify-start border ${activeTab === 'gallery' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <Grid className="mr-3 h-5 w-5"/> My Gallery
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('billing')} className={`w-full justify-start border ${activeTab === 'billing' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <CreditCard className="mr-3 h-5 w-5"/> Billing & Plans
            </Button>
          </nav>
        </div>
        
        <motion.div className="bg-gradient-to-br from-[#0f172a]/80 to-[#020617]/80 border border-white/10 p-4 rounded-xl text-center relative shadow-xl z-10">
            <div className="flex justify-center items-center gap-2 mb-1 mt-2">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Credits</p>
                <Zap size={12} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {isSignedIn ? credits : "Login"}
            </p>
        </motion.div>
      </aside>

      {/* PRIMARY WORKSPACE */}
      <main className="flex-1 flex flex-col p-8 relative overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        <div className="flex justify-between items-start z-50 mb-8 shrink-0 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-black text-white drop-shadow-md">
              {activeTab === 'generator' ? 'Studio Workspace' : activeTab === 'gallery' ? 'Asset Gallery' : 'Subscription Plans'}
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            {activeTab === 'generator' && (
                <Button onClick={() => handleDownload(aiGeneratedImage)} variant="outline" className="bg-white/5 border-white/10 hover:bg-emerald-600/20 text-emerald-400 font-bold rounded-full px-6 backdrop-blur-sm">
                  <Download size={16} /> Save Asset
                </Button>
            )}
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 font-bold rounded-full px-6">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} className="flex-1 flex flex-col z-10">
            {activeTab === 'generator' && (
                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                    <div className="relative w-full max-w-2xl aspect-[4/3] bg-[#0a0f24]/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl shadow-black/50">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${aiGeneratedImage})`, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }} />
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewUrl})`, clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }} />
                        <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20" style={{ left: `calc(${sliderPos}% - 2px)` }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 border border-white text-white font-bold rounded-full flex items-center justify-center text-xs shadow-md">◂▸</div>
                        </div>
                        <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
                    </div>
                </div>
            )}

            {activeTab === 'gallery' && (
                <div className="flex-1 w-full z-10">
                    {galleryImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-24 bg-[#0a0f24]/30 backdrop-blur-md rounded-2xl border border-white/5">
                        <Grid size={48} className="text-slate-600 mb-4 animate-pulse" />
                        <h2 className="text-xl font-bold text-white">Your gallery is empty</h2>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {galleryImages.map((img) => (
                          <div key={img.id} className="relative rounded-2xl overflow-hidden aspect-square border border-white/10 bg-[#0a0f24]/50 shadow-md group">
                            <img src={img.imageUrl} alt="AI Asset" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                        ))}
                      </div>
                    )}
                </div>
            )}

            {activeTab === 'billing' && (
                <div className="flex-1 flex items-center justify-center w-full pb-10 z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                        {pricingPlans.map((plan) => (
                          <div key={plan.name} className={`flex flex-col relative rounded-3xl p-8 border backdrop-blur-md shadow-2xl ${plan.popular ? "bg-gradient-to-br from-[#0f172a]/90 to-[#020617]/90 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)]" : "bg-[#0a0f24]/50 border-white/10"}`}>
                            {plan.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Best Value</span>}
                            <h3 className={`text-2xl font-bold uppercase ${plan.popular ? 'text-emerald-400' : 'text-slate-200'}`}>{plan.name}</h3>
                            <div className="my-6"><span className="text-5xl font-black text-white drop-shadow-md">₹{plan.price}</span></div>
                            <Button onClick={() => handleCheckout(plan.priceId, plan.name)} disabled={loadingPlan === plan.name} className={`w-full py-6 font-black rounded-xl transition-all ${plan.popular ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10'}`}>
                              {loadingPlan === plan.name ? "Processing..." : `Get ${plan.credits} Credits`}
                            </Button>
                          </div>
                        ))}
                    </div>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* RIGHT SIDEBAR */}
      {activeTab === 'generator' && (
        <aside className="w-[340px] border-l border-white/5 bg-[#0a0f24]/50 backdrop-blur-2xl p-6 flex flex-col justify-between z-20 shrink-0 relative overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
            <div className="space-y-6 z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-white/10 pb-4 flex items-center gap-2"><Settings size={14}/> Asset Configuration</h3>
            
            {/* Step 1: Upload */}
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">1. Source Asset</label>
                <div className="relative">
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full bg-[#020617]/50 text-slate-300 border border-dashed border-emerald-500/30 py-6 text-xs font-bold rounded-xl hover:border-emerald-500/70">
                    <UploadCloud size={18} className="text-emerald-400 mr-2" />
                    {productFile ? productFile.name.substring(0, 18) + '...' : "Drop Product Photo..."}
                </Button>
                </div>
            </div>

            {/* 🔥 STEP: CHOOSE MODE */}
            <div className="space-y-3">
                <label className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                  <User size={12}/> 1.5 Photo Type / Mode
                </label>
                <select 
                  value={genMode} 
                  onChange={(e) => setGenMode(e.target.value as any)} 
                  className="w-full bg-white/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-black backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <option value="product_only" className="bg-neutral-900 text-slate-200">Sirf Product (Background Change)</option>
                  <option value="with_model" className="bg-neutral-900 text-emerald-400 font-bold">Model ke sath (Fashion & Lifestyle)</option>
                </select>
            </div>

            {/* Step 2: Environment */}
            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">2. Environment</label>
                <select value={bgContext} onChange={(e) => setBgContext(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">Minimalist Studio Backdrop</option>
                  <option className="bg-neutral-900">Outdoor Natural Lighting</option>
                  <option className="bg-neutral-900">Urban Modern Lifestyle</option>
                  <option className="bg-neutral-900">Luxury Premium Studio</option>
                </select>
            </div>
            
            {/* Step 3: Lighting */}
            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">3. Lighting</label>
                <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">Cinematic Rim Lighting</option>
                  <option className="bg-neutral-900">Soft Diffused Studio</option>
                  <option className="bg-neutral-900">Dramatic High Contrast</option>
                </select>
            </div>

            {/* Step 4: Lens */}
            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">4. Camera Lens</label>
                <select value={lens} onChange={(e) => setLens(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">85mm Portrait (Shallow Depth)</option>
                  <option className="bg-neutral-900">35mm Wide Angle</option>
                  <option className="bg-neutral-900">Macro Lens Details</option>
                </select>
            </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 z-10">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-6 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]">
                {isGenerating ? "Processing Asset..." : "Execute Generation ✦"}
              </Button>
            </div>
        </aside>
      )}
    </motion.div>
  );
}