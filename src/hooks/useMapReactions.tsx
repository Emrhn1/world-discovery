'use client';

import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import type L from 'leaflet';

type CardPhase = 'hook' | 'reveal' | 'interaction';

interface MapReactionsContextType {
    // Map reference
    setMapInstance: (map: L.Map | null) => void;
    map: L.Map | null;

    // Discovery reactions
    focusOnLocation: (coords: [number, number], zoom?: number) => void;
    pulseMarker: (coords: [number, number]) => void;
    dimMap: (dim: boolean) => void;
    onDiscoveryPhase: (phase: CardPhase, coords: [number, number]) => void;

    // State
    isDimmed: boolean;
}

const MapReactionsContext = createContext<MapReactionsContextType | null>(null);

/**
 * Provider for map reaction capabilities
 * Allows discovery cards to trigger map effects
 */
export function MapReactionsProvider({ children }: { children: ReactNode }) {
    const mapRef = useRef<L.Map | null>(null);
    const [mapInstanceData, setMapInstanceData] = useState<L.Map | null>(null);
    const pulseLayerRef = useRef<L.LayerGroup | null>(null);
    const [isDimmed, setIsDimmed] = useState(false);

    const setMapInstance = useCallback((map: L.Map | null) => {
        mapRef.current = map;
        setMapInstanceData(map);

        // Create pulse layer if map exists
        if (map && !pulseLayerRef.current) {
            // Dynamic import to avoid SSR issues
            import('leaflet').then(L => {
                pulseLayerRef.current = L.layerGroup().addTo(map);
            });
        }
    }, []);

    /**
     * Smoothly fly to a location
     */
    const focusOnLocation = useCallback((coords: [number, number], zoom?: number) => {
        if (!mapRef.current) return;

        const map = mapRef.current;
        const currentZoom = map.getZoom();
        const targetZoom = zoom ?? Math.max(currentZoom, 8);

        map.flyTo(coords, targetZoom, {
            duration: 1.2,
            easeLinearity: 0.25,
        });
    }, []);

    /**
     * Create a pulsing effect at coordinates
     */
    const pulseMarker = useCallback(async (coords: [number, number]) => {
        if (!mapRef.current || !pulseLayerRef.current) return;

        const L = await import('leaflet');

        // Clear existing pulses
        pulseLayerRef.current.clearLayers();

        // Create pulse circles
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (!pulseLayerRef.current) return;

                const circle = L.circleMarker(coords, {
                    radius: 20 + i * 15,
                    color: '#efcc4d',
                    fillColor: '#efcc4d',
                    fillOpacity: 0.3 - i * 0.1,
                    weight: 2,
                    opacity: 0.6 - i * 0.2,
                    className: 'pulse-ring',
                });

                pulseLayerRef.current.addLayer(circle);

                // Animate and remove
                let radius = 20 + i * 15;
                const interval = setInterval(() => {
                    radius += 2;
                    circle.setRadius(radius);
                    const opacity = Math.max(0, 0.6 - (radius - 20) / 100);
                    circle.setStyle({ opacity, fillOpacity: opacity * 0.5 });

                    if (radius > 80) {
                        clearInterval(interval);
                        pulseLayerRef.current?.removeLayer(circle);
                    }
                }, 30);
            }, i * 200);
        }
    }, []);

    /**
     * Dim/undim the map
     */
    const dimMap = useCallback((dim: boolean) => {
        setIsDimmed(dim);
    }, []);

    /**
     * React to discovery card phase changes
     */
    const onDiscoveryPhase = useCallback((phase: CardPhase, coords: [number, number]) => {
        switch (phase) {
            case 'hook':
                // Focus and dim on hook
                focusOnLocation(coords, 10);
                dimMap(true);
                pulseMarker(coords);
                break;

            case 'reveal':
                // Subtle zoom on reveal
                if (mapRef.current) {
                    const currentZoom = mapRef.current.getZoom();
                    mapRef.current.flyTo(coords, currentZoom + 0.5, {
                        duration: 0.8,
                        easeLinearity: 0.5,
                    });
                }
                break;

            case 'interaction':
                // Small pulse on interaction ready
                pulseMarker(coords);
                break;
        }
    }, [focusOnLocation, dimMap, pulseMarker]);

    return (
        <MapReactionsContext.Provider
            value={{
                setMapInstance,
                map: mapInstanceData,
                focusOnLocation,
                pulseMarker,
                dimMap,
                onDiscoveryPhase,
                isDimmed,
            }}
        >
            {children}
        </MapReactionsContext.Provider>
    );
}

/**
 * Hook to access map reactions
 */
export function useMapReactions() {
    const context = useContext(MapReactionsContext);

    // Return no-op functions if outside provider
    if (!context) {
        return {
            setMapInstance: () => { },
            map: null,
            focusOnLocation: () => { },
            pulseMarker: () => { },
            dimMap: () => { },
            onDiscoveryPhase: () => { },
            isDimmed: false,
        };
    }

    return context;
}

export default useMapReactions;
