import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Shree Sai Senthil Travels',
    description: 'Privacy policy, fleet specifications, and data protection terms for Shree Sai Senthil Travels mobile and web applications.',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-bg-deep text-text-primary py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <span className="text-tactical text-brand-gold mb-2 block uppercase tracking-[0.3em]">Compliance & Security</span>
                    <h1 className="text-3xl md:text-5xl font-serif text-brand-gold mb-3 font-black">Privacy Policy & Fleet Operations</h1>
                    <p className="text-text-muted text-sm">Shree Sai Senthil Travels &bull; Last updated: September 2026</p>
                </div>

                <div className="space-y-8 text-text-secondary leading-relaxed bg-bg-card/40 p-8 md:p-12 rounded-[2.5rem] border border-white/5">
                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">1. Introduction</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Welcome to <strong>Shree Sai Senthil Travels</strong> ("we", "our", or "us"). Operating with an unbroken heritage since 1963, we provide luxury tour coaches, corporate charters, pilgrimage logistics, and fleet management services via our website and companion applications (including the Customer App, Partner App, and Driver Log Portal). We are committed to safeguarding your privacy and ensuring transparent information handling.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">2. Information We Collect</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li><strong>Account & Contact Info:</strong> Customer name, primary contact phone number, email address, and encrypted credentials.</li>
                            <li><strong>Reservation & Itinerary Details:</strong> Departure and return dates, pickup and destination cities, passenger counts, requested route waypoints, and assigned vehicle numbers.</li>
                            <li><strong>Partner Fleet Registry:</strong> Partner operator company names, depot addresses, vehicle registration numbers, seating capacities, and base daily rates.</li>
                            <li><strong>Driver Operational Data:</strong> Odometer readings, refueling locations, liters filled, toll slips, and vehicle maintenance entries.</li>
                            <li><strong>Payment Records:</strong> Razorpay and UPI transaction identifiers, payment timestamps, and confirmation receipts (processed securely via PCI-DSS certified payment gateways).</li>
                        </ul>
                    </section>

                    {/* NEW DETAILED FLEET SPECIFICATIONS & TELEMETRY SECTION */}
                    <section className="p-6 rounded-2xl bg-brand-gold/5 border border-brand-gold/20 space-y-4">
                        <h2 className="text-xl font-serif text-brand-gold mb-2 font-bold">3. Detailed Fleet Information & Telemetry Tracking</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Shree Sai Senthil Travels operates a specialized fleet of heritage and modern commercial coaches across South India. In accordance with passenger safety standards and transport regulations, our vehicles and telemetry data are managed as follows:
                        </p>
                        <div className="space-y-3 pt-2">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-1">Fleet Categories & Coach Specifications</h3>
                                <ul className="list-disc pl-5 text-xs text-text-muted space-y-1">
                                    <li><strong>Ultra Luxury AC Coaches:</strong> 40 to 49 passenger push-back seating, air suspension, climate-controlled interiors, and onboard multimedia.</li>
                                    <li><strong>Heritage Sleeper Coaches:</strong> 30 to 36 berth configurations for overnight inter-city journeys with individual reading lights and charging ports.</li>
                                    <li><strong>Executive Mini-Coaches:</strong> 20 to 26 capacity for intimate family reunions, corporate site inspections, and airport shuttles.</li>
                                    <li><strong>Classic Non-AC Coaches:</strong> 50 to 54 capacity high-durability transit coaches for school excursions, rural heritage tours, and large group logistics.</li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-1">Satellite Telemetry & Real-Time Tracking</h3>
                                <ul className="list-disc pl-5 text-xs text-text-muted space-y-1">
                                    <li><strong>Live GPS Telemetry:</strong> Active vehicles transmit anonymized coordinate telemetry, altitude metrics, and ground speed to provide passengers and emergency coordinators with live journey tracking.</li>
                                    <li><strong>Speed Governor Compliance:</strong> All coaches are equipped with ARAI-certified electronic speed limiters compliant with Central Motor Vehicle Rules.</li>
                                    <li><strong>Emergency & Insurance Standards:</strong> Every deployed bus is backed by comprehensive commercial passenger liability insurance, emergency exit protocols, and first-aid response kits.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">4. How We Use Your Data</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li>To fulfill bus reservations, quote generation, and official booking agreements.</li>
                            <li>To authenticate user logins and protect customer dashboards.</li>
                            <li>To send automated booking confirmations and PDF download links via SMS, WhatsApp, or email.</li>
                            <li>To transmit real-time journey checkpoints to tracking viewers.</li>
                            <li>To comply with regulatory standards in passenger transport, tax guidelines, and transport commissioner audits.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">5. Data Security</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            We utilize encrypted SSL/TLS protocols and secure database architectures to safeguard your personal data against unauthorized disclosure or access. Sensitive payment credentials never touch our web servers and are managed directly by certified payment gateways.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">6. Account & Data Deletion</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            You may request account removal or personal data deletion at any time by contacting us at <strong>support@shreesaisenthiltravels.com</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif text-brand-gold mb-3 font-bold">7. Contact Information</h2>
                        <div className="bg-brand-gold/10 border border-brand-gold/20 p-6 rounded-2xl text-sm space-y-2">
                            <p className="font-bold text-white text-base">Shree Sai Senthil Travels</p>
                            <p className="text-text-muted">Headquarters: TMS Complex, 1st Floor, Chinnasamy Naidu St, Dharmapuri, Tamil Nadu 636701</p>
                            <p className="text-text-muted">Corporate Hotlines: +91 94438 49013 / +91 94430 56816</p>
                            <p className="text-text-muted">Email: support@shreesaisenthiltravels.com</p>
                            <p className="text-text-muted">Website: https://www.shreesaisenthiltravels.com</p>
                        </div>
                    </section>
                </div>

                <div className="mt-8 text-center flex justify-center gap-6">
                    <Link href="/" className="text-brand-gold text-xs font-bold uppercase tracking-wider hover:underline">
                        &larr; Return to Home
                    </Link>
                    <span className="text-text-muted">&bull;</span>
                    <Link href="/legal/terms" className="text-brand-gold text-xs font-bold uppercase tracking-wider hover:underline">
                        Terms of Service &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
