"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    User,
    Phone,
    Calendar,
    MapPin,
    Bus,
    IndianRupee,
    ShieldCheck,
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Download
} from 'lucide-react';
import Link from 'next/link';
import { generateAndDownloadPdf } from '@/lib/pdfGenerator';
import { AgreementResponse } from '@/types/api';

export default function PublicBookingPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [paymentStep, setPaymentStep] = useState(false);
    const [success, setSuccess] = useState(false);
    const [agreementId, setAgreementId] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        fromDate: searchParams.get('fromDate') || '',
        toDate: searchParams.get('toDate') || '',
        busType: searchParams.get('type') || 'AC',
        passengers: '1',
        placesToCover: `${searchParams.get('from') || ''} to ${searchParams.get('to') || ''}`,

        // Detailed fields requested
        perDayRent: '5000',
        driverCharges: '500',
        toll: '0',
        fastTag: '0',
        otherCharges: '0',
        paymentType: 'Online',
        totalAmount: '0'
    });

    // Load Bus Data
    useEffect(() => {
        const fetchBus = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
                const res = await fetch(`${baseUrl}/api/public/bus/${params.busId}`);
                if (res.ok) {
                    const bus = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        perDayRent: bus.baseRate.toString(),
                        busType: bus.busType || prev.busType
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch bus details", err);
            }
        };
        if (params.busId) fetchBus();
    }, [params.busId]);

    // Simple calculation logic
    useEffect(() => {
        const start = new Date(formData.fromDate);
        const end = new Date(formData.toDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

        const total = (Number(formData.perDayRent) * days) +
            Number(formData.driverCharges) +
            Number(formData.toll) +
            Number(formData.fastTag) +
            Number(formData.otherCharges);
        setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
    }, [formData.fromDate, formData.toDate, formData.perDayRent, formData.driverCharges, formData.toll, formData.fastTag, formData.otherCharges]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPaymentStep(true);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                busId: params.busId,
                perDayRent: parseFloat(formData.perDayRent),
                mountainRent: parseFloat(formData.driverCharges) + parseFloat(formData.toll) + parseFloat(formData.fastTag) + parseFloat(formData.otherCharges),
                notes: `Public Booking: Driver(${formData.driverCharges}), Toll(${formData.toll}), FastTag(${formData.fastTag}), Other(${formData.otherCharges})`,
                totalAmount: parseFloat(formData.totalAmount)
            };

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
            const res = await fetch(`${baseUrl}/api/public/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setAgreementId(data.agreementId);
                setSuccess(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = async () => {
        if (!agreementId) return;
        setDownloading(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5115';
            const res = await fetch(`${baseUrl}/api/public/agreement/${agreementId}`);
            if (res.ok) {
                const data: AgreementResponse = await res.json();
                await generateAndDownloadPdf(data, {
                    companyName: 'Sri Sai Senthil Travels',
                    address: 'Heritage Division, Madurai, Tamil Nadu',
                    phone: '+91 98421 12345'
                });
            }
        } catch (err) {
            console.error("PDF Download failed", err);
            alert("Failed to generate receipt. Please contact support.");
        } finally {
            setDownloading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-xl mx-auto px-6 py-24 text-center">
                <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-5xl font-serif font-black mb-4 gold-text-gradient">Journey Secured!</h1>
                <p className="text-text-muted mb-4">Your heritage reservation with Sri Sai Senthil Travels is confirmed.</p>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 text-left backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-brand-gold/10 transition-colors" />
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1">Booking Reference</span>
                            <span className="text-xl text-white font-serif font-bold tracking-widest">{agreementId?.split('-')[0].toUpperCase()}</span>
                        </div>
                        <ShieldCheck className="text-brand-gold" size={32} />
                    </div>
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={downloading}
                        className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95"
                    >
                        {downloading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Download size={20} className="text-brand-gold" />
                                Get Official Receipt
                            </>
                        )}
                    </button>
                    <p className="text-[9px] text-text-muted mt-4 text-center uppercase tracking-widest font-bold">PDF Agreement safe to download</p>
                </div>

                <Link href="/" className="px-12 py-5 gold-bg-gradient rounded-2xl text-bg-deep font-black uppercase tracking-[0.2em] shadow-2xl inline-block hover:scale-105 transition-all text-xs">
                    Back to Heritage Home
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <header className="mb-12">
                <button onClick={() => router.back()} className="text-brand-gold flex items-center gap-2 mb-6 hover:translate-x-[-4px] transition-transform font-bold text-xs uppercase tracking-widest">
                    <ChevronLeft size={16} /> Back to Selection
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-tactical text-brand-gold mb-2 block uppercase tracking-[0.4em]">Reservation</span>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold">Finalize Your Journey</h1>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <div className="glass px-4 py-2 rounded-xl border-white/5 flex items-center gap-2 text-xs">
                            <ShieldCheck size={14} className="text-brand-gold" /> Secure Checkout
                        </div>
                    </div>
                </div>
            </header>

            {!paymentStep ? (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Customer Information */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/5">
                            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                                <User className="text-brand-gold" size={20} />
                                <h3 className="font-serif font-bold text-xl uppercase tracking-widest">Passenger Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Full Name</label>
                                    <input required placeholder="Enter your name" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Contact Phone</label>
                                    <input required placeholder="+91 00000 00000" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Trip Specs */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/5">
                            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                                <Calendar className="text-brand-gold" size={20} />
                                <h3 className="font-serif font-bold text-xl uppercase tracking-widest">Trip Logistics</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Travel From</label>
                                    <input readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm opacity-50 outline-none" value={formData.fromDate} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Travel To</label>
                                    <input readOnly className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm opacity-50 outline-none" value={formData.toDate} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Destinations / Route</label>
                                <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" rows={3} value={formData.placesToCover} onChange={e => setFormData({ ...formData, placesToCover: e.target.value })} />
                            </div>
                        </div>

                        {/* Charges (As requested in point 5) */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/5">
                            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                                <IndianRupee className="text-brand-gold" size={20} />
                                <h3 className="font-serif font-bold text-xl uppercase tracking-widest">Rate & Charges</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Per Day Rent</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.perDayRent} onChange={e => setFormData({ ...formData, perDayRent: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Driver Charges</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.driverCharges} onChange={e => setFormData({ ...formData, driverCharges: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Toll Charges</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.toll} onChange={e => setFormData({ ...formData, toll: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">FastTag</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.fastTag} onChange={e => setFormData({ ...formData, fastTag: e.target.value })} />
                                </div>
                                <div className="space-y-2 text-white">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Other Charges</label>
                                    <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none" value={formData.otherCharges} onChange={e => setFormData({ ...formData, otherCharges: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Payment Method</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-brand-gold outline-none appearance-none" value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })}>
                                        <option value="Online">Online Payment</option>
                                        <option value="UPI">UPI Transfer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="glass p-10 rounded-[3rem] border-brand-gold/20 shadow-2xl sticky top-32">
                            <h4 className="text-xl font-serif font-black mb-8 border-b border-white/5 pb-4">Fare Summary</h4>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Base Fare (x1)</span>
                                    <span className="text-white font-bold">₹{formData.perDayRent}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Driver Support</span>
                                    <span className="text-white font-bold">₹{formData.driverCharges}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Tolls & FastTag</span>
                                    <span className="text-white font-bold">₹{Number(formData.toll) + Number(formData.fastTag)}</span>
                                </div>
                                {Number(formData.otherCharges) > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-text-muted">Other Extras</span>
                                        <span className="text-white font-bold">₹{formData.otherCharges}</span>
                                    </div>
                                )}
                            </div>
                            <div className="pt-6 border-t border-brand-gold/20 mb-10">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-widest text-brand-gold">Total Amount</span>
                                    <span className="text-4xl font-serif font-black text-brand-gold">₹{Number(formData.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 gold-bg-gradient rounded-[1.5rem] text-bg-deep font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
                                Proceed to Payment <ArrowRight size={18} />
                            </button>
                            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-text-muted uppercase tracking-[0.2em]">
                                <ShieldCheck size={14} className="text-brand-gold" /> SSL Encrypted Booking
                            </div>
                        </div>
                    </aside>
                </form>
            ) : (
                <div className="max-w-xl mx-auto glass p-12 rounded-[4rem] text-center space-y-10">
                    <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto">
                        <CreditCard size={40} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold mb-4">Secure Payment</h2>
                        <p className="text-text-muted">Please complete the payment of ₹{formData.totalAmount} to block your heritage vehicle.</p>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-text-muted font-bold">JOURNEY</span>
                            <span className="text-white">{formData.placesToCover.split(' to ')[0]} ➔ {formData.placesToCover.split(' to ')[1]}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-muted font-bold">DATES</span>
                            <span className="text-white">{formData.fromDate} - {formData.toDate}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-6 gold-bg-gradient rounded-[2rem] text-bg-deep font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all text-xs"
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={20} /> Verifying...</>
                        ) : (
                            <><ShieldCheck size={20} /> Secure & Pay ₹{Number(formData.totalAmount).toLocaleString()}</>
                        )}
                    </button>

                    <button onClick={() => setPaymentStep(false)} className="text-xs text-text-muted underline hover:text-white transition-colors">
                        Go Back
                    </button>
                </div>
            )}
        </div>
    );
}
