'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCountries, getPlacesByCountry } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useMapReactions } from '@/hooks/useMapReactions';

// Custom dark map style
const TILE_LAYER = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface MapContainerProps {
    center: [number, number];
    zoom: number;
    onCountryClick?: (countryId: string) => void;
    onPlaceClick?: (placeId: string) => void;
    selectedCountry?: string;
    highlightPlaces?: boolean;
    className?: string;
}

// Create custom marker icons
const createMarkerIcon = (color: string, size: number = 12, isGlowing = false) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div class="relative flex items-center justify-center">
        ${isGlowing ? `
          <div class="absolute w-${size * 2} h-${size * 2} rounded-full animate-ping" 
               style="background: ${color}; opacity: 0.3;"></div>
        ` : ''}
        <div class="w-${size} h-${size} rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
             style="background: ${color}; width: ${size}px; height: ${size}px;
                    box-shadow: 0 0 ${isGlowing ? 15 : 5}px ${color};"></div>
      </div>
    `,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
    });
};

// Marker colors by type
const MARKER_COLORS = {
    country: '#efcc4d',
    historical: '#c9a227',
    nature: '#2d8659',
    city: '#5a7fb8',
};

/**
 * Leaflet Map Container
 * Displays the world map with country and place markers
 */
export function MapContainer({
    center,
    zoom,
    onCountryClick,
    onPlaceClick,
    selectedCountry,
    highlightPlaces = false,
    className,
}: MapContainerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const { setMapInstance, isDimmed } = useMapReactions();

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Create map instance
        const map = L.map(mapRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: false,
            attributionControl: true,
            preferCanvas: true,
        });

        // Add tile layer
        L.tileLayer(TILE_LAYER, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 18,
            minZoom: 2,
        }).addTo(map);

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Create marker layer group
        markersRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        setMapInstance(map);
        setIsLoaded(true);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            setMapInstance(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update map center and zoom
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        mapInstanceRef.current.flyTo(center, zoom, {
            duration: 1.5,
            easeLinearity: 0.25,
        });
    }, [center, zoom]);

    // Update markers
    useEffect(() => {
        if (!mapInstanceRef.current || !markersRef.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.clearLayers();

        if (selectedCountry && highlightPlaces) {
            // Show place markers for selected country
            const places = getPlacesByCountry(selectedCountry);

            places.forEach((place) => {
                const icon = createMarkerIcon(
                    MARKER_COLORS[place.type] || MARKER_COLORS.historical,
                    14,
                    true
                );

                const marker = L.marker(place.coords, { icon })
                    .bindTooltip(place.name, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10],
                        className: 'custom-tooltip',
                    });

                if (onPlaceClick) {
                    marker.on('click', () => onPlaceClick(place.id));
                }

                markersRef.current?.addLayer(marker);
            });
        } else {
            // Show country markers
            const countries = getCountries();

            countries.forEach((country) => {
                const icon = createMarkerIcon(MARKER_COLORS.country, 12, false);

                const marker = L.marker(country.coords, { icon })
                    .bindTooltip(`${country.flag || ''} ${country.name}`, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -10],
                        className: 'custom-tooltip',
                    });

                if (onCountryClick) {
                    marker.on('click', () => onCountryClick(country.id));
                }

                markersRef.current?.addLayer(marker);
            });
        }
    }, [selectedCountry, highlightPlaces, onCountryClick, onPlaceClick, isLoaded]);

    return (
        <div className={cn('w-full h-full relative', className)}>
            <div ref={mapRef} className="w-full h-full" />

            {/* Reaction dimmer */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none transition-opacity duration-1000 z-[400]",
                    isDimmed ? "opacity-100" : "opacity-0"
                )}
            />

            {/* Custom CSS for tooltips */}
            <style jsx global>{`
        .custom-tooltip {
          background: rgba(25, 28, 35, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: #f7f7f8 !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        }
        
        .custom-tooltip::before {
          border-top-color: rgba(25, 28, 35, 0.9) !important;
        }
        
        .leaflet-container {
          background: #0d0f13 !important;
          font-family: 'Inter', sans-serif !important;
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        }
        
        .leaflet-control-zoom a {
          background: rgba(25, 28, 35, 0.9) !important;
          color: #f7f7f8 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: rgba(35, 38, 45, 0.9) !important;
        }
        
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
        </div>
    );
}

export default MapContainer;
