"use client";

import React, { useState } from 'react';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TrackEntryPage() {
    const [trackId, setTrackId] = useState('');
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackId.trim()) {
            router.push(`/track/${trackId}`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-24 min-h-[70vh] flex items-center justify-center">
            <div className="glass p-12 rounded-[2.5rem] max-w-2xl w-full text-center animate-fade-in">
                <div className="w-20 h-20 gold-bg-gradient rounded-3xl mx-auto mb-8 flex items-center justify-center text-bg-deep shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                    <MapPin size={40} />
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Track Your Legacy</h1>
                <p className="text-text-muted text-lg mb-10 leading-relaxed">
                    Enter your unique journey reference ID to access real-time satellite tracking and arrival projections.
                </p>

                <form onSubmit={handleTrack} className="relative max-w-md mx-auto">
                    <input
                        type="text"
                        placeholder="e.g. TRK-2941"
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-32 text-lg focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 gold-bg-gradient px-6 rounded-xl text-bg-deep font-bold flex items-center gap-2 hover:brightness-110 transition-all"
                    >
                        Track <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="flex gap-4">
                        <div className="text-brand-gold pt-1"><Search size={20} /></div>
                        <div>
                            <h4 className="font-bold text-sm mb-1 uppercase tracking-widest text-text-luxury">Digital Sentinel</h4>
                            <p className="text-xs text-text-muted leading-relaxed">Encrypted end-to-end tracking for passenger privacy and corporate security.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-brand-gold pt-1"><MapPin size={20} /></div>
                        <div>
                            <h4 className="font-bold text-sm mb-1 uppercase tracking-widest text-text-luxury">Fleet Telemetry</h4>
                            <p className="text-xs text-text-muted leading-relaxed">Access visual map data, weather updates, and live altitude sensors.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
