"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Bus, Banknote, Loader2, RefreshCw, Filter } from 'lucide-react';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AllToursPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [items, setItems] = useState<AgreementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const load = async () => {
        if (!user || !mounted) return;
        setLoading(true);
        try {
            const all = await agreementsApi.list({ includeCancelled: false });
            setItems(all.sort((a, b) => {
                // Sort by fromDate descending
                return b.fromDate.localeCompare(a.fromDate);
            }));
        } catch (err) {
            console.error('Failed to load tours:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && mounted) {
            load();
        }
    }, [user, mounted]);

    const filteredItems = items.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'active') return !item.isCompleted;
        if (filter === 'completed') return item.isCompleted;
        return true;
    });

    if (loading) {
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
                        <h1 className="text-3xl font-serif font-bold">All Tours</h1>
                        <p className="text-text-muted text-sm mt-1">Complete tour history</p>
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
                    </div>
                </header>

                {/* Filters */}
                <div className="flex gap-3 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all'
                            ? 'gold-bg-gradient text-bg-deep'
                            : 'glass hover:border-brand-gold/30'
                            }`}
                    >
                        All ({items.length})
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'active'
                            ? 'gold-bg-gradient text-bg-deep'
                            : 'glass hover:border-brand-gold/30'
                            }`}
                    >
                        Active ({items.filter(i => !i.isCompleted).length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'completed'
                            ? 'gold-bg-gradient text-bg-deep'
                            : 'glass hover:border-brand-gold/30'
                            }`}
                    >
                        Completed ({items.filter(i => i.isCompleted).length})
                    </button>
                </div>

                {filteredItems.length === 0 && (
                    <div className="glass p-12 rounded-2xl text-center">
                        <Calendar className="mx-auto mb-4 text-text-muted" size={48} />
                        <p className="text-text-muted">No tours found</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
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
                                <span
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.isCompleted
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        }`}
                                >
                                    {item.isCompleted ? 'Completed' : 'Active'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm text-text-muted">
                                    <Calendar size={14} />
                                    <span>
                                        {item.fromDate} → {item.toDate}
                                    </span>
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
                                <p className="text-xs text-text-muted line-clamp-2">
                                    {item.placesToCover || 'No destinations specified'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
