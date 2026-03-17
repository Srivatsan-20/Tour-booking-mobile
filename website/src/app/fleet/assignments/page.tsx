"use client";

import React, { useState, useEffect } from 'react';
import { agreementsApi, busesApi, scheduleApi } from '@/lib/api/services';
import { AgreementResponse, BusResponse, ScheduleAgreementDto } from '@/types/api';
import {
    Loader2,
    Bus as BusIcon,
    ClipboardList,
    MapPin,
    Calendar as CalendarIcon,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ManageAssignmentsPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
    const [buses, setBuses] = useState<BusResponse[]>([]);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    // Ensure component is mounted on client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const loadData = async () => {
        if (!user || !mounted) return;
        setLoading(true);
        try {
            // Get current month range for schedule
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const formatDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const [scheduleData, busData] = await Promise.all([
                scheduleApi.get(formatDate(firstDay), formatDate(lastDay)),
                busesApi.list()
            ]);

            // Convert schedule agreements to AgreementResponse format
            const agreementsWithBuses: AgreementResponse[] = scheduleData.agreements.map((sa: ScheduleAgreementDto) => ({
                id: sa.id,
                customerName: sa.customerName,
                phone: '',
                fromDate: sa.fromDate,
                toDate: sa.toDate,
                busType: sa.busType,
                busCount: sa.busCount,
                passengers: null,
                placesToCover: '',
                perDayRent: null,
                includeMountainRent: false,
                mountainRent: 0,
                useIndividualBusRates: false,
                busRates: null,
                totalAmount: null,
                advancePaid: 0,
                balance: 0,
                notes: '',
                assignedBuses: sa.assignedBusIds.map((busId: string) => {
                    const bus = scheduleData.buses.find((b: BusResponse) => b.id === busId);
                    return bus ? {
                        id: bus.id,
                        vehicleNumber: bus.vehicleNumber,
                        name: bus.name
                    } : null;
                }).filter((b): b is NonNullable<typeof b> => b !== null),
                isCancelled: false,
                isCompleted: false,
                cancelledAtUtc: null,
                createdAtUtc: ''
            }));

            setAgreements(agreementsWithBuses);
            setBuses(busData.filter((b: BusResponse) => b.isActive));
        } catch (error) {
            console.error('Failed to load assignment data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && mounted) {
            loadData();
        }
    }, [user, mounted]);

    const unassignedTours = agreements.filter(a => !a.isCancelled && !a.isCompleted && (a.assignedBuses?.length || 0) < (a.busCount || 1));
    const activeAssignments = agreements.filter(a => !a.isCancelled && !a.isCompleted && (a.assignedBuses?.length || 0) > 0);

    const handleAssign = async (agreementId: string, busId: string) => {
        try {
            await agreementsApi.assignBus(agreementId, busId);
            loadData();
            setAssigningId(null);
        } catch (error: any) {
            // Extract the error message from "API Error: 409 - This agreement already has enough buses assigned"
            const errorMessage = error?.message || 'Failed to assign bus.';
            const match = errorMessage.match(/API Error: \d+ - (.+)/);
            const message = match ? match[1] : errorMessage;
            alert(message);
            console.error('Assignment error:', error);
        }
    };

    const handleUnassign = async (agreementId: string, busId: string) => {
        try {
            await agreementsApi.unassignBus(agreementId, busId);
            loadData();
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to unassign bus.';
            const match = errorMessage.match(/API Error: \d+ - (.+)/);
            const message = match ? match[1] : errorMessage;
            alert(message);
            console.error('Unassignment error:', error);
        }
    };

    // Helper function to parse dates (supports multiple formats)
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;

        // Try ISO format first (yyyy-MM-dd)
        const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
        }

        // Try dd/MM/yyyy format
        const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
            return new Date(parseInt(ddmmyyyyMatch[3]), parseInt(ddmmyyyyMatch[2]) - 1, parseInt(ddmmyyyyMatch[1]));
        }

        return null;
    };

    // Check if two date ranges overlap (inclusive)
    const overlapsInclusive = (aFrom: Date, aTo: Date, bFrom: Date, bTo: Date): boolean => {
        return aFrom <= bTo && bFrom <= aTo;
    };

    // Find if a bus has a conflict with the target tour
    const findBusConflict = (busId: string, targetTour: AgreementResponse): AgreementResponse | null => {
        const tFrom = parseDate(targetTour.fromDate);
        const tTo = parseDate(targetTour.toDate);
        if (!tFrom || !tTo) return null;

        for (const other of agreements) {
            if (other.id === targetTour.id) continue;
            if (!other.assignedBuses?.some(b => b.id === busId)) continue;

            const oFrom = parseDate(other.fromDate);
            const oTo = parseDate(other.toDate);
            if (!oFrom || !oTo) continue;

            if (overlapsInclusive(tFrom, tTo, oFrom, oTo)) {
                return other;
            }
        }
        return null;
    };

    if (loading && agreements.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12">
                <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Fleet Operations</h4>
                <h1 className="text-4xl font-serif font-bold">Manage Assignments</h1>
                <p className="text-text-muted mt-2">Deploy your heritage fleet to active tour contracts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Unassigned Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="text-brand-gold" size={20} />
                        <h2 className="text-xl font-serif font-bold">Pending Deployments ({unassignedTours.length})</h2>
                    </div>

                    {unassignedTours.map((tour) => (
                        <div key={tour.id} className="glass p-6 rounded-[2rem] border-brand-gold/20 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{tour.customerName}</h3>
                                    <div className="flex items-center gap-4 text-[10px] text-text-muted uppercase mt-1">
                                        <span className="flex items-center gap-1"><CalendarIcon size={12} /> {tour.fromDate}</span>
                                        <span className="flex items-center gap-1 font-bold text-brand-gold">{tour.busType} Class</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-text-muted uppercase">Needs</p>
                                    <p className="text-sm font-bold">{tour.busCount} Units</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-text-muted mb-6">
                                <MapPin size={14} className="text-brand-gold shrink-0" />
                                <span className="truncate">{tour.placesToCover}</span>
                            </div>

                            {assigningId === tour.id ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[10px] text-brand-gold font-bold uppercase mb-2">Select Unit to Deploy:</p>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {buses.map(bus => {
                                            const alreadyAssigned = tour.assignedBuses?.some(b => b.id === bus.id);
                                            const conflict = findBusConflict(bus.id, tour);
                                            const isDisabled = alreadyAssigned || !!conflict;

                                            return (
                                                <button
                                                    key={bus.id}
                                                    onClick={() => !isDisabled && handleAssign(tour.id, bus.id)}
                                                    disabled={isDisabled}
                                                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${isDisabled
                                                            ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                                            : 'bg-white/5 border-white/10 hover:border-brand-gold/40 group'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-sm font-bold">{bus.vehicleNumber}</span>
                                                        {!isDisabled && (
                                                            <span className="text-[10px] text-text-muted group-hover:text-brand-gold transition-colors">Deploy Unit</span>
                                                        )}
                                                    </div>
                                                    {bus.name && (
                                                        <span className="text-[10px] text-text-muted mt-1">{bus.name}</span>
                                                    )}
                                                    {alreadyAssigned && (
                                                        <span className="text-[10px] text-green-400 mt-1">✓ Already Assigned</span>
                                                    )}
                                                    {conflict && (
                                                        <span className="text-[10px] text-amber-400 mt-1">
                                                            ⚠ Conflict with: {conflict.customerName}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setAssigningId(null)}
                                        className="w-full text-center text-[10px] text-text-muted uppercase hover:text-white pt-2"
                                    >
                                        Cancel Deployment
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAssigningId(tour.id)}
                                    className="w-full gold-bg-gradient py-3 rounded-xl text-bg-deep font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                                >
                                    <BusIcon size={16} /> Assign Tactical Unit
                                </button>
                            )}
                        </div>
                    ))}

                    {unassignedTours.length === 0 && (
                        <div className="glass p-12 rounded-[2rem] text-center border-white/5 opacity-50">
                            <CheckCircle2 size={32} className="mx-auto text-green-400 mb-4" />
                            <p className="text-text-muted">All active tours have been deployed.</p>
                        </div>
                    )}
                </div>

                {/* Active Assignments */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="text-brand-gold" size={20} />
                        <h2 className="text-xl font-serif font-bold">Active Fleet Status ({activeAssignments.length})</h2>
                    </div>

                    {activeAssignments.map((tour) => (
                        <div key={tour.id} className="glass p-6 rounded-[2rem] border-white/5">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold">{tour.customerName}</h3>
                                    <p className="text-[10px] text-text-muted uppercase">{tour.fromDate} to {tour.toDate}</p>
                                </div>
                                <Link href={`/track/${tour.id}`} className="p-2 rounded-lg hover:bg-white/5 text-brand-gold transition-colors">
                                    <ChevronRight size={20} />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {tour.assignedBuses?.map(bus => (
                                    <div key={bus.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                                <BusIcon size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{bus.vehicleNumber}</p>
                                                <p className="text-[10px] text-text-muted uppercase">{bus.name || 'Classic Coach'}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnassign(tour.id, bus.id)}
                                            className="p-2 text-text-muted hover:text-red-500 transition-colors"
                                            title="Withdraw Unit"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {activeAssignments.length === 0 && (
                        <div className="glass p-12 rounded-[2rem] text-center border-white/5 opacity-50">
                            <BusIcon size={32} className="mx-auto text-text-muted mb-4" />
                            <p className="text-text-muted">No tactical units currently deployed.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
