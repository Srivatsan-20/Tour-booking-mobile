"use client";

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Bus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Award,
  Phone,
  Mail,
  MapPinned,
  CheckCircle2,
  Users,
  Star,
  ChevronDown,
  Search as SearchIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    fromDate: '',
    toDate: '',
    type: 'AC'
  });

  const router = useRouter();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.from) params.set('from', searchData.from);
    if (searchData.to) params.set('to', searchData.to);
    if (searchData.fromDate) params.set('fromDate', searchData.fromDate);
    if (searchData.toDate) params.set('toDate', searchData.toDate);
    params.set('type', searchData.type);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full bg-bg-deep selection:bg-brand-gold/20">
      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-12">
        {/* Visual Depth Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/20 via-bg-deep/60 to-bg-deep z-10" />
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center brightness-[0.4] scale-105 animate-subtle-zoom" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                <Award size={12} /> Trusted Since 1982
              </span>
              <h1 className="text-6xl md:text-8xl font-serif font-black text-white leading-[0.9] mb-6 text-luxury-shadow">
                Sri Sai <br />
                <span className="gold-gradient">Senthil</span> <br />
                <span className="text-5xl md:text-6xl text-text-muted">Travels.</span>
              </h1>
              <p className="text-xl text-text-muted max-w-lg leading-relaxed font-light">
                For over 40 years, we've defined premium transport. Experience a legacy of luxury, safety, and unwavering reliability across India.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-gold">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Full Insurance</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-tighter">Safe & Secure</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-gold">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">24/7 Support</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-tighter">Always Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK SEARCH WIDGET */}
          <div id="search" className="glass p-8 rounded-[3rem] border-white/10 shadow-3xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">Book Your Journey</h3>
                <p className="text-xs text-text-muted mt-1 uppercase tracking-widest font-bold">Fast & Direct Reservation</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                <SearchIcon size={20} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Departure</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold group-focus-within:scale-110 transition-transform" size={18} />
                    <input
                      type="text"
                      placeholder="Ex: Bangalore"
                      value={searchData.from}
                      onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold focus:bg-white/[0.08] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Destination</label>
                  <div className="relative group">
                    <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold group-focus-within:scale-110 transition-transform" size={18} />
                    <input
                      type="text"
                      placeholder="Ex: Mysore"
                      value={searchData.to}
                      onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold focus:bg-white/[0.08] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Departure Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold" size={18} />
                    <input
                      type="date"
                      value={searchData.fromDate}
                      onChange={(e) => setSearchData({ ...searchData, fromDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Return Date (Optional)</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                      type="date"
                      value={searchData.toDate}
                      onChange={(e) => setSearchData({ ...searchData, toDate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-2">Vehicle Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSearchData({ ...searchData, type: 'AC' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg transition-all ${searchData.type === 'AC' ? 'bg-brand-gold text-bg-deep' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                  >
                    Air Conditioned
                  </button>
                  <button
                    onClick={() => setSearchData({ ...searchData, type: 'NON-AC' })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all ${searchData.type === 'NON-AC' ? 'bg-brand-gold text-bg-deep' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}
                  >
                    Classic (Non-AC)
                  </button>
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full py-5 gold-bg-gradient rounded-[1.5rem] text-bg-deep font-black text-lg uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(197,160,89,0.3)] mt-4"
              >
                Search Availability
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-brand-gold/40" />
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative transform -rotate-3 hover:rotate-0 transition-transform duration-700">
              <div className="absolute inset-0 bg-brand-gold/10 z-10" />
              <img src="https://images.unsplash.com/photo-1494515426402-f19811409c28?q=80&w=1974&auto=format&fit=crop" className="w-full h-full object-cover" />
            </div>
            {/* Legend Element */}
            <div className="absolute -bottom-10 -right-10 glass p-8 rounded-[2rem] border-brand-gold/20 shadow-2xl max-w-xs animate-float">
              <span className="text-5xl font-serif font-black text-brand-gold leading-none">40+</span>
              <p className="text-xs font-bold text-white uppercase tracking-widest mt-2">Years of Excellence in Heritage Transport</p>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <span className="text-tactical text-brand-gold mb-4 block uppercase tracking-[0.4em]">Our Story</span>
              <h2 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight">
                Pioneering Comfort <br />
                Since <span className="text-brand-gold">1982.</span>
              </h2>
            </div>
            <p className="text-lg text-text-muted leading-relaxed font-light">
              Sri Sai Senthil Travels began with a single vision: to provide a journey that is as memorable as the destination. For four decades, we have remained a family-owned legacy, prioritizing the safety and comfort of millions of travelers.
            </p>
            <ul className="space-y-4">
              {[
                'Pioneers in long-distance heritage routes',
                'Award-winning passenger safety protocols',
                'Curated fleet of premium luxury coaches',
                'Expert drivers trained in hospitality and safety'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white/90 font-medium">
                  <CheckCircle2 className="text-brand-gold" size={20} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-32 bg-bg-card/30 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <span className="text-tactical text-brand-gold mb-4 block uppercase tracking-[0.4em]">Expertise</span>
              <h2 className="text-5xl font-serif font-black text-white">Bespoke Travel Solutions.</h2>
            </div>
            <p className="text-text-muted max-w-sm mb-2 font-light">
              From intimate family tours to large scale corporate logistics, we provide seamless execution for every scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Users size={32} />, title: 'Group Tours', desc: 'Customized packages for schools, colleges, and family reunions.' },
              { icon: <MapPin size={32} />, title: 'South India Heritage', desc: 'Specialized routes across historical landmarks and spiritual centers.' },
              { icon: <Award size={32} />, title: 'Corporate Logistics', desc: 'Punctual and professional employee transport solutions.' }
            ].map((service, idx) => (
              <div key={idx} className="glass p-10 rounded-[3rem] border-white/5 hover:border-brand-gold/30 hover:bg-white/[0.03] transition-all group">
                <div className="w-16 h-16 rounded-3xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-8 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h4 className="text-2xl font-serif font-bold text-white mb-4">{service.title}</h4>
                <p className="text-text-muted leading-relaxed font-light">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLEET SHOWCASE */}
      <section id="fleet" className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <span className="text-tactical text-brand-gold mb-4 block uppercase tracking-[0.4em]">The Machines</span>
          <h2 className="text-5xl md:text-6xl font-serif font-black text-white">The Senthil Fleet.</h2>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Ultra AC Coach', cap: '40 Seats', img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069' },
            { name: 'Heritage Sleeper', cap: '36 Berths', img: 'https://images.unsplash.com/photo-1494515426402-f19811409c28?q=80&w=1974' },
            { name: 'Executive Mini', cap: '24 Seats', img: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071' },
            { name: 'Classic Non-AC', cap: '52 Seats', img: 'https://images.unsplash.com/photo-1562620644-65bb471fc552?q=80&w=2070' }
          ].map((bus, idx) => (
            <div key={idx} className="group relative aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10">
              <img src={bus.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
              <div className="absolute bottom-10 left-10 space-y-2">
                <h4 className="text-2xl font-serif font-black text-white">{bus.name}</h4>
                <div className="flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Available Now
                </div>
                <p className="text-xs text-text-muted flex items-center gap-2 pt-2">
                  <Users size={12} /> {bus.cap}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass p-12 md:p-24 rounded-[4rem] border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] -mr-48 -mt-48" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-10">
                <div>
                  <span className="text-tactical text-brand-gold mb-4 block uppercase tracking-[0.4em]">Connect</span>
                  <h2 className="text-5xl md:text-6xl font-serif font-black text-white leading-tight">
                    Let's Plan Your <br />
                    <span className="gold-gradient">Masterpiece</span> Journey.
                  </h2>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-bg-deep transition-all duration-500">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">Corporate Hotline</p>
                      <p className="text-2xl font-serif font-bold text-white">+91 94444 04040</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-bg-deep transition-all duration-500">
                      <Mail size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">General Inquiries</p>
                      <p className="text-2xl font-serif font-bold text-white">hello@senthiltravels.com</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-bg-deep transition-all duration-500">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-text-muted font-black mb-1">Headquarters</p>
                      <p className="text-xl font-serif font-bold text-white max-w-sm">No 4, Heritage Lane, Senthil Towers, Chennai - 600001</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass bg-white/5 p-8 rounded-[2.5rem] border-white/5">
                  <h4 className="text-xl font-serif font-bold text-white mb-6">Request Callback</h4>
                  <div className="space-y-4">
                    <input placeholder="Your Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand-gold outline-none" />
                    <input placeholder="Phone Number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand-gold outline-none" />
                    <textarea placeholder="Briefly describe your travel needs..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand-gold outline-none" />
                    <button className="w-full py-5 gold-bg-gradient rounded-2xl text-bg-deep font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all">Submit Request</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
