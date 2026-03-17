"use client";

import React, { useState, useEffect } from 'react';
import {
    Settings,
    Shield,
    MessageSquare,
    FileText,
    Save,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { settingsApi } from '@/lib/api/services';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsApi.list();
            setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async (key: string, value: string, group: string) => {
        setSaving(key);
        try {
            await settingsApi.update({ key, value, group });
            setSuccess(key);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(null);
        }
    };

    const sections = [
        { id: 'branding', title: 'Branding & Identity', icon: Shield, group: 'Branding' },
        { id: 'notifications', title: 'Notifications (Mock)', icon: MessageSquare, group: 'Notification' },
        { id: 'terms', title: 'Booking Terms & Conditions', icon: FileText, group: 'Terms' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold italic">System Configuration</h1>
                        <p className="text-text-muted mt-1">Control your heritage brand and operational parameters</p>
                    </div>
                </div>
            </header>

            <div className="space-y-12">
                {sections.map(section => (
                    <div key={section.id} className="glass p-8 rounded-[2rem] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-3 mb-8">
                            <section.icon size={20} className="text-brand-gold" />
                            <h3 className="text-xl font-serif font-bold">{section.title}</h3>
                        </div>

                        <div className="space-y-6">
                            {/* Static fields for demo if DB is empty, or Map from DB */}
                            {section.id === 'branding' && (
                                <>
                                    <SettingField
                                        label="System Email"
                                        value={settings.find(s => s.key === 'admin_email')?.value || 'heritage@maduraitours.com'}
                                        onSave={(v: string) => handleSave('admin_email', v, section.group)}
                                        isSaving={saving === 'admin_email'}
                                        isSuccess={success === 'admin_email'}
                                    />
                                    <SettingField
                                        label="Support WhatsApp"
                                        value={settings.find(s => s.key === 'support_wa')?.value || '+91 98421 12345'}
                                        onSave={(v: string) => handleSave('support_wa', v, section.group)}
                                        isSaving={saving === 'support_wa'}
                                        isSuccess={success === 'support_wa'}
                                    />
                                </>
                            )}

                            {section.id === 'terms' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Global Terms (Markdown)</label>
                                    <textarea
                                        defaultValue={settings.find(s => s.key === 'global_terms')?.value || '1. Vehicle subject to availability\n2. Toll charges extra\n3. Advance is non-refundable'}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-gold/50 outline-none min-h-[150px]"
                                        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => handleSave('global_terms', e.target.value, section.group)}
                                    />
                                    <div className="flex justify-end pt-2">
                                        {saving === 'global_terms' ? <Loader2 size={16} className="animate-spin text-brand-gold" /> : (success === 'global_terms' ? <CheckCircle2 size={16} className="text-green-500" /> : null)}
                                    </div>
                                </div>
                            )}

                            {section.id === 'notifications' && (
                                <p className="text-xs text-text-muted italic">Notification logic is currently automated through MessageService.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface SettingFieldProps {
    label: string;
    value: string;
    onSave: (v: string) => void;
    isSaving: boolean;
    isSuccess: boolean;
}

function SettingField({ label, value, onSave, isSaving, isSuccess }: SettingFieldProps) {
    const [val, setVal] = useState(value);
    return (
        <div className="flex flex-col md:flex-row md:items-end gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0">
            <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">{label}</label>
                <input
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:border-brand-gold/50 outline-none"
                />
            </div>
            <button
                onClick={() => onSave(val)}
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all min-w-[120px] justify-center"
            >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : (isSuccess ? <CheckCircle2 size={14} className="text-green-500" /> : <><Save size={14} /> Update</>)}
            </button>
        </div>
    );
}
