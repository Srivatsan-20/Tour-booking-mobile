"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Building2, MapPin, Phone, Mail,
    Save, Loader2, ChevronLeft, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, updateProfile, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setCompanyName(user.companyName || '');
            setCompanyAddress(user.companyAddress || '');
            setCompanyPhone(user.companyPhone || '');
            setEmail(user.email || '');
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccess(false);

        try {
            await updateProfile({
                companyName,
                companyAddress,
                companyPhone,
                email
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update company profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-brand-gold" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <Link href="/dashboard" className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-8 transition-colors text-sm">
                <ChevronLeft size={16} /> Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Branding Hub</h4>
                    <h1 className="text-4xl font-serif font-bold">Company Profile</h1>
                    <p className="text-text-muted mt-2">Manage your transport agency's public identity and heritage credentials.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-500 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    Verified Partner
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Official Agency Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={18} />
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                        placeholder="e.g. S3T Heritage Travels"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">HQ Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-brand-gold/50" size={18} />
                                    <textarea
                                        value={companyAddress}
                                        onChange={(e) => setCompanyAddress(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors min-h-[120px] resize-none"
                                        placeholder="Full operational address..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Primary Operations Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={18} />
                                        <input
                                            type="tel"
                                            value={companyPhone}
                                            onChange={(e) => setCompanyPhone(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                            placeholder="+91 9XXXX XXXXX"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Digital Correspondance Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                            placeholder="tours@agency.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="gold-bg-gradient flex-grow py-4 rounded-2xl text-bg-deep font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Update Heritage Registry</>}
                            </button>
                            {success && (
                                <div className="text-green-500 font-bold text-sm animate-in fade-in slide-in-from-left-4">
                                    Saved Successfully!
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] border-white/5">
                        <h3 className="text-lg font-serif font-bold mb-4">Account Metadata</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase text-text-muted tracking-widest">Partner Identity</p>
                                <p className="text-brand-gold font-bold">{user.userName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-text-muted tracking-widest">Access Role</p>
                                <p className="text-white">Heritage Partner</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-brand-gold/5 border border-brand-gold/10">
                        <p className="text-xs text-brand-gold/70 leading-relaxed italic">
                            "These details appear on your transport agreements and PDF quotations generated for clients. Ensure accuracy for professional heritage operations."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
