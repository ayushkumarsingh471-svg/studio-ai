"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { UploadCloud, ImageIcon, Download, LayoutDashboard, Grid, CreditCard, LogOut, RefreshCcw, Sparkles, Zap, Settings, Check, User } from 'lucide-react';
import { SignInButton, UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { syncUserAccount, verifyAndAddCredits } from '@/lib/actions';
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
    name: "Testing",
    credits: 2,
    price: 10,
    popular: false,
    description: "Live payment test karne ke liye.",
    features: ["2 AI Image Credits", "Real Payment Check", "Instant Update"],
  },
  {
    name: "Starter",
    credits: 50,
    price: 249,
    popular: false,
    description: "Perfect for testing AI image generation.",
    features: ["50 AI Image Credits", "Standard Resolution", "Community Support"],
  },
  {
    name: "Basic",
    credits: 100,
    price: 399,
    popular: true,
    description: "For regular users who want more AI power.",
    features: ["100 AI Image Credits", "High-Quality 4K", "Priority Support"],
  },
  {
    name: "Pro",
    credits: 250,
    price: 999,
    popular: false,
    description: "For professionals and heavy users.",
    features: ["250 AI Image Credits", "Ultra 4K Resolution", "VIP PRO Badge"],
  },
];

const fallbackBgImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
  "https://images.unsplash.com/photo-1583331861140-b4bbeebd02d9?q=80&w=400",
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=400",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=400",
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
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const backgroundItems = useMemo(() => {
    const sourceImages = galleryImages.length > 0 
      ? galleryImages.map(img => img.imageUrl) 
      : fallbackBgImages;

    return sourceImages.slice(0, 10).map((url, i) => ({
      id: `bg_${i}`,
      url: url,
      top: `${10 + (i * 13) % 75}%`,
      left: `${5 + (i * 29) % 85}%`,
      size: 90 + (i % 3) * 30,
      initialRotate: i * 15,
      yFloat: (i % 2 === 0 ? -25 : 25),
      duration: 15 + (i % 4) * 5,
      delay: i * 0.8,
    }));
  }, [galleryImages]);

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

  const handleRazorpayPayment = async (planName: string, planPrice: number, planCredits: number) => {
    if (!user?.id) {
      alert("Aapko pehle login karna hoga!");
      return;
    }

    setLoadingPlan(planName);

    try {
      const loadScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const res = await loadScript();
      if (!res) {
        alert("Razorpay load nahi hua. Apna internet check karein!");
        setLoadingPlan(null);
        return;
      }

      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: planPrice, userId: user.id, credits: planCredits }),
      });

      const data = await response.json();

      if (!data.orderId) {
        alert(`Order create error: ${data.error || "Unknown error"}`);
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Studio AI",
        description: `${planName} Plan Subscription`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            setLoadingPlan(planName);
            const verifyRes = await verifyAndAddCredits(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              planCredits
            );

            if (verifyRes.success) {
              setShowConfetti(true);
              alert(`Payment Successful! Aapke account mein ${planCredits} Credits add ho gaye hain! 🎉`);
              await loadDashboardData(); 
              setActiveTab('generator'); 
              setTimeout(() => setShowConfetti(false), 6000);
            } else {
              alert(`Verification Error: ${verifyRes.error}`);
            }
          } catch (err) {
            console.error("Verification system crash:", err);
            alert("Payment verification failed layout updates.");
          } finally {
            setLoadingPlan(null);
          }
        },
        theme: { color: "#10b981" },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong with the checkout process.");
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
      className="flex flex-col lg:flex-row lg:h-screen bg-[#030014] text-neutral-50 overflow-x-hidden lg:overflow-hidden font-sans relative selection:bg-emerald-500/30"
    >
      {showConfetti && (
        <div className="absolute inset-0 z-[100] pointer-events-none fixed">
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} gravity={0.2} />
        </div>
      )}

      {/* SPACE BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none fixed">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-800 blur-[150px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-900 blur-[150px] rounded-full mix-blend-screen" />
        
        {stars.map((star) => (
          <motion.div key={star.id} className="absolute bg-white rounded-full z-10" style={{ top: star.top, left: star.left, width: star.size, height: star.size }} animate={{ opacity: [0.05, 0.7, 0.05] }} transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }} />
        ))}

        <AnimatePresence>
          {backgroundItems.map((item) => (
            <motion.div
              key={item.id}
              className="absolute rounded-2xl overflow-hidden border border-white/5 opacity-[0.12] blur-[1px] shadow-2xl shadow-black/50 z-10 hidden lg:block"
              style={{ top: item.top, left: item.left, width: item.size, height: item.size }}
              initial={{ opacity: 0, scale: 0.8, rotate: item.initialRotate - 5 }}
              animate={{ 
                opacity: [0.08, 0.15, 0.08],
                scale: [1, 1.05, 1],
                y: [0, item.yFloat, 0],
                rotate: [item.initialRotate, item.initialRotate + 3, item.initialRotate]
              }}
              transition={{ duration: item.duration, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
            >
              <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0a0f24]/70 lg:bg-[#0a0f24]/50 backdrop-blur-2xl p-4 lg:p-6 flex flex-col lg:justify-between z-20 shrink-0 sticky lg:relative top-0">
        <div className="space-y-4 lg:space-y-8 flex flex-row lg:flex-col justify-between items-center lg:items-stretch w-full">
          <div className="font-black text-xl lg:text-2xl tracking-widest text-white flex items-center gap-2 drop-shadow-md">
            STUDIO<span className="text-emerald-500">.AI</span>
          </div>
          
          <nav className="flex flex-row lg:flex-col gap-1.5 lg:space-y-3 overflow-x-auto lg:overflow-visible max-w-[60%] lg:max-w-none no-scrollbar py-1">
            <Button variant="ghost" onClick={() => setActiveTab('generator')} className={`w-auto lg:w-full justify-start text-xs lg:text-sm px-3 py-2 border ${activeTab === 'generator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <LayoutDashboard className="mr-1.5 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 shrink-0"/> <span className="hidden sm:inline lg:inline">AI</span> Generator
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('gallery')} className={`w-auto lg:w-full justify-start text-xs lg:text-sm px-3 py-2 border ${activeTab === 'gallery' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <Grid className="mr-1.5 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 shrink-0"/> <span className="hidden sm:inline lg:inline">My</span> Gallery
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('billing')} className={`w-auto lg:w-full justify-start text-xs lg:text-sm px-3 py-2 border ${activeTab === 'billing' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-transparent border-transparent text-slate-400'}`}>
              <CreditCard className="mr-1.5 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 shrink-0"/> Upgrade
            </Button>
          </nav>
        </div>
        
        <motion.div className="mt-3 lg:mt-0 bg-gradient-to-br from-[#0f172a]/80 to-[#020617]/80 border border-white/10 p-2 lg:p-4 rounded-xl text-center relative shadow-xl z-10 flex lg:flex-col justify-between items-center lg:justify-center gap-2 lg:gap-0">
            <div className="flex justify-center items-center gap-1 lg:gap-2 mb-0 lg:mb-1">
                <p className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-widest font-bold">Credits</p>
                <Zap size={12} className="text-emerald-500" />
            </div>
            <p className="text-xl lg:text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              {isSignedIn ? credits : "Login"}
            </p>
        </motion.div>
      </aside>

      <main className="flex-1 flex flex-col p-4 lg:p-8 relative lg:overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent w-full">
        <div className="flex justify-between items-center z-50 mb-6 lg:mb-8 shrink-0 pb-4 lg:pb-6 border-b border-white/5">
          <div>
            <h1 className="text-xl lg:text-3xl font-black text-white drop-shadow-md">
              {activeTab === 'generator' ? 'Studio Workspace' : activeTab === 'gallery' ? 'Asset Gallery' : 'Subscription Plans'}
            </h1>
          </div>
          <div className="flex gap-2 lg:gap-4 items-center">
            {activeTab === 'generator' && (
                <Button onClick={() => handleDownload(aiGeneratedImage)} variant="outline" className="bg-white/5 border-white/10 hover:bg-emerald-600/20 text-emerald-400 text-xs lg:text-sm font-bold rounded-full px-4 lg:px-6 py-1.5 h-auto backdrop-blur-sm">
                  <Download size={14} className="mr-1 lg:mr-2" /> Save Asset
                </Button>
            )}
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 text-xs lg:text-sm font-bold rounded-full px-4 lg:px-6">Sign In</Button>
              </SignInButton>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} className="flex-1 flex flex-col z-10 w-full">
            {activeTab === 'generator' && (
                <div className="flex-1 flex items-center justify-center min-h-[320px] lg:min-h-[500px] py-4">
                    <div className="relative w-full max-w-2xl aspect-[4/3] bg-[#0a0f24]/50 backdrop-blur-xl rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl shadow-black/50">
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${aiGeneratedImage})`, clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }} />
                        <div className="absolute inset-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewUrl})`, clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }} />
                        <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20" style={{ left: `calc(${sliderPos}% - 2px)` }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 lg:w-10 lg:h-10 bg-white/10 border border-white text-white font-bold rounded-full flex items-center justify-center text-[10px] lg:text-xs shadow-md">◂▸</div>
                        </div>
                        <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30" />
                    </div>
                </div>
            )}

            {activeTab === 'gallery' && (
                <div className="flex-1 w-full z-10">
                    {galleryImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-20 lg:py-24 bg-[#0a0f24]/30 backdrop-blur-md rounded-2xl border border-white/5">
                        <Grid size={40} className="text-slate-600 mb-3 animate-pulse" />
                        <h2 className="text-lg font-bold text-white">Your gallery is empty</h2>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 pb-12">
                        {galleryImages.map((img) => (
                          <div key={img.id} className="relative rounded-xl lg:rounded-2xl overflow-hidden aspect-square border border-white/10 bg-[#0a0f24]/50 shadow-md group">
                            <img src={img.imageUrl} alt="AI Asset" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                        ))}
                      </div>
                    )}
                </div>
            )}

            {activeTab === 'billing' && (
                <div className="flex-1 flex items-center justify-center w-full py-4 lg:pb-10 z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full max-w-[90rem] mx-auto px-1">
                        {pricingPlans.map((plan) => (
                          // 🚀 MAGIC: Yahan pe motion.div aur whileHover effect lagaya hai!
                          <motion.div 
                            key={plan.name} 
                            whileHover={{ y: -8 }} // Hover karne par float karega
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`flex flex-col relative rounded-2xl lg:rounded-3xl p-6 lg:p-8 border backdrop-blur-md shadow-2xl transition-all duration-300 cursor-pointer ${
                              plan.popular 
                                ? "bg-gradient-to-br from-[#0f172a]/90 to-[#020617]/90 border-emerald-500/50 lg:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:border-emerald-400" 
                                : "bg-[#0a0f24]/50 border-white/10 hover:border-emerald-500/40 hover:bg-[#0f172a]/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                            }`}
                          >
                            {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Best Value</span>}
                            <h3 className={`text-xl lg:text-2xl font-bold uppercase ${plan.popular ? 'text-emerald-400' : 'text-slate-200'}`}>{plan.name}</h3>
                            <div className="my-4 lg:my-6"><span className="text-4xl lg:text-5xl font-black text-white drop-shadow-md">₹{plan.price}</span></div>
                            
                            <ul className="space-y-3 lg:space-y-4 mb-6 lg:mb-8 flex-1 text-left">
                                {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center text-slate-300">
                                    <Check className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-400 mr-2.5 lg:mr-3 shrink-0" />
                                    <span className="text-xs lg:text-sm font-medium">{feature}</span>
                                </li>
                                ))}
                            </ul>

                            <Button onClick={() => handleRazorpayPayment(plan.name, plan.price, plan.credits)} disabled={loadingPlan === plan.name} className={`w-full py-5 lg:py-6 font-black rounded-xl transition-all text-xs lg:text-sm ${plan.popular ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white'}`}>
                              {loadingPlan === plan.name ? "Processing..." : `Get ${plan.credits} Credits`}
                            </Button>
                          </motion.div>
                        ))}
                    </div>
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* RIGHT SIDEBAR CONFIGURATION PANELS */}
      {activeTab === 'generator' && (
        <aside className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-white/5 bg-[#0a0f24]/80 lg:bg-[#0a0f24]/50 backdrop-blur-2xl p-5 lg:p-6 flex flex-col justify-between z-20 shrink-0 relative lg:overflow-y-auto">
            <div className="space-y-5 lg:space-y-6 z-10 w-full">
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 border-b border-white/10 pb-3 flex items-center gap-2"><Settings size={14}/> Asset Configuration</h3>
            
            <div className="space-y-2.5 bg-white/5 p-4 lg:p-5 rounded-2xl border border-white/5">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">1. Source Asset</label>
                <div className="relative">
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <Button variant="outline" className="w-full bg-[#020617]/50 text-slate-300 border border-dashed border-emerald-500/30 py-5 lg:py-6 text-xs font-bold rounded-xl hover:border-emerald-500/70">
                    <UploadCloud size={16} className="text-emerald-400 mr-2" />
                    {productFile ? productFile.name.substring(0, 15) + '...' : "Drop Product Photo..."}
                </Button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                  <User size={12}/> 1.5 Photo Type / Mode
                </label>
                <select 
                  value={genMode} 
                  onChange={(e) => setGenMode(e.target.value as any)} 
                  className="w-full bg-white/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-black backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <option value="product_only" className="bg-neutral-900 text-slate-200">Sirf Product (Background Change)</option>
                  <option value="with_model" className="bg-neutral-900 text-emerald-400 font-bold">Model ke sath (Fashion & Lifestyle)</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">2. Environment</label>
                <select value={bgContext} onChange={(e) => setBgContext(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">Minimalist Studio Backdrop</option>
                  <option className="bg-neutral-900">Outdoor Natural Lighting</option>
                  <option className="bg-neutral-900">Urban Modern Lifestyle</option>
                  <option className="bg-neutral-900">Luxury Premium Studio</option>
                </select>
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">3. Lighting</label>
                <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">Cinematic Rim Lighting</option>
                  <option className="bg-neutral-900">Soft Diffused Studio</option>
                  <option className="bg-neutral-900">Dramatic High Contrast</option>
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] text-slate-300 font-black uppercase tracking-widest block">4. Camera Lens</label>
                <select value={lens} onChange={(e) => setLens(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer">
                  <option className="bg-neutral-900">85mm Portrait (Shallow Depth)</option>
                  <option className="bg-neutral-900">35mm Wide Angle</option>
                  <option className="bg-neutral-900">Macro Lens Details</option>
                </select>
            </div>
            </div>

            <div className="pt-4 lg:pt-6 border-t border-white/10 mt-5 lg:mt-6 z-10 w-full">
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full py-5 lg:py-6 text-[11px] bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]">
                {isGenerating ? "Processing Asset..." : "Execute Generation ✦"}
              </Button>
            </div>
        </aside>
      )}
    </motion.div>
  );
}