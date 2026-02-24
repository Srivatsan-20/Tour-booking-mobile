"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { accountsApi, agreementsApi } from '@/lib/api/services';
import { AccountsSummaryItem, AgreementResponse } from '@/types/api';
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    Calendar as CalendarIcon,
    ChevronRight,
    RefreshCw,
    Search,
    Filter,
    DollarSign,
    Bus as BusIcon
} from 'lucide-react';
import Link from 'next/link';

export default function AccountsSummaryPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<AccountsSummaryItem[]>([]);
    const [filter, setFilter] = useState('All');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [summary, allAgreements] = await Promise.all([
                accountsApi.getSummary(),
                agreementsApi.list({ includeCancelled: true })
            ]);

            // Create a map for quick lookup
            const agreementMap = new Map<string, AgreementResponse>(allAgreements.map((a: AgreementResponse) => [a.id, a]));

            // Merge balance into summary items
            const merged = summary.map((item: AccountsSummaryItem) => ({
                ...item,
                balance: agreementMap.get(item.agreementId)?.balance || 0
            }));

            setItems(merged);
        } catch (error) {
            console.error('Failed to load accounts summary:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredItems = items.filter(item => {
        if (filter === 'Profit' && item.profitOrLoss <= 0) return false;
        if (filter === 'Loss' && item.profitOrLoss > 0) return false;
        return true;
    });

    const totalRevenue = items.reduce((sum, item) => sum + item.incomeTotalAmount, 0);
    const totalExpenses = items.reduce((sum, item) => sum + (item.incomeTotalAmount - item.profitOrLoss), 0);
    const totalProfit = items.reduce((sum, item) => sum + item.profitOrLoss, 0);
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Financial Oversight</h4>
                    <h1 className="text-4xl font-serif font-bold">Accounts Ledger</h1>
                    <p className="text-text-muted mt-2">Comprehensive tracking of tour-wise financial performance.</p>
                </div>

                <div className="flex gap-4 flex-wrap">
                    <div className="glass p-6 rounded-2xl flex items-center gap-4 border-white/5 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase">Gross Revenue</p>
                            <p className="text-xl font-bold text-green-400">₹{totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-2xl flex items-center gap-4 border-white/5 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase">Outstanding</p>
                            <p className="text-xl font-bold text-amber-400">₹{items.reduce((sum, item) => sum + (item.balance || 0), 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-2xl flex items-center gap-4 border-white/5 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                            <TrendingDown size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase">Total Expenses</p>
                            <p className="text-xl font-bold text-red-400">₹{totalExpenses.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-2xl flex items-center gap-4 border-white/5 min-w-[200px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalProfit >= 0 ? 'bg-brand-gold/10 text-brand-gold' : 'bg-red-500/10 text-red-500'}`}>
                            {totalProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase">Net {totalProfit >= 0 ? 'Profit' : 'Loss'}</p>
                            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-brand-gold' : 'text-red-500'}`}>₹{Math.abs(totalProfit).toLocaleString()}</p>
                            <p className="text-[8px] text-text-muted mt-0.5">Margin: {overallMargin.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <aside className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-tactical border-b border-white/10 pb-4 mb-6">Performance Filter</h3>
                        <div className="space-y-3">
                            {['All', 'Profit', 'Loss'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${filter === type ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30' : 'text-text-muted hover:bg-white/5'}`}
                                >
                                    {type} Ledger
                                    <ChevronRight size={14} className={filter === type ? 'opacity-100' : 'opacity-0'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-tactical border-b border-white/10 pb-4 mb-4">Tactical Search</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                            <input
                                placeholder="Ref ID or Customer..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:border-brand-gold outline-none"
                            />
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3 space-y-4">
                    {filteredItems.map((item) => {
                        const isProfit = item.profitOrLoss >= 0;
                        return (
                            <Link
                                href={`/accounts/${item.agreementId}`}
                                key={item.agreementId}
                                className="flex items-center justify-between p-6 glass rounded-[2.5rem] border-white/5 hover:border-brand-gold/20 transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isProfit ? 'bg-brand-gold/10 text-brand-gold' : 'bg-red-500/10 text-red-500'}`}>
                                        {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold group-hover:text-brand-gold transition-colors">{item.customerName}</h4>
                                        <div className="flex items-center gap-4 text-[10px] text-text-muted uppercase mt-1">
                                            <span className="flex items-center gap-1"><CalendarIcon size={12} /> {item.fromDate} - {item.toDate}</span>
                                            <span className="flex items-center gap-1 font-bold"><BusIcon size={12} /> {item.busType}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-text-muted uppercase mb-1">Total Turnover</p>
                                        <p className="font-bold">₹{item.incomeTotalAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right min-w-[120px]">
                                        <p className="text-[10px] text-text-muted uppercase mb-1">Net {isProfit ? 'Profit' : 'Loss'}</p>
                                        <p className={`text-lg font-bold font-serif ${isProfit ? 'text-green-400' : 'text-red-500'}`}>
                                            {isProfit ? '+' : ''}{item.profitOrLoss.toLocaleString()}
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-text-muted group-hover:text-brand-gold" />
                                </div>
                            </Link>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="p-24 text-center opacity-50">
                            <Filter size={48} className="mx-auto text-text-muted mb-4" />
                            <p className="text-text-muted">No financial records match the selected audit criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
