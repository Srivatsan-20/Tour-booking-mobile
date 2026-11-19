"use client";

import React, { useState, useEffect } from 'react';
import { useCustomerAuth, getCustomerHeaders } from '@/context/CustomerAuthContext';
import { useRouter } from 'next/navigation';
import {
    Bus, MapPin, Calendar, Clock, ChevronRight,
    Download, FileText, CheckCircle2, History,
    LogOut, User as UserIcon, Loader2, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboardPage() {
    const { customer, logout, isLoading: authLoading } = useCustomerAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !customer) {
            router.push('/customer/login');
        }
    }, [customer, authLoading, router]);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!customer) return;
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${baseUrl}/api/customer/my-bookings`, {
                    headers: getCustomerHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data);
                } else {
                    setError('Failed to load bookings');
                }
            } catch (err) {
                setError('An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (customer) fetchBookings();
    }, [customer]);

    if (authLoading || (loading && !error)) {
        return (
            <div className="min-h-screen bg-bg-deep flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep pb-24">
            {/* Header */}
            <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/30">
                            <Bus className="text-brand-gold" size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-serif font-bold text-white uppercase tracking-wider">My Dashboard</h1>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Shreesaisenthil Travels</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold text-white">{customer?.name}</span>
                            <span className="text-[10px] text-text-muted font-black uppercase">{customer?.phone}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2.5 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-text-muted hover:text-red-400 transition-all"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats / Welcome */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass p-6 rounded-[2rem] border-white/5 bg-brand-gold/5 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20">
                            <Bus size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-muted mb-1">Active Bookings</p>
                            <p className="text-3xl font-black text-white">{bookings.filter(b => !b.isCompleted).length}</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] border-white/5 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted border border-white/10">
                            <History size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-muted mb-1">Total Trips</p>
                            <p className="text-3xl font-black text-white">{bookings.length}</p>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-[2rem] border-white/5 flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-text-muted border border-white/10">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-text-muted mb-1">Status</p>
                            <p className="text-xl font-bold text-brand-gold">Premium Member</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <History className="text-brand-gold" size={24} />
                        Booking History
                    </h2>
                </div>

                {bookings.length === 0 ? (
                    <div className="glass p-20 rounded-[3rem] text-center border-white/5">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-text-muted opacity-30">
                            <Bus size={40} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-4">No Bookings Yet</h3>
                        <p className="text-text-muted mb-8">You haven't made any bookings yet. Start your journey today!</p>
                        <Link href="/search" className="inline-flex items-center gap-2 px-8 py-4 gold-bg-gradient rounded-2xl text-bg-deep font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            Search Buses <ArrowRight size={18} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="glass rounded-[2rem] overflow-hidden border-white/5 hover:border-brand-gold/20 transition-all group">
                                <div className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.isCompleted
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                                                }`}>
                                                {booking.isCompleted ? 'Completed' : 'Running'}
                                            </span>
                                            <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                                                ID: {booking.id.slice(0, 8)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Travel Dates</p>
                                                    <p className="font-bold text-white">{booking.fromDate} - {booking.toDate}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Route</p>
                                                    <p className="font-bold text-white truncate max-w-[200px]">{booking.placesToCover || 'Point to Point'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                                    <Bus size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Vehicle</p>
                                                    <p className="font-bold text-white">{booking.vehicleNumber} ({booking.busType})</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                        <div className="sm:text-right mr-4">
                                            <p className="text-[10px] font-black uppercase text-text-muted mb-0.5">Paid Amount</p>
                                            <p className="text-2xl font-black text-brand-gold">₹{(booking.advancePaid || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => router.push(`/customer/bookings/${booking.id}`)}
                                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                            >
                                                <FileText size={16} /> View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
