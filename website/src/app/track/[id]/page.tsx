"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agreementsApi } from '@/lib/api/services';
import { AgreementResponse } from '@/types/api';
import {
    MapPin,
    Compass,
    TrendingUp,
    Clock,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Activity,
    ChevronRight,
    Bus
} from 'lucide-react';
import Link from 'next/link';

// Coordinate lookup for popular South Indian heritage spots
const CITY_COORDINATES: Record<string, [number, number]> = {
    bangalore: [12.9716, 77.5946],
    mysore: [12.2958, 76.6394],
    ooty: [11.4102, 76.6950],
    coonoor: [11.3530, 76.7950],
    madurai: [9.9252, 78.1198],
    kodaikanal: [10.2381, 77.4892],
    chennai: [13.0827, 80.2707],
    coimbatore: [11.0168, 76.9558],
    coorg: [12.4244, 75.7382],
    wayanad: [11.6854, 76.1320],
    kabini: [11.9680, 76.2715],
    bandipur: [11.6664, 76.6353],
    pondicherry: [11.9416, 79.8083]
};

export default function TrackPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [agreement, setAgreement] = useState<AgreementResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [telemetry, setTelemetry] = useState({
        speed: 45,
        altitude: 820,
        bearing: 'NE',
        locationName: 'En Route',
        eta: '1h 35m'
    });

    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const lineRef = useRef<any>(null);
    const [mapScriptsLoaded, setMapScriptsLoaded] = useState(false);

    // Dynamic Leaflet asset loading
    useEffect(() => {
        // 1. Inject Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // 2. Inject Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setMapScriptsLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.head.removeChild(link);
            document.body.removeChild(script);
        };
    }, []);

    // Load booking detail (supports public tracking without partner login)
    useEffect(() => {
        const loadBooking = async () => {
            try {
                // 1. Try public endpoint first
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const publicRes = await fetch(`${baseUrl}/api/public/agreement/${id}`);
                if (publicRes.ok) {
                    const data = await publicRes.json();
                    setAgreement(data);
                    return;
                }

                // 2. Fallback to authenticated endpoint for partner
                const data = await agreementsApi.getById(id);
                setAgreement(data);
            } catch (err: any) {
                setError(err?.message || 'Journey Reference not found.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadBooking();
        }
    }, [id]);

    // Parse route coordinate path
    const getRoutePath = (): [number, number][] => {
        if (!agreement) return [CITY_COORDINATES.bangalore];

        const defaultStart = CITY_COORDINATES.bangalore;
        const placesStr = agreement.placesToCover || '';
        const parsedPlaces = placesStr
            .split(',')
            .map(p => p.trim().toLowerCase())
            .filter(p => p.length > 0);

        const routeCoords: [number, number][] = [defaultStart];
        parsedPlaces.forEach(p => {
            if (CITY_COORDINATES[p]) {
                routeCoords.push(CITY_COORDINATES[p]);
            }
        });

        // If no matching coordinates, mock a route
        if (routeCoords.length <= 1) {
            routeCoords.push(CITY_COORDINATES.mysore);
            routeCoords.push(CITY_COORDINATES.ooty);
        }

        return routeCoords;
    };

    // Initialize Map and animate route marker
    useEffect(() => {
        if (!mapScriptsLoaded || !agreement || !document.getElementById('tracking-map')) return;

        const L = (window as any).L;
        if (!L) return;

        const routeCoords = getRoutePath();
        const startPoint = routeCoords[0];

        // Init Leaflet map instance
        if (!mapRef.current) {
            mapRef.current = L.map('tracking-map', {
                center: startPoint,
                zoom: 8,
                zoomControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapRef.current);
        }

        // Clear existing map layers
        if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
        if (lineRef.current) mapRef.current.removeLayer(lineRef.current);

        // Draw route polyline
        lineRef.current = L.polyline(routeCoords, {
            color: '#D4AF37',
            weight: 4,
            opacity: 0.8,
            dashArray: '5, 10'
        }).addTo(mapRef.current);

        // Custom Bus Marker
        const busIcon = L.divIcon({
            html: `<div style="background-color: #0b1528; border: 2px solid #D4AF37; color: #D4AF37; padding: 8px; border-radius: 50%; box-shadow: 0 0 15px rgba(212,175,55,0.6); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6M16 6v6M4 18V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9M4 14h16M6 18H4M20 18h-2"/></svg></div>`,
            className: 'custom-bus-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        markerRef.current = L.marker(startPoint, { icon: busIcon }).addTo(mapRef.current);
        mapRef.current.fitBounds(lineRef.current.getBounds(), { padding: [40, 40] });

        // Interpolation animation loop
        let currentSegment = 0;
        let segmentProgress = 0.0;
        const animationSpeed = 0.005; // speed step

        const animateMarker = () => {
            if (currentSegment >= routeCoords.length - 1) {
                // Restart animation loop
                currentSegment = 0;
                segmentProgress = 0.0;
            }

            const start = routeCoords[currentSegment];
            const end = routeCoords[currentSegment + 1];

            const currentLat = start[0] + (end[0] - start[0]) * segmentProgress;
            const currentLng = start[1] + (end[1] - start[1]) * segmentProgress;

            if (markerRef.current) {
                markerRef.current.setLatLng([currentLat, currentLng]);
            }

            // Update telemetry stats dynamically
            const segmentDistLat = Math.abs(end[0] - start[0]);
            const isHilly = segmentDistLat > 0.4;
            setTelemetry({
                speed: Math.floor(40 + Math.random() * 20),
                altitude: Math.floor(isHilly ? 1800 + Math.random() * 400 : 700 + Math.random() * 150),
                bearing: end[0] > start[0] ? 'NE' : 'SW',
                locationName: segmentProgress < 0.5 ? `Leaving area near coordinates [${start[0].toFixed(2)}, ${start[1].toFixed(2)}]` : `Approaching coordinates [${end[0].toFixed(2)}, ${end[1].toFixed(2)}]`,
                eta: `${Math.floor((routeCoords.length - 1 - currentSegment) * 1.5 + (1 - segmentProgress) * 1.5)}h`
            });

            segmentProgress += animationSpeed;
            if (segmentProgress >= 1.0) {
                segmentProgress = 0.0;
                currentSegment++;
            }

            requestAnimationFrame(animateMarker);
        };

        const animationId = requestAnimationFrame(animateMarker);
        return () => cancelAnimationFrame(animationId);
    }, [mapScriptsLoaded, agreement]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-brand-gold animate-spin mb-4" />
                <p className="text-text-muted text-sm uppercase tracking-widest font-bold">Locking Live Telemetry Feed...</p>
            </div>
        );
    }

    if (error || !agreement) {
        return (
            <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 text-center">
                <div className="glass max-w-md w-full p-8 rounded-3xl border-red-500/20 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-white">Journey Not Active</h2>
                        <p className="text-text-muted text-sm leading-relaxed">{error || "Reference ID is invalid."}</p>
                    </div>
                    <Link
                        href="/track"
                        className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-colors inline-block w-full"
                    >
                        Back to Journey Tracking
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-deep text-text-luxury px-6 py-12 max-w-7xl mx-auto space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-text-muted hover:text-brand-gold flex items-center gap-2 mb-3 transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-serif font-bold text-white">Journey Telemetry</h1>
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse">
                            <Activity size={12} /> Live Link Active
                        </span>
                    </div>
                    <p className="text-text-muted text-sm mt-1">Tracking Agreement Code: <span className="text-brand-gold font-serif">{agreement.id}</span></p>
                </div>
                <div className="glass px-6 py-3 rounded-2xl border-white/5 bg-gradient-to-br from-bg-card to-bg-deep shrink-0">
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">Customer Unit</p>
                    <p className="text-sm font-bold text-white mt-0.5">{agreement.customerName}</p>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Compass size={20} className="text-brand-gold" />}
                    label="Current Speed"
                    value={`${telemetry.speed} km/h`}
                    subText={`Bearing: ${telemetry.bearing}`}
                />
                <MetricCard
                    icon={<TrendingUp size={20} className="text-brand-gold" />}
                    label="GPS Elevation"
                    value={`${telemetry.altitude}m`}
                    subText="Altitude Status: Stable"
                />
                <MetricCard
                    icon={<Clock size={20} className="text-brand-gold" />}
                    label="Est. Duration Remaining"
                    value={telemetry.eta}
                    subText="Based on active traffic"
                />
                <MetricCard
                    icon={<MapPin size={20} className="text-brand-gold" />}
                    label="Active Location"
                    value={agreement.placesToCover ? agreement.placesToCover.split(',')[0] : 'South India'}
                    subText={telemetry.locationName}
                />
            </div>

            {/* Main Interactive Map Block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass rounded-[2rem] border-white/5 overflow-hidden min-h-[480px] relative shadow-2xl">
                    <div id="tracking-map" className="absolute inset-0 z-10 bg-bg-deep" />
                </div>

                <div className="glass p-8 rounded-[2rem] border-white/5 flex flex-col justify-between space-y-6 bg-gradient-to-br from-bg-card to-bg-deep shadow-2xl">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-brand-gold uppercase tracking-wider mb-6 border-b border-white/5 pb-3">Journey Checkpoints</h3>
                        <div className="space-y-6">
                            {/* Start Point */}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-5 h-5 rounded-full bg-brand-gold/20 border border-brand-gold/60 flex items-center justify-center text-brand-gold text-[10px] font-black">1</div>
                                    <div className="w-0.5 h-12 bg-white/5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Departure Terminal</h4>
                                    <p className="text-xs text-text-muted mt-0.5">Bangalore, Headquarters</p>
                                    <p className="text-[10px] text-brand-gold/80 mt-1 uppercase tracking-widest font-black">Dep: {agreement.fromDate}</p>
                                </div>
                            </div>

                            {/* En Route Points */}
                            {agreement.placesToCover ? (
                                agreement.placesToCover.split(',').map((place, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted text-[10px] font-black">{index + 2}</div>
                                            {index < agreement.placesToCover!.split(',').length - 1 && <div className="w-0.5 h-12 bg-white/5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{place.trim()}</h4>
                                            <p className="text-xs text-text-muted mt-0.5">Heritage Transit Checkpoint</p>
                                            <p className="text-[10px] text-green-400 mt-1 uppercase tracking-widest font-black">Scheduled Sightseeing</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted text-[10px] font-black">2</div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Destination</h4>
                                        <p className="text-xs text-text-muted mt-0.5">Heritage Tour Route</p>
                                        <p className="text-[10px] text-green-400 mt-1 uppercase tracking-widest font-black">ETA: {agreement.toDate}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-brand-gold/10 text-brand-gold shrink-0">
                                <Bus size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Assigned Transport</p>
                                <p className="text-xs font-black text-white mt-0.5">{agreement.busType} Heritage Coach</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ icon, label, value, subText }: { icon: React.ReactNode; label: string; value: string; subText: string }) {
    return (
        <div className="glass p-6 rounded-3xl border-white/5 bg-gradient-to-br from-bg-card to-bg-deep flex items-start gap-4 shadow-xl">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0">
                {icon}
            </div>
            <div className="space-y-1 overflow-hidden">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black">{label}</p>
                <p className="text-xl font-bold text-white tracking-tight truncate">{value}</p>
                <p className="text-[9px] text-text-muted truncate opacity-85">{subText}</p>
            </div>
        </div>
    );
}
