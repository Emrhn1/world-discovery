'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCountriesAsync, getPlacesByCountryAsync } from '@/lib/dataAsync';
import { cn } from '@/lib/utils';
import { useMapReactions } from '@/hooks/useMapReactions';
import { attachHistoricalRoutes, type HistoricalRoutesHandle } from './historicalRoutes';
import type { Country, Place } from '@/types';

// Dark cinematic map — matches the deep-space landing aesthetic and lets gold routes/ships glow
const TILE_LAYER = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const TILE_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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
    country: '#d4a830',      // Altın sarısı - daha koyu
    historical: '#b8941f',   // Tarihi mekanlar
    nature: '#228b4f',       // Doğa - koyu yeşil
    city: '#3d6ba8',         // Şehir - koyu mavi
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
    const routesHandleRef = useRef<HistoricalRoutesHandle | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [countriesData, setCountriesData] = useState<Country[]>([]);
    const [placesData, setPlacesData] = useState<Place[]>([]);
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

        // Add tile layer with automatic OSM fallback if CARTO CDN fails
        const tileLayer = L.tileLayer(TILE_LAYER, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 18,
            minZoom: 2,
            subdomains: 'abcd',
        }).addTo(map);

        let fellBack = false;
        tileLayer.on('tileerror', () => {
            if (fellBack) return;
            fellBack = true;
            console.warn('[MapContainer] CARTO tiles failed, falling back to OSM');
            map.removeLayer(tileLayer);
            L.tileLayer(TILE_FALLBACK, {
                attribution: TILE_ATTRIBUTION,
                maxZoom: 19,
                minZoom: 2,
            }).addTo(map);
        });

        // Add zoom control to bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Create marker layer group
        markersRef.current = L.layerGroup().addTo(map);

        // Attach animated historical routes + ships (Silk Road, Spice Route, Viking, Columbus, Magellan)
        routesHandleRef.current = attachHistoricalRoutes(map);

        mapInstanceRef.current = map;
        setMapInstance(map);
        setIsLoaded(true);

        return () => {
            routesHandleRef.current?.detach();
            routesHandleRef.current = null;
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

    // Hide historical routes when focused on a country (they clutter at close zoom)
    useEffect(() => {
        routesHandleRef.current?.setVisible(!(selectedCountry && highlightPlaces));
    }, [selectedCountry, highlightPlaces]);

    // Load data (DB/hybrid via repository)
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                if (selectedCountry && highlightPlaces) {
                    const places = await getPlacesByCountryAsync(selectedCountry);
                    if (!cancelled) {
                        setPlacesData(places);
                        setCountriesData([]);
                    }
                } else {
                    const countries = await getCountriesAsync();
                    if (!cancelled) {
                        setCountriesData(countries);
                        setPlacesData([]);
                    }
                }
            } catch {
                if (!cancelled) {
                    setCountriesData([]);
                    setPlacesData([]);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [selectedCountry, highlightPlaces]);

    // Update markers
    useEffect(() => {
        if (!mapInstanceRef.current || !markersRef.current || !isLoaded) return;

        // Clear existing markers
        markersRef.current.clearLayers();

        if (selectedCountry && highlightPlaces) {
            // Show place markers for selected country
            const places = placesData;

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
            const countries = countriesData;

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
    }, [selectedCountry, highlightPlaces, onCountryClick, onPlaceClick, isLoaded, placesData, countriesData]);

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

        /* Historical routes — marching ants dashed line */
        @keyframes historical-route-march {
          to { stroke-dashoffset: -24; }
        }
        .historical-route-line {
          animation: historical-route-march 4s linear infinite;
          transition: opacity .4s;
        }
        .historical-route-line:hover {
          opacity: 0.9 !important;
          stroke-width: 2.5 !important;
        }

        /* Ship / caravan marker — transparent background, gentle bob */
        .historical-ship {
          background: transparent !important;
          border: none !important;
        }
        @keyframes historical-ship-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
      `}</style>
        </div>
    );
}

export default MapContainer;
