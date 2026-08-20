import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => {
    return (
        <div className={`flex flex-col items-center gap-1 ${className}`}>
            <div className="relative group cursor-pointer">
                {/* Metallic Gold Glow */}
                <div className="absolute inset-0 bg-[#BF953F]/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Main Logo Container - Custom PNG Logo */}
                <div className="w-[145px] h-[82px] relative flex items-center justify-center">
                    <img 
                        src="/logo.png" 
                        alt="S3T Holidays" 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Tagline - Bright Metallic Font */}
            <div className="flex flex-col items-center">
                <span 
                    className="text-[10px] font-serif font-black uppercase tracking-[0.35em] leading-tight"
                    style={{ color: 'var(--logo-tagline)' }}
                >
                    Shree Sai Senthil Travels
                </span>
                <span 
                    className="text-[10px] font-sans font-black uppercase tracking-[0.4em] mt-1.5 opacity-90 font-bold"
                    style={{ color: 'var(--logo-subtag)', fontWeight: 900 }}
                >
                    Since 1963
                </span>
            </div>
        </div>
    );
};
