"use client";

import React, { useState, useEffect } from 'react';
import {
    Search as SearchIcon,
    ArrowRight,
    Bus,
    Calendar,
    MapPin,
    Users,
    ShieldCheck,
    Wind,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PublicSearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || '',
        fromDate: searchParams.get('fromDate') || '',
        toDate: searchParams.get('toDate') || '',
        tripType: 'AC'
    });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
            const typeParam = filters.tripType.toUpperCase() === 'AC' ? 'AC' : 'NON-AC';
            const url = new URL(`${baseUrl}/api/public/search`);
            url.searchParams.set('fromDate', filters.fromDate || new Date().toISOString().split('T')[0]);
            url.searchParams.set('toDate', filters.toDate || filters.fromDate || new Date().toISOString().split('T')[0]);
            if (filters.from) url.searchParams.set('city', filters.from);
            url.searchParams.set('type', typeParam);

            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filters.fromDate) handleSearch();
    }, []);

    return (
        <div className="min-h-screen bg-bg-deep pb-24">
            {/* Header / Search Refinement */}
            <div className="bg-bg-card/50 border-b border-white/5 pt-12 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-2">Leaving From</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                    <input
                                        value={filters.from}
                                        onChange={e => setFilters({ ...filters, from: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-sm focus:border-brand-gold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-2">Going To</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                    <input
                                        value={filters.to}
                                        onChange={e => setFilters({ ...filters, to: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-sm focus:border-brand-gold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-2">Departure</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                    <input
                                        type="date"
                                        value={filters.fromDate}
                                        onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-sm focus:border-brand-gold outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-text-muted ml-2">Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFilters({ ...filters, tripType: 'AC' })}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.tripType === 'AC' ? 'bg-brand-gold text-bg-deep shadow-lg' : 'bg-white/5 text-text-muted'}`}
                                    >
                                        AC
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, tripType: 'Classic' })}
                                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.tripType === 'Classic' ? 'bg-brand-gold text-bg-deep shadow-lg' : 'bg-white/5 text-text-muted'}`}
                                    >
                                        Classic
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl border border-white/10 text-brand-gold transition-all"
                        >
                            <SearchIcon size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-3xl font-serif font-bold">Available Vehicles</h2>
                        <p className="text-text-muted text-sm mt-1">Based on Partner Fleet data for your selected dates.</p>
                    </div>
                    <div className="flex gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
                        <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-gold" /> GPS Enabled</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-gold" /> Sanitized</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <Loader2 className="animate-spin text-brand-gold mb-4" size={48} />
                        <p className="text-text-muted font-serif italic text-lg tracking-widest">Searching Heritage Fleet...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {results.map((bus) => (
                            <div key={bus.id} className="group glass rounded-[2.5rem] overflow-hidden border-white/5 hover:border-brand-gold/30 transition-all flex flex-col h-full shadow-2xl">
                                <div className="h-56 bg-white/5 relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-transparent to-transparent opacity-60" />
                                    <Bus size={80} className="text-brand-gold opacity-20 group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                                        <span className="px-3 py-1 rounded-full bg-brand-gold text-bg-deep text-[10px] font-black uppercase tracking-widest shadow-lg">
                                            {filters.tripType} Heritage
                                        </span>
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-brand-gold bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-brand-gold/20">
                                        <ShieldCheck size={14} />
                                        <span className="text-[10px] font-black uppercase">Verified</span>
                                    </div>
                                </div>

                                <div className="p-8 flex-grow space-y-6">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-serif font-black">{bus.name}</h3>
                                            <span className="text-[10px] font-black text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20 uppercase tracking-tighter">
                                                {bus.vehicleNumber}
                                            </span>
                                        </div>
                                        <p className="text-brand-gold text-[10px] font-black uppercase tracking-[0.2em] mb-4">Provided by: {bus.companyName}</p>
                                        <div className="flex items-center gap-4 text-text-muted">
                                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tighter">
                                                <Users size={14} className="text-brand-gold" /> {bus.capacity}+ Capacity
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tighter">
                                                <Wind size={14} className="text-brand-gold" /> Full Comfort
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1">Starting Rate</p>
                                            <p className="text-2xl font-black text-brand-gold font-serif">₹{bus.baseRate.toLocaleString()}<span className="text-xs text-text-muted font-normal ml-1">/day</span></p>
                                        </div>
                                        <Link
                                            href={`/search/book/${bus.id}?from=${filters.from}&to=${filters.to}&fromDate=${filters.fromDate}&toDate=${filters.toDate || filters.fromDate}&type=${filters.tripType}`}
                                            className="px-6 py-3 rounded-2xl gold-bg-gradient text-bg-deep font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2"
                                        >
                                            Book Trip <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="glass p-20 rounded-[3rem] text-center max-w-2xl mx-auto border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-text-muted opacity-30">
                            <Bus size={40} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-4">No Vehicles Available</h3>
                        <p className="text-text-muted leading-relaxed mb-8">
                            All our heritage coaches are currently booked for the selected dates. Please try adding a bus to your fleet in the Partner Dashboard or use our test data to continue testing.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/dashboard"
                                className="px-8 py-3 rounded-xl gold-bg-gradient text-bg-deep text-sm font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                            >
                                Open Dashboard
                            </Link>
                            <button
                                onClick={() => window.location.href = '#contact'}
                                className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold text-brand-gold transition-all"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
