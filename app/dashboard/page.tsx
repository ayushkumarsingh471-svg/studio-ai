"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, Download, LayoutDashboard, Grid, CreditCard, LogOut, RefreshCcw, Sparkles, Zap, Settings } from 'lucide-react';
import { SignInButton, UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { syncUserAccount } from '@/lib/actions';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface GalleryItem {
  id: number;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

// ==========================================
// SPACE BACKGROUND STARS (Deterministic for Hydration)
// ==========================================
const stars = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  top: `${(i * 27) % 100}%`,
  left: `${(i * 13) % 100}%`,
  size: (i % 3) + 1,
  duration: (i % 4) + 2,
  delay: (i % 3) * 0.5,
}));

export default function StudioWorkspace() {
  const { isSignedIn, user } = useUser();
  
  // Dynamic System States
  const [credits, setCredits] = useState<number | string>("...");
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>([]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'generator' | 'gallery' | 'billing'>('generator');
  
  // Workspace States
  const [sliderPos, setSliderPos] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false); // STRIPE LOADING STATE
  
  // Configuration States
  const [bgContext, setBgContext] = useState("Minimalist Studio Backdrop");
  const [lighting, setLighting] = useState("Cinematic Rim Lighting");
  const [lens, setLens] = useState("85mm Portrait (Shallow Depth)");
  const [productFile, setProductFile] = useState<File | null>(null);
  
  // Preview States
  const [previewUrl, setPreviewUrl] = useState<string>("https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop");
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string>("https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop");

  // ==========================================
  // INITIALIZATION & SYNC
  // ==========================================
  useEffect(() => {
    if (isSignedIn && user) {
      loadDashboardData();
    }
  }, [isSignedIn, user, activeTab]);

  const loadDashboardData = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const email = user.primaryEmailAddress?.emailAddress || "user@studio.ai";
      const data = await syncUserAccount(email);
      setCredits(data.credits);
      setGalleryImages(data.gallery as GalleryItem[]);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
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
      alert("Unable to download the asset automatically. Please right-click and save the image.");
    }
  };

  // ==========================================
  // STRIPE PAYMENT FUNCTION 
  // ==========================================
  const onUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch("/api/stripe");
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Unable to connect to the payment gateway. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  // ==========================================
  // GENERATION PIPELINE 
  // ==========================================
  const handleGenerate = async () => {
    if (!isSignedIn) {
        alert("Authentication required. Please sign in to access generation tools.");
        return;
    }
    if (!productFile) {
      alert("Please upload a source product image to proceed.");
      return;
    }
    if (typeof credits === 'number' && credits <= 0) {
      alert("Credit limit reached. Please upgrade your subscription plan to continue generating.");
      setActiveTab('billing');
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
        await loadDashboardData(); 
      } else {
        alert(data.error || "The AI processing engine encountered an unexpected error.");
      }
    } catch (error) {
      console.error("Generation Pipeline Error:", error);
      alert("A network connection error occurred. Please verify your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="flex h-screen bg-[#030014] text-neutral-50 overflow-hidden font-sans relative selection:bg-emerald-500/30"
    >
      {/* ======================================================== */}
      {/* SPACE BACKGROUND & STARS (Behind everything) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-800 blur-[150px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-900 blur-[150px] rounded-full mix-blend-screen" />
        
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ======================================================== */}
      {/* LEFT NAVIGATION SIDEBAR (Glassmorphism) */}
      {/* ======================================================== */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0f24]/50 backdrop-blur-2xl p-6 flex flex-col justify-between z-10 shrink-0">
        <div className="space-y-8">
          <div className="font-black text-2xl tracking-widest text-white flex items-center gap-2 drop-shadow-md">
            STUDIO<span className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">.AI</span>
          </div>
          <nav className="space-y-3">
            <Button variant="ghost" onClick={() => setActiveTab('generator')} className={`w-full justify-start transition-all duration-300 border ${activeTab === 'generator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <LayoutDashboard className="mr-3 h-5 w-5"/> AI Generator
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('gallery')} className={`w-full justify-start transition-all duration-300 border ${activeTab === 'gallery' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Grid className="mr-3 h-5 w-5"/> My Gallery
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('billing')} className={`w-full justify-start transition-all duration-300 border ${activeTab === 'billing' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <CreditCard className="mr-3 h-5 w-5"/> Billing & Plans
            </Button>
          </nav>
        </div>
        
        {/* LIVE CREDIT METRICS (Glass Card) */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-[#0f172a]/80 to-[#020617]/80 backdrop-blur-md border border-white/10 p-4 rounded-xl text-center relative group shadow-xl">
            {isSignedIn && (
                <Button onClick={loadDashboardData} disabled={isSyncing} variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6 text-slate-500 hover:text-emerald-400 hover:bg-white/5 transition-all rounded-full">
                    <RefreshCcw size={14} className={isSyncing ? "animate-spin text-emerald-500" : ""} />
                </Button>
            )}
            <div className="flex justify-center items-center gap-2 mb-1 mt-2">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Credits</p>
                <Zap size={12} className="text-emerald-500" />
            </div>
            <p className={`text-3xl font-black transition-colors tracking-tight ${typeof credits === 'number' && credits <= 0 ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'}`}>
              {isSignedIn ? credits : "Login"}
            </p>
        </motion.div>
      </aside>

      {/* ======================================================== */}
      {/* PRIMARY WORKSPACE AREA */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col p-8 relative overflow-y-auto z-10">
        
        {/* HEADER CONTROLS */}
        <div className="flex justify-between items-start z-50 mb-8 shrink-0 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
              {activeTab === 'generator' ? 'Studio Workspace' : activeTab === 'gallery' ? 'Asset Gallery' : 'Subscription'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              {activeTab === 'generator' ? 'Configure adjustments and execute AI pipeline.' : activeTab === 'gallery' ? 'Review archived pipeline items and assets.' : 'Manage client tiers and subscriptions.'}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {activeTab === 'generator' && (
                <Button onClick={() => handleDownload(aiGeneratedImage)} variant="outline" className="bg-white/5 border-white/10 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-emerald-400 transition-all duration-300 flex gap-2 items-center shadow-lg rounded-full px-6 backdrop-blur-md font-bold">
                  <Download size={16} /> Save Asset
                </Button>
            )}

            {isSignedIn && (
              <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
                <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all duration-300 flex gap-2 items-center shadow-sm rounded-full backdrop-blur-md">
                  <LogOut size={14} /> Disconnect
                </Button>
              </SignOutButton>
            )}

            {isSignedIn ? (
              <div className="p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 border border-emerald-500/50 shadow-md" } }} />
              </div>
            ) : (
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold transition-all shadow-md rounded-full px-6">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* WORKSPACE CONTENT MODULE */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {/* TAB 1: AI GENERATOR */}
            {activeTab === 'generator' && (
                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                    <div className="relative w-full max-w-2xl aspect-[4/3] bg-[#0a0f24]/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center group">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${aiGeneratedImage})`, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }} />
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewUrl})`, clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }} />
                        
                        {/* Interactive Slider Line */}
                        <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_20px_rgba(0,0,0,0.9)] z-20 pointer-events-none" style={{ left: `calc(${sliderPos}% - 2px)` }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md border border-white text-white font-bold rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] text-xs select-none">
                              ◂▸
                            </div>
                        </div>
                        <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
                        
                        {/* Overlay Workspace Badges */}
                        <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold z-10 flex items-center gap-2 text-white border border-white/10 shadow-lg"><Sparkles size={14} className="text-emerald-400"/> AI Generated</div>
                        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold z-10 flex items-center gap-2 text-white border border-white/10 shadow-lg"><ImageIcon size={14} className="text-slate-400"/> Raw Product</div>
                    </div>
                </div>
            )}

            {/* TAB 2: DYNAMIC GALLERY */}
            {activeTab === 'gallery' && (
                <div className="flex-1 w-full">
                    {galleryImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-24 bg-[#0a0f24]/30 backdrop-blur-md border border-white/5 rounded-3xl">
                        <Grid size={48} className="text-slate-600 mb-4 animate-pulse" />
                        <h2 className="text-xl font-bold text-white">Your pipeline gallery is empty</h2>
                        <p className="text-slate-400 mt-2 max-w-xs text-sm font-medium">Execute an asset generation sequence to view stored items in this interface.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {galleryImages.map((img) => (
                          <motion.div key={img.id} whileHover={{ y: -6, scale: 1.02 }} className="group relative rounded-2xl overflow-hidden bg-[#0a0f24]/50 border border-white/10 aspect-square shadow-lg backdrop-blur-md">
                            <img src={img.imageUrl} alt="AI Asset" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                              <p className="text-xs text-slate-300 line-clamp-2 mb-4 italic font-medium">"{img.prompt}"</p>
                              <Button onClick={() => handleDownload(img.imageUrl)} size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]"><Download size={14} className="mr-2"/> Save Asset</Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                </div>
            )}

            {/* TAB 3: BILLING & PLANS */}
            {activeTab === 'billing' && (
                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                        {/* Starter Tier */}
                        <motion.div whileHover={{ scale: 1.02 }} className="bg-[#0a0f24]/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col items-center justify-between gap-6 shadow-xl relative">
                            <div className="text-center space-y-2">
                              <h3 className="text-xl font-bold tracking-widest uppercase text-slate-300">Starter Tier</h3>
                              <div className="text-5xl font-black text-white mt-2 drop-shadow-md">$0 <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">/ mo</span></div>
                              <p className="text-sm text-slate-400 pt-4 font-medium">3 Initial Freemium Generations</p>
                            </div>
                            <Button className="w-full bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed font-bold rounded-xl py-6" disabled>Current Plan</Button>
                        </motion.div>
                        
                        {/* Professional Tier (STRIPE BUTTON HERE) */}
                        <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-[#0f172a]/90 to-[#020617]/90 backdrop-blur-xl border border-emerald-500/50 p-8 rounded-3xl flex flex-col items-center justify-between gap-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                            <span className="absolute top-0 bg-emerald-500 text-white text-[10px] px-4 py-1 rounded-b-xl font-black uppercase tracking-widest shadow-md">Most Popular</span>
                            <div className="text-center space-y-2 mt-4">
                              <h3 className="text-xl font-bold tracking-widest uppercase text-emerald-400">Professional</h3>
                              <div className="text-5xl font-black text-white mt-2 drop-shadow-md">$19 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ mo</span></div>
                              <p className="text-sm text-slate-300 pt-4 font-medium">Unlimited Studio Generation Credits</p>
                            </div>
                            <Button 
                                onClick={onUpgrade} 
                                disabled={isUpgrading} 
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] rounded-xl py-6"
                            >
                                {isUpgrading ? "Loading..." : "Upgrade Plan"}
                            </Button>
                        </motion.div>
                    </div>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ======================================================== */}
      {/* RIGHT SIDEBAR - CONTROLS (Glassmorphism) */}
      {/* ======================================================== */}
      {activeTab === 'generator' && (
        <aside className="w-[340px] border-l border-white/5 bg-[#0a0f24]/50 backdrop-blur-2xl p-6 flex flex-col justify-between shadow-[-20px_0_40px_rgba(0,0,0,0.5)] z-10 shrink-0 relative overflow-y-auto">
            <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-white/10 pb-4 flex items-center gap-2"><Settings size={14}/> Asset Configuration</h3>
            
            {/* Step 1: Upload Module */}
            <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">1. Source Asset</label>
                <div className="relative">
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full bg-[#020617]/50 text-slate-300 border border-dashed border-emerald-500/30 hover:border-emerald-400/80 transition-colors flex justify-center items-center gap-2 py-6 text-xs font-bold rounded-xl group overflow-hidden relative">
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <UploadCloud size={18} className="text-emerald-400 group-hover:-translate-y-1 transition-transform" />
                    {productFile ? productFile.name.substring(0, 18) + '...' : "Drop Product Photo..."}
                </Button>
                </div>
            </div>

            {/* Step 2: Dropdowns */}
            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">2. Environment</label>
                <select value={bgContext} onChange={(e) => setBgContext(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer font-bold backdrop-blur-md">
                  <option className="bg-neutral-900">Minimalist Studio Backdrop</option>
                  <option className="bg-neutral-900">Outdoor Natural Lighting</option>
                  <option className="bg-neutral-900">Urban Modern Lifestyle</option>
                </select>
            </div>
            
            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">3. Lighting</label>
                <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer font-bold backdrop-blur-md">
                  <option className="bg-neutral-900">Cinematic Rim Lighting</option>
                  <option className="bg-neutral-900">Soft Diffused Studio</option>
                  <option className="bg-neutral-900">Dramatic High Contrast</option>
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">4. Camera Lens</label>
                <select value={lens} onChange={(e) => setLens(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer font-bold backdrop-blur-md">
                  <option className="bg-neutral-900">85mm Portrait (Shallow Depth)</option>
                  <option className="bg-neutral-900">35mm Wide Angle</option>
                  <option className="bg-neutral-900">Macro Lens Details</option>
                </select>
            </div>
            </div>

            {/* Execution Trigger */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-6 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98]">
                {isGenerating ? "Processing Asset..." : "Execute Generation ✦"}
              </Button>
            </div>
        </aside>
      )}
    </motion.div>
  );
}