"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { driverApi } from '@/lib/api/services';
import {
    Bus,
    Fuel,
    Wrench,
    Plus,
    History,
    CheckCircle,
    AlertCircle,
    Loader2,
    Lock,
    LogOut,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';

function DriverLogContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tripData, setTripData] = useState<{
        valid: boolean;
        busNumber: string;
        tripId: string;
        isCompleted: boolean;
        history: Array<{ type: string; amount: number; info: string }>;
        startKm: number;
        endKm: number;
    } | null>(null);

    // Form inputs
    const [startKm, setStartKm] = useState('');
    const [endKm, setEndKm] = useState('');
    
    // Fuel Form
    const [fuelPlace, setFuelPlace] = useState('');
    const [fuelLiters, setFuelLiters] = useState('');
    const [fuelCost, setFuelCost] = useState('');

    // Misc Expense Form
    const [expenseCategory, setExpenseCategory] = useState('Lunch');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');

    const loadDriverTrip = async () => {
        if (!token) {
            setError("No trip token provided. Please open this link from the message sent by your manager.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await driverApi.validateToken(token);
            setTripData(data);
            setStartKm(String(data.startKm || ''));
            setEndKm(String(data.endKm || ''));
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Failed to validate token. This link may be expired or invalid.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDriverTrip();
    }, [token]);

    const handleSubmitOdometer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !tripData) return;

        setSubmitting(true);
        try {
            await driverApi.submitExpense({
                token,
                type: 'Odometer',
                amount: 0,
                startKm: startKm ? parseInt(startKm) : undefined,
                endKm: endKm ? parseInt(endKm) : undefined
            });
            toast.success("Odometer updated successfully");
            await loadDriverTrip();
        } catch (err: any) {
            toast.error(err?.message || "Failed to update odometer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitFuel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !tripData) return;
        if (!fuelPlace.trim() || !fuelCost || !fuelLiters) {
            toast.error("Please fill all fuel details");
            return;
        }

        setSubmitting(true);
        try {
            await driverApi.submitExpense({
                token,
                type: 'Fuel',
                amount: parseFloat(fuelCost),
                liters: parseFloat(fuelLiters),
                place: fuelPlace.trim()
            });
            toast.success("Fuel log submitted successfully");
            setFuelPlace('');
            setFuelLiters('');
            setFuelCost('');
            await loadDriverTrip();
        } catch (err: any) {
            toast.error(err?.message || "Failed to submit fuel entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !tripData) return;
        if (!expenseAmount || !expenseCategory) {
            toast.error("Please specify category and amount");
            return;
        }

        setSubmitting(true);
        try {
            await driverApi.submitExpense({
                token,
                type: 'Expense',
                amount: parseFloat(expenseAmount),
                category: expenseCategory,
                description: expenseDescription.trim() || expenseCategory
            });
            toast.success("Expense submitted successfully");
            setExpenseAmount('');
            setExpenseDescription('');
            await loadDriverTrip();
        } catch (err: any) {
            toast.error(err?.message || "Failed to submit expense entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEndTour = async () => {
        if (!tripData) return;
        if (!confirm("Are you sure you want to end this tour? This will lock further edits for this vehicle.")) {
            return;
        }

        setSubmitting(true);
        try {
            // Retrieve agreement ID by decoding base64 token manually
            const decoded = atob(token || '');
            const agreementId = decoded.split('|')[0];
            await driverApi.endTour(agreementId);
            toast.success("Tour has been completed!");
            await loadDriverTrip();
        } catch (err: any) {
            toast.error(err?.message || "Failed to end tour");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
                <p className="text-text-muted text-sm uppercase tracking-widest font-bold">Validating Trip Ledger...</p>
            </div>
        );
    }

    if (error || !tripData) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4">
                <div className="glass max-w-md w-full p-8 rounded-3xl border-red-500/20 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-white">Access Denied</h2>
                        <p className="text-text-muted text-sm leading-relaxed">{error || "Invalid Token Access"}</p>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={loadDriverTrip}
                            className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-colors w-full"
                        >
                            Retry Validation
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isCompleted = tripData.isCompleted;

    return (
        <div className="min-h-screen bg-bg-deep text-text-luxury px-4 py-8 max-w-md mx-auto space-y-6 pb-24">
            {/* Inject CSS override to hide default navbar/footer */}
            <style dangerouslySetInnerHTML={{ __html: `
                nav, footer { display: none !important; }
            ` }} />

            {/* Header Card */}
            <div className="glass p-6 rounded-3xl border-white/5 bg-gradient-to-br from-bg-card to-bg-deep">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-brand-gold/10 text-brand-gold">
                        <Bus size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Heritage Fleet Unit</p>
                        <h1 className="text-2xl font-bold text-white leading-tight">{tripData.busNumber}</h1>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5 text-xs text-text-muted">
                    <div>
                        Trip Ref: <span className="text-white font-bold">{tripData.tripId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-brand-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]'}`} />
                        <span className="font-bold text-white uppercase tracking-tighter">
                            {isCompleted ? "Completed" : "Active"}
                        </span>
                    </div>
                </div>
            </div>

            {isCompleted && (
                <div className="glass p-5 rounded-2xl border-green-500/20 bg-green-500/[0.02] flex items-start gap-3">
                    <Lock size={18} className="text-green-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-green-400">Tour Completed & Locked</p>
                        <p className="text-xs text-green-400/80 mt-1">This transport assignment has ended. All expense logging forms have been locked.</p>
                    </div>
                </div>
            )}

            {/* Odometer Card */}
            <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-brand-gold border-b border-white/5 pb-2">
                    <Wrench size={16} />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Odometer Readings</h2>
                </div>
                <form onSubmit={handleSubmitOdometer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-text-muted uppercase font-bold">Start KM</label>
                            <input
                                type="number"
                                value={startKm}
                                onChange={(e) => setStartKm(e.target.value)}
                                disabled={isCompleted || submitting}
                                placeholder="0"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-text-muted uppercase font-bold">End KM</label>
                            <input
                                type="number"
                                value={endKm}
                                onChange={(e) => setEndKm(e.target.value)}
                                disabled={isCompleted || submitting}
                                placeholder="0"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                            />
                        </div>
                    </div>
                    {!isCompleted && (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Update Mileage</>}
                        </button>
                    )}
                </form>
            </div>

            {/* Fuel Log Card */}
            {!isCompleted && (
                <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-brand-gold border-b border-white/5 pb-2">
                        <Fuel size={16} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Log Refueling (Diesel)</h2>
                    </div>
                    <form onSubmit={handleSubmitFuel} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] text-text-muted uppercase font-bold">Refueling Station / Place</label>
                            <input
                                type="text"
                                placeholder="e.g. BPCL, Madurai Bypass"
                                value={fuelPlace}
                                onChange={(e) => setFuelPlace(e.target.value)}
                                disabled={submitting}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase font-bold">Liters Filled</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={fuelLiters}
                                    onChange={(e) => setFuelLiters(e.target.value)}
                                    disabled={submitting}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase font-bold">Total Cost (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={fuelCost}
                                    onChange={(e) => setFuelCost(e.target.value)}
                                    disabled={submitting}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-brand-gold font-bold placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-light text-bg-deep rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Submit Fuel Record</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Other Expense Card */}
            {!isCompleted && (
                <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-brand-gold border-b border-white/5 pb-2">
                        <Wrench size={16} />
                        <h2 className="text-sm font-bold uppercase tracking-wider">Log Other Expenses</h2>
                    </div>
                    <form onSubmit={handleSubmitExpense} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase font-bold">Category</label>
                                <select
                                    value={expenseCategory}
                                    onChange={(e) => setExpenseCategory(e.target.value)}
                                    disabled={submitting}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-brand-gold outline-none transition-colors appearance-none pr-10"
                                >
                                    <option value="Lunch" className="bg-bg-deep">Lunch / Batta</option>
                                    <option value="Tolls" className="bg-bg-deep">Tolls</option>
                                    <option value="Parking" className="bg-bg-deep">Parking</option>
                                    <option value="Permit" className="bg-bg-deep">Permit / RTO</option>
                                    <option value="Wash" className="bg-bg-deep">Bus Wash</option>
                                    <option value="Maintenance" className="bg-bg-deep">Repair / Spares</option>
                                    <option value="Other" className="bg-bg-deep">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-text-muted uppercase font-bold">Amount (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(e.target.value)}
                                    disabled={submitting}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-text-muted uppercase font-bold">Description / Note</label>
                            <input
                                type="text"
                                placeholder="Details about this expense"
                                value={expenseDescription}
                                onChange={(e) => setExpenseDescription(e.target.value)}
                                disabled={submitting}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:border-brand-gold outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Submit Expense Record</>}
                        </button>
                    </form>
                </div>
            )}

            {/* Travel Ledger History */}
            <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-brand-gold border-b border-white/5 pb-2">
                    <History size={16} />
                    <h2 className="text-sm font-bold uppercase tracking-wider">Submitted Logs</h2>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                    {tripData.history && tripData.history.length > 0 ? (
                        tripData.history.map((h, index) => (
                            <div key={index} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${h.type === 'Fuel' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {h.type === 'Fuel' ? <Fuel size={14} /> : <Wrench size={14} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">{h.info}</p>
                                        <p className="text-[9px] text-text-muted mt-0.5 uppercase tracking-wider">{h.type} Logged</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-black text-white">₹{h.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-xs text-text-muted">No expenses submitted yet for this coach.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* End Tour Button */}
            {!isCompleted && (
                <div className="pt-4">
                    <button
                        onClick={handleEndTour}
                        disabled={submitting}
                        className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-2xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 hover:scale-102 transition-transform"
                    >
                        <LogOut size={16} /> End & Finalize Tour
                    </button>
                </div>
            )}
        </div>
    );
}

export default function DriverLogPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
                <p className="text-text-muted text-sm uppercase tracking-widest font-bold">Initializing Portal Link...</p>
            </div>
        }>
            <DriverLogContent />
        </Suspense>
    );
}
