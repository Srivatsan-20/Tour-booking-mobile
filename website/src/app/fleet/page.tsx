"use client";

import React, { useState, useEffect } from 'react';
import { Bus as BusIcon, Plus, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { busesApi } from '@/lib/api/services';
import { BusResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BusManagementPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [buses, setBuses] = useState<BusResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBus, setEditingBus] = useState<BusResponse | null>(null);
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [busName, setBusName] = useState('');
    const [busType, setBusType] = useState('AC');
    const [capacity, setCapacity] = useState('40');
    const [baseRate, setBaseRate] = useState('5000');
    const [homeCity, setHomeCity] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const loadBuses = async () => {
        if (!user || !mounted) return;
        setLoading(true);
        setError('');
        try {
            const data = await busesApi.list({ includeInactive: true });
            setBuses(data.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber)));
        } catch (err: any) {
            console.error('Failed to load buses:', err);
            setError(err?.message || 'Failed to load buses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && mounted) {
            loadBuses();
        }
    }, [user, mounted]);

    const handleSubmitBus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleNumber.trim()) {
            alert('Please enter a vehicle number');
            return;
        }

        setSubmitting(true);
        try {
            const data = {
                vehicleNumber: vehicleNumber.trim(),
                name: busName.trim() || undefined,
                busType,
                capacity: parseInt(capacity) || 40,
                baseRate: parseFloat(baseRate) || 5000,
                homeCity: homeCity.trim() || undefined
            };

            if (editingBus) {
                await busesApi.update(editingBus.id, data);
            } else {
                await busesApi.create(data);
            }

            closeModal();
            await loadBuses();
        } catch (err: any) {
            alert(err?.message || 'Failed to save bus');
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingBus(null);
        setVehicleNumber('');
        setBusName('');
        setBusType('AC');
        setCapacity('40');
        setBaseRate('5000');
        setHomeCity('');
    };

    const handleEditBus = (bus: BusResponse) => {
        setEditingBus(bus);
        setVehicleNumber(bus.vehicleNumber);
        setBusName(bus.name || '');
        setBusType(bus.busType || 'AC');
        setCapacity(bus.capacity?.toString() || '40');
        setBaseRate(bus.baseRate?.toString() || '5000');
        setHomeCity(bus.homeCity || '');
        setShowAddModal(true);
    };

    const handleDeleteBus = async (bus: BusResponse) => {
        if (!confirm(`Are you sure you want to delete bus ${bus.vehicleNumber}?`)) {
            return;
        }

        try {
            await busesApi.delete(bus.id);
            await loadBuses();
        } catch (err: any) {
            alert(err?.message || 'Failed to delete bus');
        }
    };

    if (loading && !mounted) {
        return (
            <div className="min-h-screen bg-bg-deep flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep">
            {/* Header */}
            <div className="bg-gradient-to-r from-bg-card to-bg-deep border-b border-border-subtle">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-muted text-sm font-medium tracking-wider uppercase mb-2">
                                FLEET REGISTRY
                            </p>
                            <h1 className="text-4xl font-serif font-bold text-text-luxury">
                                Bus Management
                            </h1>
                            <p className="text-text-muted mt-2">
                                Manage your heritage fleet of {buses.filter(b => b.isActive).length} active vehicles
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-bg-deep font-semibold rounded-lg hover:bg-brand-gold-light transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Bus
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-400 font-medium">Error loading buses</p>
                            <p className="text-red-300 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
                    </div>
                ) : buses.length === 0 ? (
                    <div className="text-center py-20">
                        <BusIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <p className="text-text-muted text-lg mb-6">No buses in your fleet yet</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-bg-deep font-semibold rounded-lg hover:bg-brand-gold-light transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Bus
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {buses.map((bus) => (
                            <div
                                key={bus.id}
                                onClick={() => handleEditBus(bus)}
                                className={`bg-bg-card border rounded-2xl p-6 transition-all hover:shadow-2xl cursor-pointer group ${bus.isActive
                                    ? 'border-white/5 hover:border-brand-gold/30'
                                    : 'border-white/5 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-xl ${bus.isActive ? 'bg-brand-gold/10' : 'bg-gray-800'
                                            }`}>
                                            <BusIcon className={`w-8 h-8 ${bus.isActive ? 'text-brand-gold' : 'text-gray-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-text-luxury group-hover:text-brand-gold transition-colors">
                                                {bus.vehicleNumber}
                                            </h3>
                                            <p className="text-text-muted text-sm mt-0.5">
                                                {bus.name || 'Heritage Classic'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteBus(bus);
                                        }}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete bus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Capacity</p>
                                        <p className="text-text-luxury font-serif">{bus.capacity || 40} Seats</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Type</p>
                                        <p className="text-text-luxury">{bus.busType}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Daily Rate</p>
                                        <p className="text-brand-gold font-bold">₹{bus.baseRate?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Home City</p>
                                        <p className="text-text-luxury">{bus.homeCity || 'Multi-city'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${bus.isActive
                                        ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                                        : 'bg-gray-700 text-gray-400 border border-gray-600'
                                        }`}>
                                        {bus.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <div className="text-[10px] font-bold text-brand-gold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to Edit →
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && buses.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={loadBuses}
                            className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-luxury transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                )}
            </div>

            {/* Add Bus Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-bg-card border border-white/10 rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/5">
                            <h2 className="text-3xl font-serif font-bold text-text-luxury">
                                {editingBus ? 'Edit Vehicle' : 'Register New Bus'}
                            </h2>
                            <p className="text-text-muted text-sm mt-1">
                                {editingBus ? `Updating registry for ${editingBus.vehicleNumber}` : 'Add a new heritage coach to your digital fleet'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmitBus} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Vehicle Number *</label>
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                        placeholder="TN 01 AB 1234"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-text-luxury placeholder-text-muted/50 focus:outline-none focus:border-brand-gold transition-all"
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Friendly Name</label>
                                    <input
                                        type="text"
                                        value={busName}
                                        onChange={(e) => setBusName(e.target.value)}
                                        placeholder="e.g. Maharaja Express"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-text-luxury placeholder-text-muted/50 focus:outline-none focus:border-brand-gold transition-all"
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Coach Type</label>
                                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                                        {['AC', 'NON-AC'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setBusType(type)}
                                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${busType === type ? 'bg-brand-gold text-bg-deep shadow-lg' : 'text-text-muted hover:text-white'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Seating Capacity</label>
                                    <input
                                        type="number"
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-text-luxury focus:outline-none focus:border-brand-gold transition-all"
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Daily Base Rate (₹)</label>
                                    <input
                                        type="number"
                                        value={baseRate}
                                        onChange={(e) => setBaseRate(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-text-luxury focus:outline-none focus:border-brand-gold transition-all font-bold text-brand-gold"
                                        disabled={submitting}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Operational City</label>
                                    <input
                                        type="text"
                                        value={homeCity}
                                        onChange={(e) => setHomeCity(e.target.value)}
                                        placeholder="e.g. Madurai"
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-text-luxury placeholder-text-muted/50 focus:outline-none focus:border-brand-gold transition-all"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-10">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-4 border border-white/10 text-text-muted rounded-2xl hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] px-4 py-4 bg-brand-gold text-bg-deep font-black rounded-2xl hover:bg-brand-gold-light transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            {editingBus ? 'Update Registry' : 'Confirm Registration'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
