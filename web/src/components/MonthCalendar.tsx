"use client";

import React from 'react';
import { ChevronLeft, ChevronRight, Bus } from 'lucide-react';
import { ScheduleResponse } from '@/types/api';

interface Props {
    date: Date;
    schedule: ScheduleResponse | null;
    onDateChange: (date: Date) => void;
}

export default function MonthCalendar({ date, schedule, onDateChange }: Props) {
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = date.getFullYear();
    const month = date.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);

    const prevMonth = () => {
        onDateChange(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        onDateChange(new Date(year, month + 1, 1));
    };

    const days = [];
    // Padding for start day
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`pad-${i}`} className="h-32 border-r border-b border-white/5 opacity-20"></div>);
    }

    for (let d = 1; d <= daysCount; d++) {
        const currentDate = new Date(year, month, d);
        const isoDate = currentDate.toISOString().split('T')[0];

        // Find bookings for this day
        const dayBookings = schedule?.agreements.filter(a => {
            const from = a.fromDate.split('T')[0];
            const to = a.toDate.split('T')[0];
            return isoDate >= from && isoDate <= to;
        }) || [];

        const isToday = new Date().toISOString().split('T')[0] === isoDate;

        days.push(
            <div key={d} className={`h-32 border-r border-b border-white/5 p-2 transition-colors hover:bg-white/[0.02] flex flex-col ${isToday ? 'bg-brand-gold/5' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-brand-gold h-6 w-6 rounded-full bg-brand-gold/20 flex items-center justify-center' : 'text-text-muted'}`}>
                        {d}
                    </span>
                    {dayBookings.length > 0 && (
                        <span className="text-[10px] text-brand-gold/70 font-black uppercase">
                            {dayBookings.length} Booked
                        </span>
                    )}
                </div>
                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-grow">
                    {dayBookings.slice(0, 3).map((b, i) => (
                        <div key={i} className="text-[10px] bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/30 truncate" title={b.customerName}>
                            {b.customerName}
                        </div>
                    ))}
                    {dayBookings.length > 3 && (
                        <div className="text-[9px] text-text-muted italic pl-1">
                            + {dayBookings.length - 3} more
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="glass rounded-[2rem] overflow-hidden border-white/5">
            {/* Calendar Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-serif font-bold">{monthNames[month]} {year}</h3>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-widest font-bold">
                    <Bus size={14} className="text-brand-gold" />
                    Fleet Hub View
                </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.01]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7">
                {days}
            </div>
        </div>
    );
}
