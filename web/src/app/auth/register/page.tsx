"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Lock,
    Building2,
    Phone,
    MapPin,
    ArrowRight,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        companyName: '',
        companyPhone: '',
        companyAddress: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Mocking registration for now as we don't change API
            // In a real scenario, this would call an API
            console.log('Registering user:', formData);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: any) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-deep p-6">
                <div className="glass p-12 rounded-[3rem] max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-serif font-bold">Account Reserved</h1>
                    <p className="text-text-muted">Your heritage partner account has been created. Redirecting to login...</p>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full animate-progress-fast"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-deep p-6 py-20">
            <div className="glass p-8 md:p-12 rounded-[3rem] max-w-2xl w-full border-white/5 shadow-2xl">
                <div className="text-center mb-10">
                    <h4 className="text-tactical text-brand-gold mb-2 uppercase tracking-widest">Join the Fleet</h4>
                    <h1 className="text-4xl font-serif font-bold">Partner Registration</h1>
                    <p className="text-text-muted mt-2">Create your professional heritage transport account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Account Credentials */}
                        <div className="space-y-2">
                            <label className="text-tactical">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                                <input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-tactical">Company Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                                <input
                                    name="companyPhone"
                                    value={formData.companyPhone}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-tactical">Company Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold/50" size={16} />
                            <input
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-tactical">Company Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 text-brand-gold/50" size={16} />
                            <textarea
                                name="companyAddress"
                                value={formData.companyAddress}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-brand-gold outline-none transition-colors resize-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full gold-bg-gradient py-4 rounded-2xl text-bg-deep font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.3)] mt-8"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={20} /> Initialize Account</>}
                    </button>

                    <p className="text-center text-text-muted text-xs mt-6">
                        Already have an account? <Link href="/auth/login" className="text-brand-gold hover:underline">Login here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
