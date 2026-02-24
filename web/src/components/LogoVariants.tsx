import React from 'react';

// Concept 1: The Heritage Oval (Refined & Vibrant)
export const LogoHeritageOval = ({ className = "h-12" }) => (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
        <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-[#FFD700]/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative bg-black border-[2.5px] border-[#FFD700] px-10 py-3 rounded-[100%] flex items-center justify-center min-w-[140px] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(255,215,0,0.15)]">
                <span className="font-serif text-4xl font-black gold-gradient tracking-tighter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                    S3T
                </span>
                <div className="absolute inset-0 overflow-hidden rounded-[100%] pointer-events-none">
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                </div>
            </div>
        </div>
        <div className="text-center mt-2">
            <p className="text-[11px] font-serif font-black text-[#FFD700] uppercase tracking-[0.4em] leading-none drop-shadow-md">Sri Sai Senthil</p>
            <p className="text-[9px] font-sans font-black text-[#FFD700]/60 uppercase tracking-[0.6em] mt-1.5">Since 1982</p>
        </div>
    </div>
);

// Concept 2: The Modern Circular Minimalist (Vibrant)
export const LogoModernCircle = ({ className = "h-12" }) => (
    <div className={`flex items-center gap-6 ${className}`}>
        <div className="relative w-16 h-16 rounded-full border border-[#FFD700]/40 p-1.5 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.1)]">
            <div className="w-full h-full rounded-full border-[2.5px] border-[#FFD700] bg-black flex items-center justify-center shadow-lg relative overflow-hidden">
                <span className="text-2xl font-black gold-gradient drop-shadow-md">S3T</span>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FFD700]/5 to-transparent" />
            </div>
            <div className="absolute -bottom-1.5 bg-[#FFD700] px-2.5 py-0.5 rounded shadow-lg">
                <span className="text-[8px] font-black text-black uppercase tracking-widest">1982</span>
            </div>
        </div>
        <div className="flex flex-col">
            <h1 className="text-xl font-serif font-black text-white leading-none tracking-tight">SRI SAI SENTHIL</h1>
            <p className="text-[10px] font-sans font-black text-[#FFD700] uppercase tracking-[0.5em] mt-1.5">Travels & Heritage</p>
        </div>
    </div>
);

// Concept 3: The Royal Monogram Badge (Vibrant)
export const LogoRoyalBadge = ({ className = "h-12" }) => (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="relative group">
            <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                <defs>
                    <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="25%" stopColor="#FDB931" />
                        <stop offset="50%" stopColor="#8A6E2F" />
                        <stop offset="75%" stopColor="#FDB931" />
                        <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                </defs>
                <path d="M50 5 L92 25 L92 75 L50 95 L8 75 L8 25 Z" fill="black" stroke="url(#goldMetallic)" strokeWidth="3.5" />
                <path d="M50 14 L84 30 L84 70 L50 86 L16 70 L16 30 Z" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.3" />
                <text x="50" y="58" textAnchor="middle" className="text-3xl font-serif font-black" style={{ fontSize: '30px', fill: 'url(#goldMetallic)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' }}>S3T</text>
            </svg>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black border-[1.5px] border-[#FFD700] px-4 py-1 rounded shadow-xl">
                <span className="text-[9px] font-black text-[#FFD700] uppercase tracking-[0.4em]">Est. 1982</span>
            </div>
        </div>
    </div>
);

export const LogoVariants = () => (
    <div className="p-20 bg-bg-deep min-h-screen flex flex-col items-center gap-32 selection:bg-[#FFD700]/20">
        <div className="text-center space-y-4">
            <h2 className="text-5xl font-serif font-black text-white italic tracking-tight">Vibrant Gold Series</h2>
            <p className="text-text-muted text-lg font-light tracking-wide">Enhanced metallic definitions for a premium "Real Gold" appearance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-32 items-center max-w-7xl">
            <div className="flex flex-col items-center gap-12 group">
                <div className="bg-white/[0.02] p-16 rounded-[4rem] border border-white/5 group-hover:bg-white/[0.04] transition-all duration-500">
                    <LogoHeritageOval className="scale-125" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FFD700]/40">Direction 01</span>
            </div>

            <div className="flex flex-col items-center gap-12 group">
                <div className="bg-white/[0.02] p-16 rounded-[4rem] border border-white/5 group-hover:bg-white/[0.04] transition-all duration-500">
                    <LogoModernCircle className="scale-125" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FFD700]/40">Direction 02</span>
            </div>

            <div className="flex flex-col items-center gap-12 group">
                <div className="bg-white/[0.02] p-16 rounded-[4rem] border border-white/5 group-hover:bg-white/[0.04] transition-all duration-500">
                    <LogoRoyalBadge className="scale-125" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[#FFD700]/40">Direction 03</span>
            </div>
        </div>
    </div>
);
