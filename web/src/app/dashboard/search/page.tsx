"use client";

import React, { useEffect, useState } from 'react';
import { Filter, Search as SearchIcon, Users, Wind, ChevronRight, Loader2 } from 'lucide-react';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import Link from 'next/link';

export default function SearchPage() {
    const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Active');

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await agreementsApi.list({ includeCancelled: true });
                setAgreements(data);
            } catch (error) {
                console.error('Failed to fetch agreements:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredAgreements = agreements.filter(item => {
        if (filterType !== 'All' && item.busType !== filterType) return false;
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Active' && (item.isCancelled || item.isCompleted)) return false;
        if (statusFilter === 'Completed' && !item.isCompleted) return false;
        if (statusFilter === 'Cancelled' && !item.isCancelled) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2">Fleet Records</h4>
                    <h1 className="text-4xl font-serif font-bold">Current Agreements</h1>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="bg-white/5 border border-white/10 rounded-full py-2 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-gold transition-colors w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 glass px-6 py-2 rounded-full text-sm hover:border-brand-gold/50 transition-colors">
                        <Filter size={16} /> Filters
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-8">
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-tactical border-b border-white/10 pb-4 mb-6">Agreement Status</h3>
                        <div className="space-y-3">
                            {['All', 'Active', 'Completed', 'Cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all ${statusFilter === status ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30' : 'text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    {status}
                                    <ChevronRight size={14} className={statusFilter === status ? 'opacity-100' : 'opacity-0'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-tactical border-b border-white/10 pb-4 mb-6">Bus Category</h3>
                        <div className="space-y-3">
                            {['All', 'AC', 'Non-AC'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-all ${filterType === type ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30' : 'text-text-muted hover:bg-white/5'
                                        }`}
                                >
                                    {type}
                                    <ChevronRight size={14} className={filterType === type ? 'opacity-100' : 'opacity-0'} />
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    {filteredAgreements.length === 0 ? (
                        <div className="glass p-12 rounded-2xl text-center">
                            <p className="text-text-muted">No active agreements found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredAgreements.map((agreement) => (
                                <div key={agreement.id} className="glass rounded-2xl overflow-hidden group hover:border-brand-gold/40 transition-all flex flex-col h-full">
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-2xl font-serif font-bold text-text-luxury">{agreement.customerName}</h3>
                                            <span className="text-[10px] uppercase font-bold text-brand-gold border border-brand-gold/30 px-2 py-1 rounded">
                                                {agreement.busType}
                                            </span>
                                        </div>

                                        <p className="text-sm text-text-muted mb-6 line-clamp-2">
                                            {agreement.placesToCover || 'No route details specified.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex gap-3 items-center">
                                                <Users size={18} className="text-brand-gold" />
                                                <div className="text-xs">
                                                    <p className="text-text-muted uppercase tracking-tighter">Buses</p>
                                                    <p className="font-bold">{agreement.busCount || 1} Vehicle(s)</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <Wind size={18} className="text-brand-gold" />
                                                <div className="text-xs">
                                                    <p className="text-text-muted uppercase tracking-tighter">Status</p>
                                                    <p className="font-bold">{agreement.isCompleted ? 'Completed' : 'Upcoming'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-1">Total Agreement</p>
                                                <p className="text-2xl font-bold text-brand-gold font-serif">₹{agreement.totalAmount?.toLocaleString() || '0'}</p>
                                            </div>
                                            <Link
                                                href={`/track/${agreement.id}`}
                                                className="gold-bg-gradient px-6 py-3 rounded-xl text-bg-deep font-bold hover:shadow-[0_0_15px_rgba(197,160,89,0.3)] transition-all flex items-center gap-2"
                                            >
                                                Track <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
