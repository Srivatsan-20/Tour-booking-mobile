"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { superAdminApi } from '@/lib/api/services';
import { ShieldAlert, Users, Calendar, CheckCircle, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPartners = async () => {
        try {
            const data = await superAdminApi.getPartners();
            setPartners(data);
        } catch (error) {
            toast.error("Failed to load partners");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'SuperAdmin') {
            loadPartners();
        }
    }, [user]);

    const handleActivate = async (id: number) => {
        try {
            await superAdminApi.activatePartner(id);
            toast.success("Partner subscription activated");
            loadPartners();
        } catch (error) {
            toast.error("Failed to activate subscription");
        }
    };

    if (user?.role !== 'SuperAdmin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-serif text-white">Access Denied</h1>
                <p className="text-text-muted">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-serif text-white mb-8 border-b border-brand-gold/20 pb-4 flex items-center gap-3">
                <ShieldAlert className="text-brand-gold" />
                SaaS Administrator Console
            </h1>

            <div className="bg-bg-card border border-white/5 rounded-2xl p-6">
                <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                    <Users className="text-brand-gold" size={20} />
                    Registered Partners
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-text-muted text-sm font-medium">
                                <th className="py-4 font-bold text-white">Company</th>
                                <th className="py-4">Username / Email</th>
                                <th className="py-4">Phone</th>
                                <th className="py-4">Status</th>
                                <th className="py-4">Valid Until</th>
                                <th className="py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={6} className="py-8 text-center text-text-muted">Loading...</td></tr>
                            ) : partners.length === 0 ? (
                                <tr><td colSpan={6} className="py-8 text-center text-text-muted">No partners found.</td></tr>
                            ) : (
                                partners.map(partner => (
                                    <tr key={partner.id} className="text-sm">
                                        <td className="py-4 font-medium text-white">{partner.companyName}</td>
                                        <td className="py-4 text-text-muted">{partner.username} <br/><span className="text-xs">{partner.email}</span></td>
                                        <td className="py-4 text-text-muted">{partner.companyPhone}</td>
                                        <td className="py-4">
                                            {partner.subscriptionStatus === 'Active' ? (
                                                <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-xs">
                                                    <Ban size={12} /> {partner.subscriptionStatus}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 text-text-muted">
                                            {partner.subscriptionValidUntil ? new Date(partner.subscriptionValidUntil).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-4 text-right">
                                            {partner.subscriptionStatus !== 'Active' && (
                                                <button
                                                    onClick={() => handleActivate(partner.id)}
                                                    className="px-3 py-1 bg-brand-gold text-bg-deep rounded text-xs font-bold hover:bg-yellow-500 transition-colors"
                                                >
                                                    Activate (30 Days)
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
