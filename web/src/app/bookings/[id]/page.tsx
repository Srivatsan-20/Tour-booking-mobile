"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    User, Calendar, MapPin, Calculator, CreditCard, Ban, Edit2, Wallet,
    PlusCircle, Loader2, ChevronLeft, FileText, Download
} from 'lucide-react';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { generateAndDownloadPdf } from '@/lib/pdfGenerator';
import AgreementPreview from '@/components/AgreementPreview';

function money(v: number | null | undefined): string {
    if (v == null) return '-';
    return `₹${v.toLocaleString()}`;
}

function yesNo(v: boolean | null | undefined): string {
    return v ? 'Yes' : 'No';
}

function computeTripDays(fromDate: string, toDate: string): number | null {
    const from = parseDateDDMMYYYY(fromDate);
    const to = parseDateDDMMYYYY(toDate);
    if (!from || !to) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((to.getTime() - from.getTime()) / msPerDay);
    return diffDays + 1;
}

function parseDateDDMMYYYY(input: string): Date | null {
    const m = input.trim().match(/^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    return new Date(yyyy, mm - 1, dd);
}

export default function BookingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const id = params.id as string;

    const [mounted, setMounted] = useState(false);
    const [agreement, setAgreement] = useState<AgreementResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [advanceNote, setAdvanceNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && id && mounted) {
            loadAgreement();
        }
    }, [id, user, mounted]);

    const loadAgreement = async () => {
        if (!user || !mounted) return;
        try {
            const data = await agreementsApi.getById(id);
            setAgreement(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load booking');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdvance = async () => {
        if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        setProcessing(true);
        try {
            await agreementsApi.addAdvance(id, {
                amount: advanceAmount,
                note: advanceNote
            });
            await loadAgreement();
            setShowAdvanceModal(false);
            setAdvanceAmount('');
            setAdvanceNote('');
        } catch (err: any) {
            alert(err.message || 'Failed to add advance');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        setProcessing(true);
        try {
            await agreementsApi.cancel(id);
            router.push('/bookings');
        } catch (err: any) {
            alert(err.message || 'Failed to cancel booking');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!agreement) return;

        setProcessing(true);
        try {
            await generateAndDownloadPdf(agreement, {
                companyName: user?.companyName || 'S3T Heritage Transport',
                address: user?.companyAddress || '',
                phone: user?.companyPhone || agreement.phone,
                email: user?.email || ''
            });
        } catch (err: any) {
            alert(err.message || 'Failed to generate PDF');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    if (error || !agreement) {
        return (
            <div className="min-h-screen bg-bg-deep p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="glass p-8 rounded-2xl text-center">
                        <p className="text-red-400 mb-4">Failed to load booking</p>
                        <p className="text-text-muted text-sm mb-6">{error}</p>
                        <Link href="/bookings" className="gold-bg-gradient px-6 py-2 rounded-xl text-bg-deep font-bold text-sm inline-block">
                            Back to Bookings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const totalDays = computeTripDays(agreement.fromDate, agreement.toDate);
    const isCancelled = agreement.isCancelled;

    return (
        <div className="min-h-screen bg-bg-deep p-8">
            <div className="max-w-5xl mx-auto">
                <Link href="/bookings" className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                    <ChevronLeft size={16} /> Back to Bookings
                </Link>

                <header className="mb-10">
                    <h1 className="text-3xl font-serif font-bold mb-2">{agreement.customerName}</h1>
                    <p className="text-text-muted text-sm">Booking ID: {agreement.id}</p>
                </header>

                {isCancelled && (
                    <div className="glass p-4 rounded-xl mb-6 border border-red-500/30 bg-red-500/10 flex items-center gap-3">
                        <Ban className="text-red-400" size={20} />
                        <p className="text-red-400 font-bold">This booking has been cancelled</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Customer Information */}
                    <section className="glass p-6 rounded-2xl">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <User size={20} className="text-brand-gold" />
                            Customer Details
                        </h2>
                        <div className="space-y-4">
                            <InfoRow label="Name" value={agreement.customerName} />
                            <InfoRow label="Phone" value={agreement.phone} />
                        </div>
                    </section>

                    {/* Trip Details */}
                    <section className="glass p-6 rounded-2xl lg:col-span-2">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-brand-gold" />
                            Trip Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="From Date" value={agreement.fromDate} />
                            <InfoRow label="To Date" value={agreement.toDate} />
                            <InfoRow label="Total Days" value={totalDays?.toString() || '-'} />
                            <InfoRow label="Bus Type" value={agreement.busType} />
                            <InfoRow label="Bus Count" value={agreement.busCount?.toString() || '-'} />
                            <InfoRow label="Passengers" value={agreement.passengers?.toString() || '-'} />
                            <div className="col-span-2">
                                <InfoRow label="Places to Cover" value={agreement.placesToCover} />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Rent Details */}
                    <section className="glass p-6 rounded-2xl">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Calculator size={20} className="text-brand-gold" />
                            Rent Details
                        </h2>
                        <div className="space-y-4">
                            <InfoRow label="Per Day Rent" value={money(agreement.perDayRent)} />
                            <InfoRow label="Mountain Rent" value={yesNo(agreement.includeMountainRent)} />
                            {agreement.includeMountainRent && (
                                <InfoRow label="Mountain Amount" value={money(agreement.mountainRent)} />
                            )}
                        </div>
                    </section>

                    {/* Payment Details */}
                    <section className="glass p-6 rounded-2xl">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <CreditCard size={20} className="text-brand-gold" />
                            Payment Details
                        </h2>
                        <div className="space-y-4">
                            <InfoRow label="Total Amount" value={money(agreement.totalAmount)} />
                            <InfoRow label="Advance Paid" value={money(agreement.advancePaid)} />
                            <InfoRow label="Balance" value={money(agreement.balance)} highlight />
                        </div>
                    </section>
                </div>

                {/* Notes */}
                {agreement.notes && (
                    <section className="glass p-6 rounded-2xl mb-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-brand-gold" />
                            Notes
                        </h2>
                        <p className="text-text-muted text-sm">{agreement.notes}</p>
                    </section>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button
                        onClick={() => setShowAdvanceModal(true)}
                        disabled={isCancelled || processing}
                        className="glass px-4 py-3 rounded-xl text-sm font-bold hover:border-brand-gold/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <PlusCircle size={16} />
                        Add Advance
                    </button>
                    <Link
                        href={`/accounts/${agreement.id}`}
                        className="glass px-4 py-3 rounded-xl text-sm font-bold hover:border-brand-gold/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Wallet size={16} />
                        Accounts
                    </Link>
                    <Link
                        href={`/bookings/${agreement.id}/edit`}
                        className={`glass px-4 py-3 rounded-xl text-sm font-bold hover:border-brand-gold/30 transition-colors flex items-center justify-center gap-2 ${isCancelled ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <Edit2 size={16} />
                        Edit
                    </Link>
                    <button
                        onClick={() => setShowPreview(true)}
                        className="glass px-4 py-3 rounded-xl text-sm font-bold hover:border-brand-gold/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={16} />
                        Preview
                    </button>
                    <button
                        onClick={handleCancelBooking}
                        disabled={isCancelled || processing}
                        className="glass px-4 py-3 rounded-xl text-sm font-bold hover:border-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-red-400"
                    >
                        <Ban size={16} />
                        Cancel
                    </button>
                </div>

                {/* Add Advance Modal */}
                {showAdvanceModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="glass p-8 rounded-2xl max-w-md w-full">
                            <h3 className="text-xl font-bold mb-6">Add Advance Payment</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={advanceAmount}
                                        onChange={(e) => setAdvanceAmount(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Note (Optional)</label>
                                    <textarea
                                        value={advanceNote}
                                        onChange={(e) => setAdvanceNote(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors resize-none"
                                        placeholder="Payment note..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setShowAdvanceModal(false)}
                                    className="flex-1 glass px-4 py-3 rounded-xl text-sm font-bold hover:border-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAdvance}
                                    disabled={processing}
                                    className="flex-1 gold-bg-gradient px-4 py-3 rounded-xl text-bg-deep font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50"
                                >
                                    {processing ? 'Adding...' : 'Add Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agreement Preview Modal */}
                {showPreview && agreement && (
                    <AgreementPreview
                        agreement={agreement}
                        onClose={() => setShowPreview(false)}
                        companyInfo={{
                            name: user?.companyName || 'S3T Heritage Transport',
                            address: user?.companyAddress || 'Tamil Nadu, India',
                            phone: user?.companyPhone || '+91 98765 43210',
                            email: user?.email || 'heritage@s3t.com'
                        }}
                    />
                )}
            </div>
        </div >
    );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-text-muted text-sm">{label}</span>
            <span className={`text-sm font-bold text-right ${highlight ? 'text-brand-gold' : ''}`}>
                {value || '-'}
            </span>
        </div>
    );
}
