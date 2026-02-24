"use client";

import React, { useState } from 'react';
import { agreementsApi } from '@/lib/api/services';
import { useRouter } from 'next/navigation';
import {
    User,
    Phone,
    Calendar,
    MapPin,
    Bus,
    Users,
    IndianRupee,
    FileText,
    Save,
    Loader2,
    ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function NewBooking() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        fromDate: '',
        toDate: '',
        busType: 'AC',
        busCount: '1',
        passengers: '',
        placesToCover: '',
        perDayRent: '',
        includeMountainRent: false,
        mountainRent: '0',
        totalAmount: '',
        advancePaid: '0',
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Basic validation
            if (!formData.customerName || !formData.fromDate || !formData.toDate) {
                throw new Error('Please fill in all required fields (Name, Dates)');
            }

            // API call
            await agreementsApi.create(formData);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create booking.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <Link href="/dashboard" className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                <ChevronLeft size={16} /> Back to HQ
            </Link>

            <div className="flex justify-between items-end mb-12">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2">Registration</h4>
                    <h1 className="text-4xl font-serif font-bold">New Heritage Agreement</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold">
                        {error}
                    </div>
                )}

                {/* Customer Section */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                        <User className="text-brand-gold" size={20} />
                        <h3 className="font-serif font-bold text-lg">Customer Profiling</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-tactical">Customer Name *</label>
                            <input
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                placeholder="Ex: John Doe"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Contact Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 00000 00000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trip Section */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                        <Calendar className="text-brand-gold" size={20} />
                        <h3 className="font-serif font-bold text-lg">Journey Logistics</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-tactical">From Date *</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={formData.fromDate}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">To Date *</label>
                            <input
                                type="date"
                                name="toDate"
                                value={formData.toDate}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-tactical">Vehicle Class</label>
                            <select
                                name="busType"
                                value={formData.busType}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors appearance-none"
                            >
                                <option value="AC" className="bg-bg-deep">AC Heritage</option>
                                <option value="Non-AC" className="bg-bg-deep">Non-AC Classic</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Unit Count</label>
                            <input
                                type="number"
                                name="busCount"
                                value={formData.busCount}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Passengers</label>
                            <input
                                type="number"
                                name="passengers"
                                value={formData.passengers}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-tactical">Route / Places to Cover</label>
                        <textarea
                            name="placesToCover"
                            value={formData.placesToCover}
                            onChange={handleChange}
                            placeholder="Ex: Bangalore -> Mysore -> Ooty"
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                        />
                    </div>
                </div>

                {/* Financials Section */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                        <IndianRupee className="text-brand-gold" size={20} />
                        <h3 className="font-serif font-bold text-lg">Financial Agreement</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-tactical">Total Contract Amount</label>
                            <input
                                type="number"
                                name="totalAmount"
                                value={formData.totalAmount}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors font-bold text-brand-gold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Advance Paid</label>
                            <input
                                type="number"
                                name="advancePaid"
                                value={formData.advancePaid}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-tactical">Operational Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Any special requests or driver instructions"
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-brand-gold transition-colors"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pb-12">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-4 rounded-xl border border-white/10 text-text-muted hover:text-text-luxury transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-12 py-4 gold-bg-gradient rounded-xl text-bg-deep font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Authorize Booking</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
