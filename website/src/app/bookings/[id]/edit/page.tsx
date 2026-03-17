"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agreementsApi } from '@/lib/api/services';
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
    ChevronLeft,
    Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function EditBooking() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    const loadBooking = useCallback(async () => {
        setLoading(true);
        try {
            const data = await agreementsApi.getById(id);
            setFormData({
                customerName: data.customerName || '',
                phone: data.phone || '',
                fromDate: data.fromDate || '',
                toDate: data.toDate || '',
                busType: data.busType || 'AC',
                busCount: String(data.busCount || '1'),
                passengers: String(data.passengers || ''),
                placesToCover: data.placesToCover || '',
                perDayRent: String(data.perDayRent || ''),
                includeMountainRent: data.includeMountainRent || false,
                mountainRent: String(data.mountainRent || '0'),
                totalAmount: String(data.totalAmount || ''),
                advancePaid: String(data.advancePaid || '0'),
                notes: data.notes || '',
            });
        } catch (err: any) {
            setError('Failed to load booking details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadBooking();
    }, [loadBooking]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (!formData.customerName || !formData.fromDate || !formData.toDate) {
                throw new Error('Please fill in all required fields (Name, Dates)');
            }

            await agreementsApi.update(id, formData);
            router.push(`/bookings/${id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to update booking.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelTour = async () => {
        if (!confirm('Are you sure you want to cancel this tour? This cannot be undone.')) return;

        try {
            await agreementsApi.cancel(id);
            alert('Tour cancelled successfully.');
            router.push('/dashboard');
        } catch (err: any) {
            alert('Failed to cancel tour.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <Link href={`/bookings/${id}`} className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                <ChevronLeft size={16} /> Back to Booking
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Modification</h4>
                    <h1 className="text-4xl font-serif font-bold">Edit Heritage Agreement</h1>
                    <p className="text-text-muted mt-2">Ref: {id.slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                    onClick={handleCancelTour}
                    className="px-6 py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm font-bold"
                >
                    <Trash2 size={18} /> Cancel Tour
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold">
                        {error}
                    </div>
                )}

                {/* Same form structure as NewBooking */}
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
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-12 py-4 gold-bg-gradient rounded-xl text-bg-deep font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Update Authorization</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
