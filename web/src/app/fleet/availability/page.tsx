"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { scheduleApi, agreementsApi } from '@/lib/api/services';
import { ScheduleResponse, BusResponse, ScheduleAgreementDto, AgreementResponse } from '@/types/api';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Bus as BusIcon,
    Loader2,
    RefreshCw,
    X,
    ArrowRight,
    Clock,
    AlertTriangle,
    Save,
    Ban,
    Plus,
    Search,
    Filter
} from 'lucide-react';
import Link from 'next/link';
import MonthCalendar from '@/components/MonthCalendar';

export default function FleetAvailabilityPage() {
    const [viewMode, setViewMode] = useState<'scheduler' | 'calendar'>('scheduler');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ScheduleResponse | null>(null);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 3); // Start from 3 days ago for better context
        return d.toISOString().split('T')[0];
    });
    const [daysCount, setDaysCount] = useState(14);
    const [searchTerm, setSearchTerm] = useState('');

    // Action States
    const [selectedAssignment, setSelectedAssignment] = useState<{ agreement: ScheduleAgreementDto, busId: string } | null>(null);
    const [showAssignModal, setShowAssignModal] = useState<{ busId: string, date: string } | null>(null);
    const [unassignedAgreements, setUnassignedAgreements] = useState<AgreementResponse[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const [showChangeBus, setShowChangeBus] = useState(false);

    // Reschedule Form
    const [newDates, setNewDates] = useState({ from: '', to: '' });

    // Change Bus Form
    const [newBusId, setNewBusId] = useState('');

    const loadSchedule = async () => {
        setLoading(true);
        try {
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(start.getDate() + daysCount);

            const [schedRes, allAgreements] = await Promise.all([
                scheduleApi.get(startDate, end.toISOString().split('T')[0]),
                agreementsApi.list()
            ]);

            setData(schedRes);

            // Filter agreements that need bus assignment (busCount > assignedBusIds.length)
            // Note: Since schedule data is a snapshot, we use the list but it might not be perfect.
            // Simplified: Show all active agreements that aren't cancelled.
            setUnassignedAgreements(allAgreements.filter(a => !a.isCancelled));

        } catch (error) {
            console.error('Failed to load schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedule();
    }, [startDate, daysCount]);

    const dates = useMemo(() => {
        const arr = [];
        const curr = new Date(startDate);
        for (let i = 0; i <= daysCount; i++) {
            arr.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return arr;
    }, [startDate, daysCount]);

    const isAssigned = (busId: string, date: Date) => {
        if (!data) return null;
        const dateStr = date.toISOString().split('T')[0];
        return data.agreements.find(a =>
            a.assignedBusIds?.includes(busId) &&
            dateStr >= a.fromDate.split('T')[0] &&
            dateStr <= a.toDate.split('T')[0]
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    const isToday = (date: Date) => {
        return date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    };

    // --- Action Handlers ---

    const handleAssignmentClick = (e: React.MouseEvent, agreement: ScheduleAgreementDto, busId: string) => {
        e.preventDefault(); // Prevent navigation if wrapped in Link
        setSelectedAssignment({ agreement, busId });
        setNewDates({ from: agreement.fromDate, to: agreement.toDate });
        setNewBusId(busId);
    };

    const handleRescheduleSubmit = async () => {
        if (!selectedAssignment) return;
        setActionLoading(true);
        try {
            // We need full agreement details to update
            const fullAgreement = await agreementsApi.getById(selectedAssignment.agreement.id);

            // Create a clean payload with only editable fields
            const updatePayload = {
                customerName: fullAgreement.customerName,
                phone: fullAgreement.phone,
                fromDate: newDates.from,
                toDate: newDates.to,
                busType: fullAgreement.busType,
                busCount: fullAgreement.busCount,
                passengers: fullAgreement.passengers,
                placesToCover: fullAgreement.placesToCover,
                perDayRent: fullAgreement.perDayRent,
                includeMountainRent: fullAgreement.includeMountainRent,
                mountainRent: fullAgreement.mountainRent,
                totalAmount: fullAgreement.totalAmount,
                advancePaid: fullAgreement.advancePaid,
                notes: fullAgreement.notes
            };

            await agreementsApi.update(selectedAssignment.agreement.id, updatePayload);

            setShowReschedule(false);
            setSelectedAssignment(null);
            await loadSchedule();
        } catch (error: any) {
            alert('Failed to reschedule: ' + (error.message || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCellClick = (busId: string, date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const existing = isAssigned(busId, date);
        if (existing) {
            setSelectedAssignment({ agreement: existing, busId });
        } else {
            setShowAssignModal({ busId, date: dateStr });
        }
    };

    const handleDragStart = (e: React.DragEvent, agreement: ScheduleAgreementDto, busId: string) => {
        e.dataTransfer.setData('agreementId', agreement.id);
        e.dataTransfer.setData('sourceBusId', busId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetBusId: string) => {
        e.preventDefault();
        const agreementId = e.dataTransfer.getData('agreementId');
        const sourceBusId = e.dataTransfer.getData('sourceBusId');

        if (!agreementId || !sourceBusId || sourceBusId === targetBusId) return;

        setActionLoading(true);
        try {
            await agreementsApi.unassignBus(agreementId, sourceBusId);
            await agreementsApi.assignBus(agreementId, targetBusId);
            await loadSchedule();
        } catch (error: any) {
            alert('Reassignment Failed: ' + (error.message || 'The target vehicle might already be booked for these dates.'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnassign = async () => {
        if (!selectedAssignment) return;
        if (!confirm('Are you sure you want to unassign this vehicle from this booking?')) return;

        setActionLoading(true);
        try {
            await agreementsApi.unassignBus(selectedAssignment.agreement.id, selectedAssignment.busId);
            setSelectedAssignment(null);
            await loadSchedule();
        } catch (error: any) {
            alert('Failed to unassign: ' + (error.message || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickAssign = async (agreementId: string) => {
        if (!showAssignModal) return;
        setActionLoading(true);
        try {
            await agreementsApi.assignBus(agreementId, showAssignModal.busId);
            setShowAssignModal(null);
            await loadSchedule();
        } catch (error: any) {
            alert('Assignment Failed: ' + (error.message || 'Bus might be double-booked.'));
        } finally {
            setActionLoading(false);
        }
    };

    const filteredBuses = useMemo(() => {
        if (!data) return [];
        return data.buses.filter(b =>
            b.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [data, searchTerm]);

    const handleChangeBusSubmit = async () => {
        if (!selectedAssignment) return;
        if (newBusId === selectedAssignment.busId) {
            setShowChangeBus(false);
            return;
        }

        setActionLoading(true);
        try {
            // 1. Unassign from current bus
            await agreementsApi.unassignBus(selectedAssignment.agreement.id, selectedAssignment.busId);

            // 2. Assign to new bus
            await agreementsApi.assignBus(selectedAssignment.agreement.id, newBusId);

            setShowChangeBus(false);
            setSelectedAssignment(null);
            await loadSchedule();
        } catch (error: any) {
            alert('Failed to change bus: ' + (error.message || 'Unknown error'));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Fleet Control</h4>
                    <h1 className="text-4xl font-serif font-bold">Operational Scheduler</h1>
                    <p className="text-text-muted mt-2">Gantt visualization of vehicle availability and assignments.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-muted uppercase">Filter Fleet</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold/50" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Van No / Name"
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-gold outline-none w-48"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-muted uppercase">Start Date</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold" size={14} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-brand-gold outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-text-muted uppercase">View Range</label>
                        <select
                            value={daysCount}
                            onChange={(e) => setDaysCount(parseInt(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:border-brand-gold outline-none appearance-none pr-10"
                        >
                            <option value={7} className="bg-bg-deep">1 Week</option>
                            <option value={14} className="bg-bg-deep">2 Weeks</option>
                            <option value={30} className="bg-bg-deep">1 Month</option>
                        </select>
                    </div>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('scheduler')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'scheduler' ? 'bg-brand-gold text-bg-deep shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Gantt
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-brand-gold text-bg-deep shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Calendar
                        </button>
                    </div>
                    <button
                        onClick={loadSchedule}
                        className="glass p-2.5 rounded-xl hover:text-brand-gold transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <MonthCalendar
                    date={new Date(startDate)}
                    schedule={data}
                    onDateChange={(d) => setStartDate(d.toISOString().split('T')[0])}
                />
            ) : (
                <div className="glass rounded-[2rem] overflow-hidden border-white/5 flex flex-col">
                    {/* Header Row */}
                    <div className="flex border-b border-white/10 bg-white/[0.02]">
                        <div className="w-64 p-4 border-r border-white/10 flex items-center gap-2 shrink-0">
                            <BusIcon size={18} className="text-brand-gold" />
                            <span className="text-xs font-bold uppercase tracking-widest">Vehicle Fleet</span>
                        </div>
                        <div className="flex-grow flex overflow-x-auto scrollbar-hide">
                            {dates.map((date, i) => (
                                <div
                                    key={i}
                                    className={`min-w-[100px] flex-grow p-4 border-r border-white/5 text-center transition-colors ${isToday(date) ? 'bg-brand-gold/10' : ''}`}
                                >
                                    <p className={`text-[10px] uppercase font-bold ${isToday(date) ? 'text-brand-gold' : 'text-text-muted'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className={`text-sm font-bold mt-1 ${isToday(date) ? 'text-brand-gold' : 'text-text-luxury'}`}>
                                        {formatDate(date)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fleet Rows */}
                    <div className="flex flex-col">
                        {filteredBuses.map((bus) => (
                            <div key={bus.id} className="flex border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                <div className="w-64 p-6 border-r border-white/10 shrink-0">
                                    <h5 className="font-serif font-bold text-text-luxury">{bus.vehicleNumber}</h5>
                                    <p className="text-[10px] text-text-muted truncate mt-1">{bus.name || 'Classic Coach'}</p>
                                </div>
                                <div className="flex-grow flex overflow-x-auto scrollbar-hide relative">
                                    {dates.map((date, i) => {
                                        const assignment = isAssigned(bus.id, date);

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => handleCellClick(bus.id, date)}
                                                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                                onDrop={(e) => handleDrop(e, bus.id)}
                                                className={`min-w-[100px] flex-grow border-r border-white/[0.03] p-2 flex items-center justify-center relative hover:bg-white/5 cursor-pointer transition-colors ${isToday(date) ? 'bg-brand-gold/[0.03]' : ''}`}
                                            >
                                                {assignment && (
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, assignment, bus.id)}
                                                        className={`absolute inset-1 rounded-lg p-2 text-[10px] font-bold overflow-hidden z-10 text-left cursor-move hover:scale-95 transition-transform ${assignment.busType === 'AC'
                                                            ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30 shadow-[0_4px_12px_rgba(197,160,89,0.2)]'
                                                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                            }`}
                                                        title={`${assignment.customerName} - Drag to Reassign`}
                                                    >
                                                        <div className="truncate">{assignment.customerName}</div>
                                                        <div className="opacity-60 truncate">Assigned</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredBuses.length === 0 && (
                            <div className="p-24 text-center">
                                <BusIcon size={48} className="mx-auto text-text-muted opacity-20 mb-4" />
                                <p className="text-text-muted">No vehicles registered in the heritage fleet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-8 flex gap-8 items-center text-[10px] text-text-muted uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-brand-gold/20 border border-brand-gold/30"></div>
                    <span>AC Heritage Assignments</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
                    <span>Non-AC Classic Assignments</span>
                </div>
            </div>

            {/* Management Modal */}
            {selectedAssignment && !showReschedule && !showChangeBus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="glass p-8 rounded-[2rem] max-w-md w-full border-white/10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold font-serif">{selectedAssignment.agreement.customerName}</h3>
                                <p className="text-sm text-text-muted">Booking Reference: {selectedAssignment.agreement.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-brand-gold mb-2">
                                        <CalendarIcon size={16} />
                                        <span className="text-[10px] uppercase font-bold">Dates</span>
                                    </div>
                                    <p className="text-sm font-bold">{selectedAssignment.agreement.fromDate}</p>
                                    <p className="text-xs text-text-muted">to</p>
                                    <p className="text-sm font-bold">{selectedAssignment.agreement.toDate}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-2 text-brand-gold mb-2">
                                        <BusIcon size={16} />
                                        <span className="text-[10px] uppercase font-bold">Vehicle</span>
                                    </div>
                                    <p className="text-sm font-bold">
                                        {data?.buses.find(b => b.id === selectedAssignment.busId)?.vehicleNumber || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-text-muted">Current Assignment</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowReschedule(true)}
                                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Clock size={18} className="text-brand-gold" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Reschedule Tour</p>
                                            <p className="text-[10px] text-text-muted">Change start or end dates</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button
                                    onClick={() => setShowChangeBus(true)}
                                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw size={18} className="text-brand-gold" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Swap Vehicle</p>
                                            <p className="text-[10px] text-text-muted">Move to different fleet unit</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <Link
                                    href={`/track/${selectedAssignment.agreement.id}`}
                                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <ArrowRight size={18} className="text-text-muted" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">View Full Details</p>
                                            <p className="text-[10px] text-text-muted">Open booking manager</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>

                                <button
                                    onClick={handleUnassign}
                                    disabled={actionLoading}
                                    className="w-full p-4 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 flex items-center justify-between group transition-all text-red-400"
                                >
                                    <div className="flex items-center gap-3">
                                        <Ban size={18} className="text-red-400" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Unassign Vehicle</p>
                                            <p className="text-[10px] text-red-400/60">Remove bus from this booking</p>
                                        </div>
                                    </div>
                                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showReschedule && selectedAssignment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="glass p-8 rounded-[2rem] max-w-md w-full border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif">Reschedule Tour</h3>
                            <button onClick={() => setShowReschedule(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-text-muted">New Start Date</label>
                                    <input
                                        type="date"
                                        value={newDates.from}
                                        onChange={e => setNewDates({ ...newDates, from: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-text-muted">New End Date</label>
                                    <input
                                        type="date"
                                        value={newDates.to}
                                        onChange={e => setNewDates({ ...newDates, to: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                                <p className="text-xs text-amber-500/80">Changing dates will update the booking agreement. Ensure vehicle availability for new dates.</p>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button
                                    onClick={() => setShowReschedule(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRescheduleSubmit}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 rounded-xl gold-bg-gradient text-bg-deep font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Confirm Change</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Bus Modal */}
            {showChangeBus && selectedAssignment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="glass p-8 rounded-[2rem] max-w-md w-full border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold font-serif">Swap Vehicle</h3>
                            <button onClick={() => setShowChangeBus(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-text-muted">Select New Unit</label>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {data?.buses.map(bus => (
                                        <button
                                            key={bus.id}
                                            onClick={() => setNewBusId(bus.id)}
                                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${newBusId === bus.id
                                                ? 'bg-brand-gold/20 border-brand-gold text-brand-gold'
                                                : 'bg-white/5 border-white/10 hover:border-white/30'
                                                } ${bus.id === selectedAssignment.busId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={bus.id === selectedAssignment.busId}
                                        >
                                            <div>
                                                <p className="font-bold text-sm">{bus.vehicleNumber}</p>
                                                <p className="text-[10px] opacity-70">{bus.name || 'Classic Coach'}</p>
                                            </div>
                                            {bus.id === selectedAssignment.busId && <span className="text-[10px]">Current</span>}
                                            {newBusId === bus.id && <div className="w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_10px_orange]"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowChangeBus(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangeBusSubmit}
                                    disabled={actionLoading || !newBusId || newBusId === selectedAssignment?.busId}
                                    className="flex-1 py-3 rounded-xl gold-bg-gradient text-bg-deep font-bold text-sm flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><RefreshCw size={16} /> Confirm Swap</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="glass p-8 rounded-[2rem] max-w-lg w-full border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold font-serif">Quick Assign</h3>
                                <p className="text-xs text-text-muted">
                                    Assigning {data?.buses.find(b => b.id === showAssignModal.busId)?.vehicleNumber} for {showAssignModal.date}
                                </p>
                            </div>
                            <button onClick={() => setShowAssignModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search unassigned agreements..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-brand-gold outline-none"
                                />
                            </div>

                            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                {unassignedAgreements.filter(a => {
                                    // Only show agreements that overlap with the selected date (optional, but requested for "focused view")
                                    // For now show all unassigned ones
                                    return true;
                                }).map(a => (
                                    <button
                                        key={a.id}
                                        disabled={actionLoading}
                                        onClick={() => handleQuickAssign(a.id)}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:border-brand-gold/30 hover:bg-white/10 text-left transition-all flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-brand-gold transition-colors">{a.customerName}</p>
                                            <p className="text-[10px] text-text-muted">{a.fromDate} to {a.toDate} • {a.busType}</p>
                                        </div>
                                        <Plus size={16} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                                {unassignedAgreements.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-text-muted">No pending assignments found.</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <Link
                                    href="/bookings/new"
                                    className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Create New Booking
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
