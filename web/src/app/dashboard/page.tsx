"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Bus,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Clock,
  AlertCircle,
  PlusCircle,
  Receipt,
  MapPin,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { agreementsApi, busesApi, accountsApi } from '@/lib/api/services';
import { BusResponse, AgreementResponse, AccountsSummaryItem } from '@/types/api';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [agreements, setAgreements] = useState<AgreementResponse[]>([]);
  const [summary, setSummary] = useState<AccountsSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [bList, aList, sList] = await Promise.all([
          busesApi.list(),
          agreementsApi.list(),
          accountsApi.getSummary()
        ]);
        setBuses(bList);
        setAgreements(aList);
        setSummary(sList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [user]);

  const stats = [
    { label: 'Active Fleet', value: buses.filter(b => b.isActive).length, icon: Bus, color: 'text-brand-gold', link: '/fleet' },
    { label: 'Upcoming Tours', value: agreements.filter(a => !a.isCompleted && !a.isCancelled).length, icon: Calendar, color: 'text-blue-400', link: '/bookings' },
    { label: 'Monthly Revenue', value: `₹${summary.reduce((acc, curr) => acc + curr.incomeTotalAmount, 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', link: '/accounts/summary' },
    { label: 'Total Customers', value: summary.length, icon: Users, color: 'text-purple-400', link: '/bookings' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 pb-24">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="text-tactical text-brand-gold mb-2 block uppercase tracking-[0.4em]">Partner HQ</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold">Operational Command</h1>
          <p className="text-text-muted mt-2">Welcome back, <span className="text-white font-bold">{user?.userName}</span>. Here is your fleet performance summary.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/bookings/new" className="gold-bg-gradient px-6 py-3 rounded-xl text-bg-deep font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <PlusCircle size={18} /> New Booking
          </Link>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.link} className="glass p-8 rounded-3xl border-white/5 hover:border-brand-gold/20 transition-all hover:bg-white/[0.03] group">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-text-muted text-xs uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <h3 className="text-3xl font-serif font-bold text-white">{stat.value}</h3>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-serif font-bold">Upcoming Departures</h3>
            <Link href="/bookings" className="text-brand-gold text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {agreements.filter(a => !a.isCompleted && !a.isCancelled).slice(0, 5).map((job) => (
              <div key={job.id} className="glass p-6 rounded-2xl border-white/5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/10">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-brand-gold transition-colors">{job.customerName}</h4>
                    <p className="text-xs text-text-muted flex items-center gap-2 mt-1">
                      <MapPin size={10} /> {job.placesToCover.split(',')[0]} ➔ {job.fromDate}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-gold">₹{job.totalAmount?.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-tighter">{job.busType} Heritage</p>
                </div>
              </div>
            ))}
            {agreements.length === 0 && (
              <div className="glass p-12 rounded-3xl text-center">
                <AlertCircle size={40} className="mx-auto text-text-muted mb-4 opacity-20" />
                <p className="text-text-muted">No upcoming journeys scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR TOOLS */}
        <div className="space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border-white/5">
            <h3 className="text-lg font-serif font-bold mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/fleet" className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-4 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <Bus size={18} />
                </div>
                <span className="text-sm font-bold">Manage Fleet</span>
              </Link>
              <Link href="/fleet/availability" className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-4 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <Calendar size={18} />
                </div>
                <span className="text-sm font-bold">Scheduler</span>
              </Link>
              <Link href="/dashboard/track" className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-4 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <MapPin size={18} />
                </div>
                <span className="text-sm font-bold">Track Journey</span>
              </Link>
              <Link href="/accounts/summary" className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-4 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <Receipt size={18} />
                </div>
                <span className="text-sm font-bold">Revenue Reports</span>
              </Link>
              <Link href="/dashboard/settings" className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-4 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <Settings size={18} />
                </div>
                <span className="text-sm font-bold">System Settings</span>
              </Link>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-brand-gold/20 bg-brand-gold/[0.02]">
            <h3 className="font-serif font-bold text-brand-gold mb-4">Support Agent</h3>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              Running low on available buses for next week? Consider adding a new unit to the registry.
            </p>
            <Link href="/fleet" className="text-xs font-black uppercase tracking-widest text-brand-gold flex items-center gap-2 hover:gap-3 transition-all">
              Review Fleet Health <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
