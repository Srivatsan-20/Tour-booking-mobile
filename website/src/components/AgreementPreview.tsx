"use client";

import React from 'react';
import { AgreementResponse } from '@/types/api';
import { X, Printer, Download, Mail, Phone } from 'lucide-react';
import { generateAndDownloadPdf } from '@/lib/pdfGenerator';

interface Props {
    agreement: AgreementResponse;
    onClose: () => void;
    companyInfo: {
        name: string;
        address: string;
        phone: string;
        email: string;
        logoUrl?: string;
        brandColor?: string;
    };
}

export default function AgreementPreview({ agreement, onClose, companyInfo }: Props) {

    const handleDownloadPdf = async () => {
        try {
            await generateAndDownloadPdf(agreement, {
                companyName: companyInfo.name,
                address: companyInfo.address,
                phone: companyInfo.phone,
                email: companyInfo.email,
                logoUrl: companyInfo.logoUrl,
                brandColor: companyInfo.brandColor
            });
        } catch (err) {
            alert("Failed to generate PDF. Please try again.");
        }
    };

    const accentColor = companyInfo.brandColor || '#D4AF37';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white text-gray-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
                {/* Header Controls */}
                <div className="px-8 py-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="font-serif font-bold text-lg">Agreement Preview</h2>
                        <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-widest" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>Draft Authorization</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownloadPdf} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600" title="Print">
                            <Printer size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* PDF-like Content Area */}
                <div className="flex-grow overflow-y-auto p-12 custom-scrollbar bg-gray-50">
                    <div className="bg-white w-full shadow-lg border border-gray-200 rounded-xl max-w-[800px] mx-auto min-h-[1100px] p-12 flex flex-col">
                        {/* Company Header */}
                        <div className="flex justify-between items-start border-b-2 pb-8 mb-10" style={{ borderColor: accentColor }}>
                            <div className="space-y-1">
                                {companyInfo.logoUrl && (
                                    <img src={companyInfo.logoUrl} alt="Logo" className="h-10 object-contain mb-3" />
                                )}
                                <h1 className="text-3xl font-serif font-bold tracking-tight text-gray-900">{companyInfo.name}</h1>
                                <p className="text-gray-500 text-sm max-w-xs">{companyInfo.address}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                    <Phone size={14} style={{ color: accentColor }} />
                                    <span>{companyInfo.phone}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
                                    <Mail size={14} style={{ color: accentColor }} />
                                    <span>{companyInfo.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-serif font-bold uppercase tracking-[0.2em] border-y border-gray-100 py-3 mb-2">Transport Agreement</h2>
                            <p className="text-gray-400 text-xs">Agreement Reference: {(agreement.id ?? '').toUpperCase()}</p>
                        </div>

                        {/* Grid Info */}
                        <div className="grid grid-cols-2 gap-12 mb-12">
                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: accentColor }}>Customer Details</h4>
                                    <div className="space-y-1 border-l-2 border-gray-100 pl-4">
                                        <p className="font-bold text-lg">{agreement.customerName}</p>
                                        <p className="text-gray-600 text-sm">{agreement.phone}</p>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: accentColor }}>Journey Schedule</h4>
                                    <div className="space-y-1 border-l-2 border-gray-100 pl-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">From Date:</span>
                                            <span className="font-bold">{agreement.fromDate}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">To Date:</span>
                                            <span className="font-bold">{agreement.toDate}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: accentColor }}>Vehicle Requirements</h4>
                                    <div className="space-y-1 border-l-2 border-gray-100 pl-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Fleet Class:</span>
                                            <span className="font-bold">{agreement.busType} Heritage</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Requested Units:</span>
                                            <span className="font-bold">{agreement.busCount} Coaches</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Est. Passengers:</span>
                                            <span className="font-bold">{agreement.passengers || 'N/A'}</span>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-[10px] uppercase font-bold mb-2 tracking-widest" style={{ color: accentColor }}>Route Map</h4>
                                    <div className="border-l-2 border-gray-100 pl-4">
                                        <p className="text-sm text-gray-700 leading-relaxed italic">
                                            &quot;{agreement.placesToCover || 'Selected heritage sites as per itinerary.'}&quot;
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Financial Table */}
                        <div className="mb-12">
                            <h4 className="text-[10px] uppercase font-bold mb-4 tracking-widest" style={{ color: accentColor }}>Financial Summary</h4>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-bold text-gray-700">Description</th>
                                            <th className="px-6 py-3 text-right font-bold text-gray-700">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-6 py-4 text-gray-600">Base Contract Rent</td>
                                            <td className="px-6 py-4 text-right font-bold">₹{(agreement.totalAmount || 0).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-gray-600">Mountain Authorization Fee</td>
                                            <td className="px-6 py-4 text-right font-bold">₹{(agreement.mountainRent || 0).toLocaleString()}</td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase text-xs">Total Agreement Value</td>
                                            <td className="px-6 py-4 text-right font-bold text-lg" style={{ color: accentColor }}>₹{((agreement.totalAmount || 0) + (agreement.mountainRent || 0)).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-gray-500 italic">Advance Received</td>
                                            <td className="px-6 py-4 text-right text-green-600 font-bold">- ₹{(agreement.advancePaid || 0).toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-t-2 border-gray-200">
                                            <td className="px-6 py-4 font-bold text-gray-900 uppercase text-xs italic">Outstanding Balance Due</td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900 text-xl underline decoration-4" style={{ textUnderlineOffset: '4px', textDecorationColor: accentColor }}>₹{(agreement.balance || 0).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="mt-auto pt-10 border-t border-gray-100">
                            <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-2">Notice of Terms</h4>
                            <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-tighter">
                                This document serves as a digital authorization of the transportation agreement. Tolls, Parking and State Permit charges are extra as per actuals unless specified. The balance payment must be settled upon tour completion. Inter-state operations are subject to standard RTO regulations.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-gray-100 border-t border-gray-200 flex justify-end gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                    >
                        Back to Manager
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        className="gold-bg-gradient px-8 py-3 rounded-xl text-bg-deep font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                    >
                        <Download size={20} /> Download PDF Official
                    </button>
                </div>
            </div>
        </div>
    );
}
