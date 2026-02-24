"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Bus, Banknote, Loader2, RefreshCw, Plus } from 'lucide-react';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function parseDdMmYyyy(value: string): Date | null {
    const parts = value.split('/').map((p) => p.trim());
    if (parts.length !== 3) return null;
    const [ddRaw, mmRaw, yyyyRaw] = parts;
    const dd = Number.parseInt(ddRaw ?? '', 10);
    const mm = Number.parseInt(mmRaw ?? '', 10);
    const yyyy = Number.parseInt(yyyyRaw ?? '', 10);
    if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900) return null;

    const d = new Date(yyyy, mm - 1, dd);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

export default function BookingsPage() {
    const router = useRouter();
    const [items, setItems] = useState<AgreementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const all = await agreementsApi.list({ includeCancelled: false });
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = all
                .filter((a) => {
                    const to = parseDdMmYyyy(a.toDate);
                    return !!to && to.getTime() >= today.getTime();
                })
                .sort((a, b) => {
                    const aFrom = parseDdMmYyyy(a.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
                    const bFrom = parseDdMmYyyy(b.fromDate)?.getTime() ?? Number.POSITIVE_INFINITY;
                    return aFrom - bFrom;
                });

            setItems(upcoming);
        } catch (e: any) {
            setError(e?.message ? String(e.message) : String(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-serif font-bold">Active Bookings</h1>
                        <p className="text-text-muted text-sm mt-1">{items.length} upcoming tours</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={load}
                            disabled={loading}
                            className="glass px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:border-brand-gold/30 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <Link
                            href="/bookings/new"
                            className="gold-bg-gradient px-6 py-2 rounded-xl text-bg-deep font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Plus size={16} /> New Booking
                        </Link>
                    </div>
                </header>

                {error && items.length === 0 && (
                    <div className="glass p-8 rounded-2xl text-center">
                        <p className="text-red-400 mb-4">Failed to load bookings</p>
                        <p className="text-text-muted text-sm mb-6">{error}</p>
                        <button onClick={load} className="gold-bg-gradient px-6 py-2 rounded-xl text-bg-deep font-bold text-sm">
                            Retry
                        </button>
                    </div>
                )}

                {!loading && items.length === 0 && !error && (
                    <div className="glass p-12 rounded-2xl text-center">
                        <Calendar className="mx-auto mb-4 text-text-muted" size={48} />
                        <p className="text-text-muted">No active bookings found</p>
                        <Link href="/bookings/new" className="inline-block mt-6 gold-bg-gradient px-6 py-2 rounded-xl text-bg-deep font-bold text-sm">
                            Create First Booking
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => router.push(`/bookings/${item.id}`)}
                            className="glass p-6 rounded-2xl hover:border-brand-gold/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg mb-1 group-hover:text-brand-gold transition-colors">
                                        {item.customerName}
                                    </h3>
                                    <p className="text-text-muted text-xs">{item.phone}</p>
                                </div>
                                <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/30">
                                    Active
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Calendar size={14} />
                                    <span>{item.fromDate} → {item.toDate}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Bus size={14} />
                                    <span>{item.busType}</span>
                                </div>
                                {item.totalAmount != null && (
                                    <div className="flex items-center gap-2 text-sm text-brand-gold font-bold">
                                        <Banknote size={14} />
                                        <span>₹{item.totalAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs text-text-muted line-clamp-2">{item.placesToCover || 'No destinations specified'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
