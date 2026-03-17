"use client";

import React, { useState, useEffect } from 'react';
import { useCustomerAuth, getCustomerHeaders } from '@/context/CustomerAuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
    Bus, MapPin, Calendar, Receipt,
    Download, FileText, CheckCircle2, History,
    ArrowLeft, Loader2, CreditCard, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { generateAndDownloadPdf } from '@/lib/pdfGenerator';

export default function CustomerBookingDetailPage() {
    const { customer, isLoading: authLoading } = useCustomerAuth();
    const router = useRouter();
    const params = useParams();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !customer) {
            router.push('/customer/login');
        }
    }, [customer, authLoading, router]);

    useEffect(() => {
        const fetchBooking = async () => {
            if (!customer || !params.id) return;
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
                const res = await fetch(`${baseUrl}/api/customer/my-bookings/${params.id}`, {
                    headers: getCustomerHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    setBooking(data);
                } else {
                    setError('Booking not found');
                }
            } catch (err) {
                setError('An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (customer && params.id) fetchBooking();
    }, [customer, params.id]);

    const [downloading, setDownloading] = useState(false);

    const handleDownloadReceipt = async () => {
        if (!params.id) return;
        setDownloading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
            const res = await fetch(`${baseUrl}/api/customer/my-bookings/${params.id}/agreement-data`, {
                headers: getCustomerHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                await generateAndDownloadPdf(data, {
                    companyName: data.companyName || 'S3T Heritage Travels',
                    address: data.companyAddress || 'Madurai, Tamil Nadu',
                    phone: data.companyPhone || '',
                    type: 'receipt'
                });
            } else {
                alert("Failed to fetch receipt data");
            }
        } catch (err) {
            console.error("Download failed", err);
            alert("Error downloading receipt");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadAgreement = async () => {
        if (!params.id) return;
        setDownloading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
            const res = await fetch(`${baseUrl}/api/customer/my-bookings/${params.id}/agreement-data`, {
                headers: getCustomerHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                await generateAndDownloadPdf(data, {
                    companyName: data.companyName || 'S3T Heritage Travels',
                    address: data.companyAddress || 'Madurai, Tamil Nadu',
                    phone: data.companyPhone || ''
                });
            } else {
                alert("Failed to fetch agreement data");
            }
        } catch (err) {
            console.error("Download failed", err);
            alert("Error downloading document");
        } finally {
            setDownloading(false);
        }
    };

    if (authLoading || (loading && !error)) {
        return (
            <div className="min-h-screen bg-bg-deep flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center px-6">
                <div className="glass p-12 rounded-[2rem] text-center border-white/5 max-w-md w-full">
                    <History size={64} className="text-text-muted mx-auto mb-6 opacity-20" />
                    <h2 className="text-2xl font-serif font-bold text-white mb-4">{error || 'Booking Not Found'}</h2>
                    <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-brand-gold hover:underline font-bold">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep pb-24">
            {/* Header */}
            <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="text-text-muted hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-serif font-bold text-white uppercase tracking-wider">Booking Details</h1>
                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">ID: {booking.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-brand-gold/10 px-4 py-2 rounded-xl border border-brand-gold/20">
                        <CheckCircle2 size={16} className="text-brand-gold" />
                        <span className="text-[10px] font-black uppercase text-brand-gold">Confirmed</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Journey Details */}
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
                        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-3">
                            <MapPin className="text-brand-gold" size={20} />
                            Journey Details
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-white/5 text-brand-gold border border-white/10 shrink-0">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-muted mb-1">Departure & Return</p>
                                    <p className="text-base font-bold text-white">{booking.fromDate} to {booking.toDate}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-white/5 text-brand-gold border border-white/10 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-muted mb-1">Places to Cover</p>
                                    <p className="text-base font-bold text-white leading-relaxed">{booking.placesToCover || 'Direct Point-to-Point Journey'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-white/5 text-brand-gold border border-white/10 shrink-0">
                                    <Bus size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-muted mb-1">Vehicle Selected</p>
                                    <p className="text-base font-bold text-white">{booking.busName || 'Bus'} ({booking.vehicleNumber})</p>
                                    <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{booking.busType} Heritage Coach</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8 bg-brand-gold/5">
                        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-3">
                            <CreditCard className="text-brand-gold" size={20} />
                            Payment Summary
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Base Fare ({booking.days || 1} Days)</span>
                                <span className="font-bold text-white">₹{(booking.totalAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Advanced Paid</span>
                                <span className="font-bold text-green-400">₹{(booking.advancePaid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Remaining Balance</span>
                                <span className="font-bold text-white">₹{(booking.balance || 0).toLocaleString()}</span>
                            </div>

                            <div className="pt-8 text-center">
                                <p className="text-[10px] font-black uppercase text-text-muted mb-2 tracking-widest">Net Total Paid</p>
                                <p className="text-4xl font-black text-brand-gold font-serif">₹{(booking.advancePaid || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4">
                            <ShieldCheck className="text-brand-gold" size={24} />
                            <div>
                                <p className="text-xs font-bold text-white">Payment Verified</p>
                                <p className="text-[10px] text-text-muted uppercase">Digital Receipt Generated</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents / Actions */}
                <div className="glass p-10 rounded-[2.5rem] border-white/5 text-center space-y-8">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-2">Booking Documents</h3>
                        <p className="text-text-muted text-sm">Download your official agreement and payment receipts below.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleDownloadAgreement}
                            disabled={downloading}
                            className="flex-1 max-w-xs px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-gold/30 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all group disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="animate-spin" size={20} /> : <><FileText size={20} className="text-brand-gold group-hover:scale-110 transition-transform" /> Booking Agreement</>}
                        </button>
                        <button
                            onClick={handleDownloadReceipt}
                            disabled={downloading}
                            className="flex-1 max-w-xs px-8 py-4 rounded-2xl gold-bg-gradient text-bg-deep font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="animate-spin" size={20} /> : <><Download size={20} /> Payment Receipt</>}
                        </button>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-8 text-[10px] font-black uppercase text-text-muted tracking-widest">
                        <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-gold" /> GST Compliant</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-brand-gold" /> Digitally Signed</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
