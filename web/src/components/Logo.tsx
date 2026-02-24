import React from 'react';

export const Logo = ({ className = "h-12" }: { className?: string }) => {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative group cursor-pointer">
                {/* Metallic Gold Glow */}
                <div className="absolute inset-0 bg-[#BF953F]/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Main Logo Container - Metallic reflective border */}
                <div className="relative bg-black border-[2px] border-[#BF953F] px-8 py-2.5 rounded-[100%] flex items-center justify-center min-w-[110px] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                    <span className="font-serif text-3xl font-black gold-gradient tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        S3T
                    </span>

                    {/* Reflective Sheen Effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-[100%] pointer-events-none">
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
                    </div>
                </div>
            </div>

            {/* Tagline - Bright Metallic Font */}
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-serif font-black text-[#FCF6BA] uppercase tracking-[0.35em] leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
                    Sri Sai Senthil Travels
                </span>
                <span className="text-[8px] font-sans font-black text-[#BF953F] uppercase tracking-[0.6em] mt-1 opacity-80">
                    Since 1982
                </span>
            </div>
        </div>
    );
};
