import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | Sri Sai Senthil Travels',
    description: 'Privacy policy and data protection terms for Sri Sai Senthil Travels mobile and web applications.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-bg-deep text-text-primary py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-serif text-brand-gold mb-3">Privacy Policy</h1>
                    <p className="text-text-muted text-sm">Sri Sai Senthil Travels &bull; Last updated: September 2026</p>
                </div>

                <div className="space-y-8 text-text-secondary leading-relaxed bg-bg-card/40 p-8 rounded-2xl border border-white/5">
                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">1. Introduction</h2>
                        <p className="text-sm text-text-muted">
                            Welcome to <strong>Sri Sai Senthil Travels</strong> ("we", "our", or "us"). We provide tour coach booking, charter rental, and fleet management services via our website and mobile apps (including Customer App and Partner App). We respect your privacy and are committed to protecting your personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li><strong>Account & Contact Info:</strong> Name, phone number, email address, and authentication credentials.</li>
                            <li><strong>Reservation & Travel Details:</strong> Travel dates, destination city, passenger count, itinerary places, and vehicle assignments.</li>
                            <li><strong>Partner Fleet Data (Partner App):</strong> Company details, vehicle specifications, and operational contact numbers.</li>
                            <li><strong>Payment Records:</strong> Transaction IDs and confirmation receipts (processed securely via certified gateways).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">3. How We Use Your Data</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li>To fulfill bus reservations, quote generation, and booking agreements.</li>
                            <li>To authenticate user logins and secure your accounts.</li>
                            <li>To send booking status confirmations and customer support updates.</li>
                            <li>To comply with regulatory standards in passenger transport.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">4. Data Security</h2>
                        <p className="text-sm text-text-muted">
                            We utilize encrypted SSL protocols and secure database architectures to safeguard your personal data against unauthorized disclosure or access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">5. Account & Data Deletion</h2>
                        <p className="text-sm text-text-muted">
                            You may request account removal or personal data deletion at any time by contacting us at <strong>support@shreesaisenthiltravels.com</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3">6. Contact Information</h2>
                        <div className="bg-brand-gold/10 border border-brand-gold/20 p-5 rounded-xl text-sm space-y-1">
                            <p className="font-bold text-text-primary">Sri Sai Senthil Travels</p>
                            <p className="text-text-muted">Email: support@shreesaisenthiltravels.com</p>
                            <p className="text-text-muted">Phone: +91 94438 49013</p>
                            <p className="text-text-muted">Website: https://www.shreesaisenthiltravels.com</p>
                        </div>
                    </section>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-brand-gold text-sm hover:underline">
                        &larr; Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
