import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck, Clock, Users, MapPin, CheckCircle2, ChevronRight, Phone, Mail, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "About Us | Shree Sai Senthil Travels",
    description: "Learn about Shree Sai Senthil Travels — over 63 years of excellence in heritage passenger transport, luxury coaches, and charter solutions across India.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-bg-deep text-text-luxury pb-24 selection:bg-brand-gold/20">
            {/* HERO */}
            <section className="relative py-24 px-6 overflow-hidden border-b border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em]">
                            <Award size={12} /> Established in 1963
                        </span>
                        <h1 className="text-5xl md:text-7xl font-serif font-black text-white leading-tight">
                            Six Decades of <br />
                            <span className="gold-gradient">Heritage Travel.</span>
                        </h1>
                        <p className="text-lg text-text-muted leading-relaxed font-light max-w-xl">
                            Since 1963, <strong>Shree Sai Senthil Travels</strong> has stood as a pioneer in passenger transport across Tamil Nadu and South India. What started as a modest fleet has grown into one of the region's most reputable private charter and tour operators.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <Link
                                href="/search"
                                className="px-8 py-4 gold-bg-gradient rounded-2xl text-bg-deep font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-flex items-center gap-2"
                            >
                                Explore Fleet <ChevronRight size={16} />
                            </Link>
                            <Link
                                href="/#contact"
                                className="px-8 py-4 glass border border-white/10 hover:border-brand-gold/30 rounded-2xl text-white font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Contact HQ
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop"
                                alt="Shree Sai Senthil Travels Heritage Fleet"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-8 -left-8 glass p-6 rounded-3xl border border-brand-gold/30 shadow-2xl max-w-xs hidden sm:block">
                            <p className="text-4xl font-serif font-black text-brand-gold">63+</p>
                            <p className="text-xs text-white uppercase tracking-wider font-bold mt-1">Years of Continuous Heritage Service</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* MILESTONES & CORE VALUES */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-tactical text-brand-gold mb-2 block uppercase tracking-[0.3em]">Our Foundation</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-white">Why Travelers Choose S3T</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white">Uncompromising Safety</h3>
                        <p className="text-text-muted text-sm leading-relaxed font-light">
                            Every coach in our fleet undergoes stringent pre-trip inspections, certified maintenance protocols, and is equipped with digital GPS telemetry and speed governors.
                        </p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Users size={28} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white">Master Drivers</h3>
                        <p className="text-text-muted text-sm leading-relaxed font-light">
                            Our seasoned chauffeurs have decades of experience navigating ghat roads, inter-state highways, and pilgrimage routes with courtesy, hospitality, and care.
                        </p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                            <Award size={28} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-white">Heritage Reliability</h3>
                        <p className="text-text-muted text-sm leading-relaxed font-light">
                            Trusted by educational institutions, corporate enterprises, family wedding parties, and spiritual tour groups for punctual departures and personalized itineraries.
                        </p>
                    </div>
                </div>
            </section>

            {/* COMPANY DETAILS & HEADQUARTERS */}
            <section className="py-16 px-6 max-w-7xl mx-auto">
                <div className="glass p-10 md:p-16 rounded-[3.5rem] border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="text-tactical text-brand-gold mb-3 block uppercase tracking-[0.3em]">Operational Headquarters</span>
                        <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
                            Shree Sai Senthil Travels
                        </h3>
                        <div className="space-y-4 text-sm text-text-muted">
                            <p className="flex items-start gap-3">
                                <MapPin className="text-brand-gold shrink-0 mt-1" size={18} />
                                <span>
                                    TMS Complex, 1st Floor, Chinnasamy Naidu St,<br />
                                    Dharmapuri, Tamil Nadu 636701, India
                                </span>
                            </p>
                            <p className="flex items-center gap-3">
                                <Phone className="text-brand-gold shrink-0" size={18} />
                                <span>+91 94438 49013 / +91 94430 56816</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <Mail className="text-brand-gold shrink-0" size={18} />
                                <span>info@shreesaisenthiltravels.com</span>
                            </p>
                            <p className="flex items-center gap-3">
                                <Globe className="text-brand-gold shrink-0" size={18} />
                                <span>www.shreesaisenthiltravels.com</span>
                            </p>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-brand-gold/5 border border-brand-gold/20 space-y-4">
                        <h4 className="text-xl font-serif font-bold text-brand-gold">Our Heritage Commitment</h4>
                        <p className="text-xs text-text-muted leading-relaxed font-light">
                            "Whether you are planning a one-day excursion to Bangalore, a pilgrimage tour across Madurai and Rameswaram, or a long-distance family celebration, Shree Sai Senthil Travels guarantees punctual, secure, and dignified transportation."
                        </p>
                        <div className="pt-4 border-t border-brand-gold/10">
                            <Link href="/search" className="text-brand-gold font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1">
                                Book Your Coach Online →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

