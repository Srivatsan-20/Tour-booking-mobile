"use client";

import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { LogOut, User, Menu, X, LayoutDashboard, PlusCircle, Calendar, ListChecks, TrendingUp, History } from 'lucide-react';

interface NavLink {
    name: string;
    href: string;
    icon?: any;
}

export const Navbar = () => {
    const pathname = usePathname();
    const { user, logout: partnerLogout } = useAuth();
    const { customer, logout: customerLogout } = useCustomerAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Links for Unauthenticated / Public Users
    const publicLinks = [
        { name: 'Home', href: '/', icon: undefined },
        { name: 'About Us', href: '/#about', icon: undefined },
        { name: 'Services', href: '/#services', icon: undefined },
        { name: 'Fleet', href: '/#fleet', icon: undefined },
        { name: 'Contact', href: '/#contact', icon: undefined },
    ];

    // Links for Authenticated / Partner Users
    const partnerLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Add Bus', href: '/fleet', icon: PlusCircle }, // Assuming fleet page handles adding or shows fleet
        { name: 'Availability', href: '/fleet/availability', icon: Calendar },
        { name: 'Bookings', href: '/bookings', icon: ListChecks },
        { name: 'Cancelled', href: '/tours/cancelled', icon: X },
        { name: 'Reports', href: '/accounts/summary', icon: TrendingUp },
    ];

    // Links for Authenticated / Customer Users
    const customerLinks = [
        { name: 'Home', href: '/', icon: undefined },
        { name: 'My Dashboard', href: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'Booking History', href: '/customer/dashboard', icon: History },
        { name: 'Fleet', href: '/#fleet', icon: undefined },
    ];

    const currentLinks = user ? partnerLinks : (customer ? customerLinks : publicLinks);

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
                    <Logo className="h-14" />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {currentLinks.map((link: NavLink) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`px-4 py-2 text-[13px] font-medium transition-all hover:bg-white/5 rounded-lg flex items-center gap-2 group ${pathname === link.href ? 'text-brand-gold' : 'text-text-muted hover:text-white'
                                }`}
                        >
                            {(user || customer) && link.icon && <link.icon size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />}
                            {link.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-2 md:gap-6">
                            <Link
                                href="/profile"
                                className="hidden md:flex items-center gap-2 text-xs font-bold text-brand-gold hover:text-white transition-all bg-brand-gold/10 px-4 py-2 rounded-full border border-brand-gold/20"
                            >
                                <User size={14} />
                                {user.userName}
                            </Link>
                            <button
                                onClick={partnerLogout}
                                className="text-text-muted hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                title="Partner Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : customer ? (
                        <div className="flex items-center gap-2 md:gap-6">
                            <Link
                                href="/customer/dashboard"
                                className="hidden md:flex items-center gap-2 text-xs font-bold text-brand-gold hover:text-white transition-all bg-brand-gold/10 px-4 py-2 rounded-full border border-brand-gold/20"
                            >
                                <User size={14} />
                                {customer.name}
                            </Link>
                            <button
                                onClick={customerLogout}
                                className="text-text-muted hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                title="Customer Log Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-4">
                            <Link href="/customer/login" className="text-xs font-bold text-text-muted hover:text-white transition-colors px-4 py-2">
                                Customer Sign In
                            </Link>
                            <Link
                                href="/customer/register"
                                className="px-5 py-2.5 rounded-full border border-brand-gold/20 text-brand-gold text-[11px] font-black uppercase tracking-wider hover:bg-brand-gold/10 transition-all shadow-lg hidden sm:block"
                            >
                                Register
                            </Link>
                            <Link
                                href="/#search"
                                className="px-5 py-2.5 rounded-full gold-bg-gradient text-bg-deep text-[11px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                Book Online
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Trigger */}
                    <button
                        className="md:hidden p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-bg-deep/95 backdrop-blur-xl border-b border-white/10 py-6 px-6 animate-in slide-in-from-top-4">
                    <div className="flex flex-col gap-4">
                        {currentLinks.map((link: NavLink) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-lg font-serif transition-colors ${pathname === link.href ? 'text-brand-gold font-bold' : 'text-text-muted'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user && (
                            <Link
                                href="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-2 text-brand-gold text-lg font-serif border-t border-white/5 pt-4"
                            >
                                <User size={20} />
                                Profile Management
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};
