"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import {
    XCircle, Calendar, User, Search,
    ArrowRight, Loader2, RefreshCw, Filter,
    ChevronLeft, Ban, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CancelledToursPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<AgreementResponse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            // We fetch inclusive of cancelled and then filter here just to be safe, 
            // though the API might have a specific endpoint or parameter.
            const all = await agreementsApi.list({ includeCancelled: true });
            setItems(all.filter(a => a.isCancelled));
        } catch (err: any) {
            setError('Failed to retrieve archival data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        return items.filter(item =>
            item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <Link href="/dashboard" className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                <ChevronLeft size={16} /> Back to Operations
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-red-500 mb-2 uppercase tracking-widest">Archival Vault</h4>
                    <h1 className="text-4xl font-serif font-bold">Cancelled Engagements</h1>
                    <p className="text-text-muted mt-2">Historically voided tour agreements and fleet schedules.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-muted uppercase tracking-widest">Search Archive</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold/50" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Client Name / Ref ID"
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-gold outline-none w-64"
                            />
                        </div>
                    </div>
                    <button
                        onClick={loadData}
                        className="glass p-2.5 rounded-xl hover:text-brand-gold transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="glass border-red-500/20 p-6 rounded-2xl mb-12 flex items-center gap-4 text-red-400">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="glass rounded-3xl p-6 md:p-8 border-white/5 hover:border-red-500/20 transition-all group overflow-hidden relative"
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <Ban size={120} className="text-red-500" />
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                            <div className="flex items-start gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                    <XCircle size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold font-serif group-hover:text-red-400 transition-colors">
                                        {item.customerName}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} /> {item.fromDate} - {item.toDate}
                                        </span>
                                        <span>•</span>
                                        <span className="bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {item.busType} Heritage
                                        </span>
                                        <span>•</span>
                                        <span className="text-red-500/70 font-bold italic">
                                            VOIDED
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-text-muted mt-2">REF: {item.id.toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end justify-between gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Contract Value</p>
                                    <p className="text-xl font-bold text-white/40 line-through decoration-red-500/50">
                                        ₹{(item.totalAmount || 0).toLocaleString()}
                                    </p>
                                </div>

                                <Link
                                    href={`/bookings/${item.id}`}
                                    className="flex items-center gap-2 text-sm font-bold text-brand-gold hover:gap-3 transition-all"
                                >
                                    Review Archival Record <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && !loading && (
                    <div className="glass p-20 rounded-[3rem] text-center border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-text-muted/30">
                            <Ban size={40} />
                        </div>
                        <h2 className="text-2xl font-serif font-bold mb-2">Clean Archive</h2>
                        <p className="text-text-muted">No cancelled tour agreements found in the system.</p>
                        <button
                            onClick={loadData}
                            className="text-brand-gold text-sm font-bold mt-6 hover:underline"
                        >
                            Refresh Vault
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
