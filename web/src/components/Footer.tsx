import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';

export const Footer = () => {
    return (
        <footer className="w-full bg-bg-deep border-t border-white/5 py-16 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-1">
                    <Logo className="h-10 mb-6" />
                    <p className="text-text-muted text-sm leading-relaxed">
                        Preserving the legacy of luxury transport since 1994. Modern comfort meeting heritage reliability.
                    </p>
                </div>

                <div>
                    <h4 className="text-tactical mb-6">Quick Links</h4>
                    <ul className="space-y-4">
                        <li><Link href="/" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Home</Link></li>
                        <li><Link href="/search" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Search Fleet</Link></li>
                        <li><Link href="/track" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Track Journey</Link></li>
                        <li><Link href="/about" className="text-text-muted hover:text-brand-gold text-sm transition-colors">About Us</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-tactical mb-6">Fleet</h4>
                    <ul className="space-y-4">
                        <li><Link href="/fleet/luxury-bus" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Luxury Buses</Link></li>
                        <li><Link href="/fleet/premium-vans" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Premium Vans</Link></li>
                        <li><Link href="/fleet/classic-sedans" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Classic Sedans</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-tactical mb-6">Partners</h4>
                    <ul className="space-y-4">
                        <li><Link href="/dashboard" className="text-brand-gold hover:text-brand-amber font-bold text-sm transition-colors">Partner Dashboard</Link></li>
                        <li><Link href="/legal/terms" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Terms of Service</Link></li>
                        <li><Link href="/legal/privacy" className="text-text-muted hover:text-brand-gold text-sm transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-text-muted text-xs">© 2026 S3T Heritage Transport Services. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link href="#" className="text-text-muted hover:text-brand-gold transition-colors text-xs">Twitter</Link>
                    <Link href="#" className="text-text-muted hover:text-brand-gold transition-colors text-xs">Instagram</Link>
                    <Link href="#" className="text-text-muted hover:text-brand-gold transition-colors text-xs">LinkedIn</Link>
                </div>
            </div>
        </footer>
    );
};
