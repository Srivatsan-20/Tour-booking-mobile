"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    accountsApi,
    agreementsApi
} from '@/lib/api/services';
import {
    AgreementResponse,
    AgreementAccountsResponse,
    BusExpenseDto,
    BusResponse
} from '@/types/api';
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Save,
    FileText,
    Share2,
    RefreshCw,
    Ban,
    Pencil,
    Loader2,
    ChevronLeft,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Calculator,
    Compass,
    Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';

type EditableFuel = { id?: string; place: string; liters: string; cost: string };
type EditableOther = { id?: string; description: string; amount: string };

type BusState = {
    busId: string | null;
    label: string;
    driverBatta: string;
    startKm: string;
    endKm: string;
    fuelEntries: EditableFuel[];
    otherExpenses: EditableOther[];
    tolls: string;
    parking: string;
    permit: string;
};

export default function TourAccountPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agreement, setAgreement] = useState<AgreementResponse | null>(null);
    const [accounts, setAccounts] = useState<AgreementAccountsResponse | null>(null);
    const [buses, setBuses] = useState<BusState[]>([]);
    const [collapsedBuses, setCollapsedBuses] = useState<Record<string, boolean>>({});

    const busLabel = (bus: BusResponse) => {
        const name = bus.name ? ` (${bus.name})` : '';
        return `${bus.vehicleNumber}${name}`;
    };

    const createEmptyBus = (busId: string | null, label: string): BusState => ({
        busId,
        label,
        driverBatta: '0',
        startKm: '',
        endKm: '',
        fuelEntries: [],
        otherExpenses: [],
        tolls: '0',
        parking: '0',
        permit: '0',
    });

    const filterOutSpecialExpenses = (others: { description: string; amount: string }[]) => {
        const keys = ['Tolls', 'Parking', 'Permit/RTO'];
        return others.filter(o => !keys.includes(o.description));
    };

    const findExpense = (others: { description: string; amount: string }[], key: string) => {
        const found = others.find(o => o.description === key);
        return found ? found.amount : '0';
    };

    const buildInitialBuses = useCallback((acc: AgreementAccountsResponse): BusState[] => {
        const required = acc.requiredBusCount > 0 ? acc.requiredBusCount : 1;
        const assigned = acc.assignedBuses ?? [];

        const existing = (acc.busExpenses ?? []).map((be, idx) => {
            const label = be.busVehicleNumber
                ? `${be.busVehicleNumber}${be.busName ? ` (${be.busName})` : ''}`
                : `Bus ${idx + 1}`;

            const rawOthers = (be.otherExpenses ?? []).map(o => ({
                description: o.description ?? '',
                amount: String(o.amount ?? 0),
            }));

            return {
                busId: be.busId ?? null,
                label,
                driverBatta: String(be.driverBatta ?? 0),
                startKm: be.startKm == null ? '' : String(be.startKm),
                endKm: be.endKm == null ? '' : String(be.endKm),
                fuelEntries: (be.fuelEntries ?? []).map(f => ({
                    place: f.place ?? '',
                    liters: String(f.liters ?? 0),
                    cost: String(f.cost ?? 0),
                })),
                otherExpenses: filterOutSpecialExpenses(rawOthers),
                tolls: findExpense(rawOthers, 'Tolls'),
                parking: findExpense(rawOthers, 'Parking'),
                permit: findExpense(rawOthers, 'Permit/RTO'),
            };
        });

        let out = [...existing];
        const existingBusIds = new Set(existing.map(b => b.busId).filter(Boolean));

        assigned.forEach(b => {
            if (!existingBusIds.has(b.id)) {
                out.push(createEmptyBus(b.id, busLabel(b)));
            }
        });

        while (out.length < required) {
            out.push(createEmptyBus(null, `Bus ${out.length + 1}`));
        }

        return out;
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [agrData, accData] = await Promise.all([
                agreementsApi.getById(id),
                accountsApi.getByAgreementId(id)
            ]);
            setAgreement(agrData);
            setAccounts(accData);
            setBuses(buildInitialBuses(accData));
        } catch (error) {
            console.error('Failed to load tour accounts:', error);
        } finally {
            setLoading(false);
        }
    }, [id, buildInitialBuses]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totals = useMemo(() => {
        const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

        const totalExpenses = buses.reduce((sum, b) => {
            const driver = parse(b.driverBatta);
            const fuel = b.fuelEntries.reduce((s, f) => s + parse(f.cost), 0);
            const other = b.otherExpenses.reduce((s, o) => s + parse(o.amount), 0);
            const special = parse(b.tolls) + parse(b.parking) + parse(b.permit);
            return sum + driver + fuel + other + special;
        }, 0);

        const income = agreement?.totalAmount ?? 0;
        const profit = income - totalExpenses;
        const profitMargin = income > 0 ? (profit / income) * 100 : 0;
        return { income, totalExpenses, profit, profitMargin };
    }, [agreement?.totalAmount, buses]);

    const toggleBus = (busId: string | null, idx: number) => {
        const key = busId ?? `idx-${idx}`;
        setCollapsedBuses(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                busExpenses: buses.map(b => {
                    const mergedOthers = [...b.otherExpenses];
                    if (b.tolls !== '0') mergedOthers.push({ description: 'Tolls', amount: b.tolls });
                    if (b.parking !== '0') mergedOthers.push({ description: 'Parking', amount: b.parking });
                    if (b.permit !== '0') mergedOthers.push({ description: 'Permit/RTO', amount: b.permit });

                    return {
                        busId: b.busId,
                        driverBatta: b.driverBatta,
                        startKm: b.startKm || null,
                        endKm: b.endKm || null,
                        fuelEntries: b.fuelEntries
                            .filter(f => f.place.trim() || f.liters.trim() || f.cost.trim())
                            .map(f => ({
                                place: f.place,
                                liters: f.liters,
                                cost: f.cost
                            })),
                        otherExpenses: mergedOthers
                            .filter(o => o.description.trim() || o.amount.trim())
                            .map(o => ({
                                description: o.description,
                                amount: o.amount
                            }))
                    };
                })
            };

            const updated = await accountsApi.upsert(id, payload);
            setAccounts(updated);
            setBuses(buildInitialBuses(updated));
            alert('Tour accounts saved successfully!');
        } catch (error) {
            console.error('Failed to save accounts:', error);
            alert('Failed to save accounts.');
        } finally {
            setSaving(false);
        }
    };

    const onShareLink = (bus: BusState) => {
        if (!bus.busId) {
            alert('Please save the bus assignment first.');
            return;
        }
        const token = btoa(`${id}|${bus.busId}`);
        const link = `http://localhost:3000/driver/log?token=${token}`; // Mock local link
        const message = `🚌 Driver Expense Link for ${bus.label}\n\nAdd Fuel/Expenses here:\n${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="animate-spin text-brand-gold" size={48} />
            </div>
        );
    }

    const isProfit = totals.profit >= 0;

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <Link href="/dashboard" className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                <ChevronLeft size={16} /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Financial Audit</h4>
                    <h1 className="text-4xl font-serif font-bold">Tour Accounts: {agreement?.customerName}</h1>
                    <p className="text-text-muted mt-2">Ref: {id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={loadData}
                        className="glass p-3 rounded-xl hover:border-brand-gold/30 transition-all text-text-muted hover:text-brand-gold"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button className="glass px-6 py-3 rounded-xl flex items-center gap-2 hover:border-brand-gold/30 transition-all font-bold">
                        <FileText size={20} /> Export Audit PDF
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="gold-bg-gradient px-8 py-3 rounded-xl text-bg-deep font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Commit Account</>}
                    </button>
                </div>
            </div>

            {/* Summary HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="glass p-8 rounded-[2rem] border-green-500/20">
                    <p className="text-tactical text-text-muted mb-2">Total Income</p>
                    <h2 className="text-4xl font-bold text-green-400">₹{totals.income.toLocaleString()}</h2>
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-400/70">
                        <TrendingUp size={14} /> Contract Value Verified
                    </div>
                </div>
                <div className="glass p-8 rounded-[2rem] border-red-500/20">
                    <p className="text-tactical text-text-muted mb-2">Total Expenses</p>
                    <h2 className="text-4xl font-bold text-red-400">₹{totals.totalExpenses.toLocaleString()}</h2>
                    <div className="mt-4 flex items-center gap-2 text-xs text-red-400/70">
                        <Calculator size={14} /> Cumulative Fleet Cost
                    </div>
                </div>
                <div className={`glass p-8 rounded-[2rem] border-brand-gold/20 ${!isProfit && 'border-red-500/30'}`}>
                    <p className="text-tactical text-text-muted mb-2">Net {isProfit ? 'Profit' : 'Loss'}</p>
                    <h2 className={`text-4xl font-bold ${isProfit ? 'text-brand-gold' : 'text-red-500'}`}>
                        ₹{Math.abs(totals.profit).toLocaleString()}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-xs text-brand-gold/70">
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        Margin: {totals.profitMargin.toFixed(2)}%
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-serif font-bold">Fleet Expense Journals</h3>
                    <button
                        onClick={() => setBuses(prev => [...prev, createEmptyBus(null, `Bus ${prev.length + 1}`)])}
                        className="text-brand-gold text-sm font-bold flex items-center gap-2 hover:underline"
                    >
                        <Plus size={16} /> Add Tactical Unit
                    </button>
                </div>

                {buses.map((b, idx) => {
                    const key = b.busId ?? `idx-${idx}`;
                    const isCollapsed = collapsedBuses[key] ?? true;

                    // Mileage preview
                    const totalLiters = b.fuelEntries.reduce((s, f) => s + (parseFloat(f.liters) || 0), 0);
                    const distance = (parseFloat(b.endKm) || 0) - (parseFloat(b.startKm) || 0);
                    const mileage = totalLiters > 0 && distance > 0 ? (distance / totalLiters).toFixed(2) : null;

                    return (
                        <div key={key} className="glass rounded-[2rem] overflow-hidden transition-all border-white/5">
                            <div
                                className="p-6 md:p-8 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => toggleBus(b.busId, idx)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                        <Compass size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif font-bold">{b.label}</h4>
                                        <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">Fleet ID: {b.busId?.slice(0, 8) || 'Manual Entry'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    {mileage && (
                                        <div className="hidden md:block text-right">
                                            <p className="text-[10px] text-text-muted uppercase mb-1">Performance</p>
                                            <p className="text-brand-gold font-bold">{mileage} KM/L</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onShareLink(b); }}
                                            className="p-3 rounded-xl hover:bg-green-500/10 text-green-400 transition-colors"
                                            title="Share Driver Portal"
                                        >
                                            <Share2 size={20} />
                                        </button>
                                        <button className="p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                        {isCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                                    </div>
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="p-8 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white/[0.02] animate-fade-in">
                                    <div className="space-y-8">
                                        {/* Odometer */}
                                        <div className="space-y-4">
                                            <p className="text-tactical text-brand-gold border-b border-brand-gold/20 pb-2">Odometer Reading (KM)</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">Start Reading</label>
                                                    <input
                                                        type="number"
                                                        value={b.startKm}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].startKm = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">End Reading</label>
                                                    <input
                                                        type="number"
                                                        value={b.endKm}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].endKm = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Standard Costs */}
                                        <div className="space-y-4">
                                            <p className="text-tactical text-brand-gold border-b border-brand-gold/20 pb-2">Operational Costs</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">Driver Batta</label>
                                                    <input
                                                        type="number"
                                                        value={b.driverBatta}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].driverBatta = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">Tolls</label>
                                                    <input
                                                        type="number"
                                                        value={b.tolls}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].tolls = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">Parking</label>
                                                    <input
                                                        type="number"
                                                        value={b.parking}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].parking = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-text-muted uppercase">Permit / RTO</label>
                                                    <input
                                                        type="number"
                                                        value={b.permit}
                                                        onChange={(e) => {
                                                            const next = [...buses];
                                                            next[idx].permit = e.target.value;
                                                            setBuses(next);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-gold transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Fuel Logs */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-brand-gold/20 pb-2">
                                                <p className="text-tactical text-brand-gold">Refueling Log</p>
                                                <button
                                                    onClick={() => {
                                                        const next = [...buses];
                                                        next[idx].fuelEntries.push({ place: '', liters: '', cost: '' });
                                                        setBuses(next);
                                                    }}
                                                    className="text-[10px] text-brand-gold font-bold hover:underline"
                                                >
                                                    + Add Record
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {b.fuelEntries.map((f, fIdx) => (
                                                    <div key={fIdx} className="flex gap-2 items-end">
                                                        <div className="flex-grow space-y-1">
                                                            <label className="text-[8px] text-text-muted uppercase">Location</label>
                                                            <input
                                                                placeholder="BPCL, Mysore"
                                                                value={f.place}
                                                                onChange={(e) => {
                                                                    const next = [...buses];
                                                                    next[idx].fuelEntries[fIdx].place = e.target.value;
                                                                    setBuses(next);
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:border-brand-gold outline-none"
                                                            />
                                                        </div>
                                                        <div className="w-20 space-y-1">
                                                            <label className="text-[8px] text-text-muted uppercase">Liters</label>
                                                            <input
                                                                placeholder="0.00"
                                                                value={f.liters}
                                                                onChange={(e) => {
                                                                    const next = [...buses];
                                                                    next[idx].fuelEntries[fIdx].liters = e.target.value;
                                                                    setBuses(next);
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:border-brand-gold outline-none"
                                                            />
                                                        </div>
                                                        <div className="w-24 space-y-1">
                                                            <label className="text-[8px] text-text-muted uppercase">Amount (₹)</label>
                                                            <input
                                                                placeholder="0"
                                                                value={f.cost}
                                                                onChange={(e) => {
                                                                    const next = [...buses];
                                                                    next[idx].fuelEntries[fIdx].cost = e.target.value;
                                                                    setBuses(next);
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:border-brand-gold outline-none text-brand-gold font-bold"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const next = [...buses];
                                                                next[idx].fuelEntries.splice(fIdx, 1);
                                                                setBuses(next);
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {b.fuelEntries.length === 0 && (
                                                    <p className="text-center text-xs text-text-muted py-4">No refueling records logged.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Other Expense */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-brand-gold/20 pb-2">
                                                <p className="text-tactical text-brand-gold">Misc Expenditures</p>
                                                <button
                                                    onClick={() => {
                                                        const next = [...buses];
                                                        next[idx].otherExpenses.push({ description: '', amount: '' });
                                                        setBuses(next);
                                                    }}
                                                    className="text-[10px] text-brand-gold font-bold hover:underline"
                                                >
                                                    + Add Expense
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {b.otherExpenses.map((o, oIdx) => (
                                                    <div key={oIdx} className="flex gap-2 items-end">
                                                        <div className="flex-grow space-y-1">
                                                            <label className="text-[8px] text-text-muted uppercase">Description</label>
                                                            <input
                                                                placeholder="Driver Lunch, Maintenance etc."
                                                                value={o.description}
                                                                onChange={(e) => {
                                                                    const next = [...buses];
                                                                    next[idx].otherExpenses[oIdx].description = e.target.value;
                                                                    setBuses(next);
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:border-brand-gold outline-none"
                                                            />
                                                        </div>
                                                        <div className="w-24 space-y-1">
                                                            <label className="text-[8px] text-text-muted uppercase">Amount (₹)</label>
                                                            <input
                                                                placeholder="0"
                                                                value={o.amount}
                                                                onChange={(e) => {
                                                                    const next = [...buses];
                                                                    next[idx].otherExpenses[oIdx].amount = e.target.value;
                                                                    setBuses(next);
                                                                }}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:border-brand-gold outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const next = [...buses];
                                                                next[idx].otherExpenses.splice(oIdx, 1);
                                                                setBuses(next);
                                                            }}
                                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {b.otherExpenses.length === 0 && (
                                                    <p className="text-center text-xs text-text-muted py-4">No miscellaneous expenses recorded.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="h-24" />
        </div>
    );
}
