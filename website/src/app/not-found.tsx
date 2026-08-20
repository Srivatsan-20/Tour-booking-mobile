"use client";

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            <h1 className="text-6xl font-serif font-black text-brand-gold mb-4">404</h1>
            <h2 className="text-2xl font-bold mb-6">Page Not Found</h2>
            <p className="text-text-muted max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                href="/"
                className="px-8 py-3 bg-brand-gold text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(191,149,63,0.2)]"
            >
                Return Home
            </Link>
        </div>
    );
}
