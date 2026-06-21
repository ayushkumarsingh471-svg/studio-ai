"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Sparkles, ChevronRight, Camera, Zap, ShieldCheck } from 'lucide-react';
import { SignInButton, useAuth } from "@clerk/nextjs";

// Deterministic Stars for Space Background (Hydration safe)
const stars = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  top: `${(i * 27) % 100}%`,
  left: `${(i * 13) % 100}%`,
  size: (i % 3) + 1,
  duration: (i % 4) + 2,
  delay: (i % 3) * 0.5,
}));

// Floating AI Image Placeholders (Premium Unsplash Assets)
const floatingImages = [
  { id: 1, src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", left: "5%", size: 220, duration: 35, delay: 0, rotStart: -10, rotEnd: 15 },
  { id: 2, src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", left: "75%", size: 280, duration: 40, delay: 5, rotStart: 20, rotEnd: -10 },
  { id: 3, src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", left: "20%", size: 180, duration: 30, delay: 12, rotStart: 0, rotEnd: -20 },
  { id: 4, src: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80", left: "85%", size: 200, duration: 45, delay: 2, rotStart: 15, rotEnd: 30 },
  { id: 5, src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", left: "45%", size: 300, duration: 50, delay: 15, rotStart: -5, rotEnd: 5 },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } };
  const floatAnim = { y: ["-15px", "15px"], transition: { duration: 3.5, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" } };

  return (
    <div className="min-h-screen bg-[#030014] text-neutral-50 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      
      {/* ======================================================== */}
      {/* 1. SPACE BACKGROUND & STARS */}
      {/* ======================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Deep Nebulas (Glows) */}
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-800 blur-[150px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-emerald-900 blur-[150px] rounded-full mix-blend-screen" />
        
        {/* Twinkling Stars */}
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
      {/* 2. FLOATING AI IMAGES ANIMATION (Updated for visibility) */}
      {/* ======================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {floatingImages.map((img) => (
          <motion.div
            key={img.id}
            className="absolute rounded-2xl overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{ left: img.left, width: img.size, height: img.size * 1.3 }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ 
              y: ["110vh", "-50vh"], 
              rotate: [img.rotStart, img.rotEnd],
              // peak Opacity badhakar 0.35 ki (Ab images saaf dikhengi)
              opacity: [0, 0.35, 0.35, 0] 
            }}
            transition={{ duration: img.duration, repeat: Infinity, ease: "linear", delay: img.delay }}
          >
             {/* brightness-50 se dark rahi, grayscale se space theme match hui */}
             <img src={img.src} alt="AI Concept" className="w-full h-full object-cover grayscale brightness-50 mix-blend-overlay" />
             {/* Gradient fade blend karne ke liye */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-[#030014] opacity-80" />
          </motion.div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* FOREGROUND CONTENT (Website UI) */}
      {/* ======================================================== */}
      <div className="relative z-10">
        
        {/* Navbar */}
        <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-md bg-black/10">
          <div className="font-black text-2xl tracking-widest text-white flex items-center gap-2">
            STUDIO<span className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">.AI</span>
          </div>
          <div>
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 font-bold px-6 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-[0.98]">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <SignInButton forceRedirectUrl="/dashboard" mode="modal">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-6 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-[0.98]">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </motion.nav>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 max-w-5xl mx-auto">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col items-center">
              
              <motion.div variants={itemVariants}>
                <motion.div animate={floatAnim} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a0f24]/60 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-8 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Sparkles size={16} className="animate-pulse" /> Enterprise AI Image Pipeline
                </motion.div>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.15] text-white drop-shadow-2xl">
                Studio-Grade Photography. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  Zero Equipment.
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 font-medium leading-relaxed drop-shadow-lg">
                Transform raw phone pictures into breathtaking 8K commercial assets in seconds. The ultimate AI-powered workspace for modern brands and creators.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5">
                {isSignedIn ? (
                  <Link href="/dashboard">
                    <Button className="h-14 px-8 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-lg font-bold rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-[0.98] flex items-center gap-2">
                      Enter Workspace <ChevronRight size={20} />
                    </Button>
                  </Link>
                ) : (
                  <SignInButton forceRedirectUrl="/dashboard" mode="modal">
                    <Button className="h-14 px-8 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-lg font-bold rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-[0.98] flex items-center gap-2">
                      Get Started for Free <ChevronRight size={20} />
                    </Button>
                  </SignInButton>
                )}
              </motion.div>
          </motion.div>
        </main>

        {/* Features Section */}
        <section id="features" className="py-24 bg-black/40 border-t border-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} whileHover={{ y: -12, scale: 1.03 }} className="p-8 bg-[#0a0f24]/40 border border-white/10 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] group cursor-pointer">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors duration-500"><Camera className="text-emerald-400" size={28} /></div>
                    <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Virtual Studio Context</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Place your product in completely photorealistic environments without leaving your desk.</p>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -12, scale: 1.03 }} className="p-8 bg-[#0a0f24]/40 border border-white/10 hover:border-emerald-500/50 rounded-3xl transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] group cursor-pointer">
                    <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors duration-500"><Zap className="text-teal-400" size={28} /></div>
                    <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Lightning Fast Pipeline</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">Skip the photoshoot. Generate 8K high-resolution commercial assets in under 10 seconds.</p>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} whileHover={{ y: -12, scale: 1.03 }} className="p-8 bg-[#0a0f24]/40 border border-white/10 hover:border-cyan-500/50 rounded-3xl transition-all duration-500 shadow-lg hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] group cursor-pointer">
                    <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors duration-500"><ShieldCheck className="text-cyan-400" size={28} /></div>
                    <h3 className="text-xl font-bold mb-3 text-white tracking-tight">Commercial Rights</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">You own everything you generate. Use your assets freely in ads, social media, and storefronts.</p>
                </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}