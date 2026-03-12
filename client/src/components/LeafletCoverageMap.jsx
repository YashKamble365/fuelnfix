/**
 * LeafletCoverageMap — Replaces Google Maps CoverageMap.
 * Shows India coverage with city markers and hover tooltips.
 */

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import L from 'leaflet';

const indiaCenter = { lat: 21.0, lng: 78.5 };

const cities = [
    { name: "Nagpur", lat: 21.1458, lng: 79.0882, highlight: true, providers: "45+" },
    { name: "Amravati", lat: 20.9374, lng: 77.7796, highlight: true, providers: "32+" },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, highlight: false, providers: "120+" },
    { name: "Pune", lat: 18.5204, lng: 73.8567, highlight: false, providers: "85+" },
    { name: "Indore", lat: 22.7196, lng: 75.8577, highlight: false, providers: "40+" },
    { name: "Bhopal", lat: 23.2599, lng: 77.4126, highlight: false, providers: "35+" },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867, highlight: false, providers: "75+" },
];

// Custom city markers as Leaflet overlays
const CityMarkers = () => {
    const map = useMap();
    const markersRef = useRef([]);

    useEffect(() => {
        // Clear previous markers
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        cities.forEach(city => {
            const color = city.highlight ? '#10b981' : '#3b82f6';

            // Ripple circle
            const ripple = L.circleMarker([city.lat, city.lng], {
                radius: 16,
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 0,
                className: 'animate-ping-slow'
            }).addTo(map);
            markersRef.current.push(ripple);

            // Main dot
            const dot = L.circleMarker([city.lat, city.lng], {
                radius: 6,
                color: 'white',
                fillColor: color,
                fillOpacity: 1,
                weight: 2,
            }).addTo(map);
            markersRef.current.push(dot);

            // Label
            const labelIcon = L.divIcon({
                className: 'leaflet-city-label',
                html: `<div style="
                    display:inline-block;
                    padding:2px 8px;
                    border-radius:999px;
                    font-size:9px;
                    font-weight:700;
                    white-space:nowrap;
                    box-shadow:0 1px 3px rgba(0,0,0,0.1);
                    ${city.highlight
                        ? 'background:#10b981;color:white;'
                        : 'background:white;color:#374151;border:1px solid #e5e7eb;'
                    }
                ">${city.name}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, -12],
            });
            const label = L.marker([city.lat, city.lng], { icon: labelIcon, interactive: true }).addTo(map);
            markersRef.current.push(label);

            // Tooltip on hover
            label.bindTooltip(
                `<div style="font-weight:700;font-size:12px;margin-bottom:2px;">${city.name}</div><div style="font-size:10px;color:#6b7280;">${city.providers} providers</div>`,
                { direction: 'top', offset: [0, -20], className: 'leaflet-city-tooltip' }
            );
        });

        return () => {
            markersRef.current.forEach(m => map.removeLayer(m));
        };
    }, [map]);

    return null;
};

// Fit map to India bounds on load
const FitIndia = () => {
    const map = useMap();
    useEffect(() => {
        const bounds = L.latLngBounds(
            [6.5, 68.0],   // SW
            [35.5, 97.5]   // NE
        );
        map.fitBounds(bounds, { padding: [10, 10] });
    }, [map]);
    return null;
};

const LeafletCoverageMap = () => {
    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[indiaCenter.lat, indiaCenter.lng]}
                zoom={5}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                zoomControl={false}
                attributionControl={false}
                minZoom={4}
                maxZoom={6}
                className="w-full h-full z-0"
                style={{ background: '#f8fafc', borderRadius: '2.5rem', overflow: 'hidden' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                />
                <FitIndia />
                <CityMarkers />
            </MapContainer>
        </div>
    );
};

export default LeafletCoverageMap;
