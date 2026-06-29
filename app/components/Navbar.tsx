"use client";
import { useState } from "react";
import Link from "next/link";
import { UserButton, SignedIn } from "@clerk/nextjs";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="p-4 bg-neutral-950 border-b border-neutral-800 text-white relative z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        
        {/* Logo */}
        <Link href="/" className="font-black text-2xl text-yellow-500 tracking-wider">
          STUDIO.AI
        </Link>

        {/* Desktop Menu (Mobile par hide rahega) */}
        <div className="hidden md:flex items-center space-x-8 font-medium">
          <Link href="/generator" className="hover:text-yellow-500 transition-colors">Generator</Link>
          <Link href="/gallery" className="hover:text-yellow-500 transition-colors">Gallery</Link>
          <Link href="/upgrade" className="hover:text-yellow-500 transition-colors">Upgrade</Link>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Hamburger Button & Profile (Desktop par hide rahega) */}
        <div className="md:hidden flex items-center gap-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button 
            className="text-3xl text-yellow-500 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-neutral-900 border-b border-neutral-800 p-4 flex flex-col space-y-5 shadow-xl transition-all duration-300 ease-in-out">
          <Link href="/generator" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium hover:text-yellow-500 block">Generator</Link>
          <Link href="/gallery" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium hover:text-yellow-500 block">Gallery</Link>
          <Link href="/upgrade" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium hover:text-yellow-500 block">Upgrade</Link>
        </div>
      )}
    </nav>
  );
}