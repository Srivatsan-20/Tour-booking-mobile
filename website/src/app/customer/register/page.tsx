"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { Bus, User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomerRegisterPage() {
    const { register } = useCustomerAuth();
    const router = useRouter();

    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            router.push('/customer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/30 mb-4">
                        <Bus className="text-brand-gold" size={32} />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-white">Create Account</h1>
                    <p className="text-text-muted text-sm mt-2">Join S3T for a premium travel experience</p>
                </div>

                <div className="glass p-8 rounded-[2rem] border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                <input
                                    type="text"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                <input
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Email (Optional)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-4 gold-bg-gradient rounded-xl text-bg-deep font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                            {loading ? 'Creating Account...' : <>Register Now <ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-text-muted text-sm">
                            Already have an account?{' '}
                            <Link href="/customer/login" className="text-brand-gold font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
