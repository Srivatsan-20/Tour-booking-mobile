"use client";

import React, { useState } from 'react';
import { Search, MapPin, ArrowRight, ShieldCheck, Bus, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublicTrackPage() {
    const [trackId, setTrackId] = useState('');
    const router = useRouter();

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = trackId.trim();
        if (trimmed) {
            router.push(`/track/${trimmed}`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-20 min-h-[75vh] flex items-center justify-center">
            <div className="glass p-8 md:p-14 rounded-[3rem] max-w-2xl w-full text-center border-white/10 shadow-3xl">
                <div className="w-20 h-20 gold-bg-gradient rounded-3xl mx-auto mb-8 flex items-center justify-center text-bg-deep shadow-[0_0_30px_rgba(197,160,89,0.3)]">
                    <MapPin size={38} />
                </div>

                <span className="text-tactical text-brand-gold mb-3 block uppercase tracking-[0.3em]">Live Fleet Telemetry</span>
                <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-4">Track Your Journey</h1>
                <p className="text-text-muted text-base mb-10 leading-relaxed max-w-lg mx-auto font-light">
                    Enter your booking reference code or agreement ID from your confirmation receipt to view real-time journey telemetry and route checkpoints.
                </p>

                <form onSubmit={handleTrack} className="relative max-w-md mx-auto mb-10">
                    <input
                        type="text"
                        placeholder="e.g. 550e8400 or booking ID"
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-32 text-base text-white focus:outline-none focus:border-brand-gold transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 gold-bg-gradient px-6 rounded-xl text-bg-deep font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Track <ArrowRight size={16} />
                    </button>
                </form>

                <div className="pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="text-brand-gold mb-2"><ShieldCheck size={20} /></div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-white">Encrypted Transit</h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Secure end-to-end telemetry for passenger safety.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="text-brand-gold mb-2"><Bus size={20} /></div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-white">Assigned Coach</h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Direct vehicle specifications and seat layout verification.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="text-brand-gold mb-2"><Clock size={20} /></div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-white">Live ETAs</h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">Real-time arrival projections across journey checkpoints.</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/customer/dashboard" className="text-xs text-brand-gold hover:underline font-bold">
                        Logged in as customer? View all your bookings in Customer Dashboard →
                    </Link>
                </div>
            </div>
        </div>
    );
}

