import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Terms of Service | Shree Sai Senthil Travels",
    description: "Terms and Conditions of service for bus reservations, charter bookings, payments, and cancellations with Shree Sai Senthil Travels.",
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-bg-deep text-text-luxury py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <span className="text-tactical text-brand-gold mb-2 block uppercase tracking-[0.3em]">Legal Agreement</span>
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-white mb-3">Terms of Service</h1>
                    <p className="text-text-muted text-sm">Shree Sai Senthil Travels &bull; Last updated: September 2026</p>
                </div>

                <div className="space-y-8 bg-bg-card/40 p-8 md:p-12 rounded-[2.5rem] border border-white/5 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">1. Agreement to Terms</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            These Terms of Service constitute a legally binding agreement between you (whether personally or on behalf of an entity, "Customer" or "you") and <strong>Shree Sai Senthil Travels</strong> ("Company", "we", "us", or "our"), concerning your access to and use of our booking services, website, and transport reservations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">2. Booking & Reservation Policy</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li>All bus reservations and charters are subject to fleet availability and written confirmation from Shree Sai Senthil Travels.</li>
                            <li>A reservation is finalized once the required advance payment or online order verification is recorded.</li>
                            <li>Specific coach models or seat layouts requested are adhered to; in extraordinary mechanical eventualities, an equivalent or higher-category replacement coach will be arranged.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">3. Pricing, Tolls & Incidental Expenses</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li><strong>Base Rent:</strong> Covers vehicle rental and standard fuel usage for the specified itinerary.</li>
                            <li><strong>Driver Batta / Support:</strong> Fixed allowance per day as specified on the booking agreement.</li>
                            <li><strong>Toll & State Permit Charges:</strong> Inter-state entry permits, toll booth fees, and commercial parking fees are payable as per actuals unless explicitly bundled into a fixed package contract.</li>
                            <li><strong>Mountain Rent:</strong> Special hill-station surcharge applies to destinations exceeding standard elevation thresholds (e.g., Ooty, Kodaikanal, Coonoor) due to heightened wear and fuel consumption.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">4. Cancellation & Refund Policy</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li>Cancellations requested more than 7 days prior to the journey departure date are eligible for a partial refund subject to administrative fees.</li>
                            <li>Cancellations made within 48 to 72 hours of departure will forfeit the advance deposit paid.</li>
                            <li>Cancellations within 24 hours of scheduled departure or no-shows are non-refundable.</li>
                            <li>In the unlikely event of cancellation by the Company due to force majeure, a 100% refund of advances received will be promptly issued.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">5. Passenger Conduct & Vehicle Care</h2>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-muted">
                            <li>Passengers must adhere to highway safety instructions given by the coach captain / driver.</li>
                            <li>Smoking, alcohol consumption, and carriage of hazardous or unlawful substances inside the vehicles is strictly prohibited under transport laws.</li>
                            <li>Any physical damage caused to the interior, upholstery, entertainment systems, or coach exterior by passenger misconduct will be billed to the booking party.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">6. Limitation of Liability</h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Shree Sai Senthil Travels maintains comprehensive commercial passenger insurance for all coaches. We shall not be held liable for route delays arising from unexpected traffic blockades, severe weather conditions, natural calamities, or government road restrictions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-serif font-bold text-brand-gold mb-3">7. Contact Information</h2>
                        <div className="p-6 bg-brand-gold/10 border border-brand-gold/20 rounded-2xl text-sm space-y-1">
                            <p className="font-bold text-white text-base">Shree Sai Senthil Travels</p>
                            <p className="text-text-muted">TMS Complex, 1st Floor, Chinnasamy Naidu St, Dharmapuri, Tamil Nadu 636701</p>
                            <p className="text-text-muted">Hotlines: +91 94438 49013 / +91 94430 56816</p>
                            <p className="text-text-muted">Email: legal@shreesaisenthiltravels.com</p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center flex justify-center gap-6">
                    <Link href="/" className="text-brand-gold text-xs font-bold uppercase tracking-wider hover:underline">
                        &larr; Return to Home
                    </Link>
                    <span className="text-text-muted">&bull;</span>
                    <Link href="/legal/privacy" className="text-brand-gold text-xs font-bold uppercase tracking-wider hover:underline">
                        Privacy Policy &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}

