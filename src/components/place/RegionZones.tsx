'use client';

import { useEffect, useRef } from 'react';
import { useMapReactions } from '@/hooks/useMapReactions';
import type { Zone } from '@/types';

interface RegionZonesProps {
    zones: Zone[];
}

/**
 * Renders interactive zones (polygons) on the Leaflet map
 * Uses the shared map instance via context
 */
export function RegionZones({ zones }: RegionZonesProps) {
    const { map } = useMapReactions();
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (!map || typeof window === 'undefined') return;

        // Dynamic import needed for Leaflet in Next.js
        import('leaflet').then(L => {
            // Initialize layer group if needed
            if (!layerGroupRef.current) {
                layerGroupRef.current = L.layerGroup().addTo(map);
            } else {
                layerGroupRef.current.clearLayers();
                if (!map.hasLayer(layerGroupRef.current)) {
                    layerGroupRef.current.addTo(map);
                }
            }

            // Create polygons for each zone
            zones.forEach(zone => {
                const polygon = L.polygon(zone.coords, {
                    color: zone.color || '#efcc4d',
                    weight: 1,
                    fillOpacity: 0.1,
                    dashArray: '5, 5',
                    className: 'region-zone-polygon transition-all duration-300',
                });

                // Add tooltip
                polygon.bindTooltip(zone.name, {
                    permanent: false,
                    direction: 'center',
                    className: 'custom-tooltip zone-tooltip',
                    opacity: 0.9,
                });

                // Hover effects interact with style
                polygon.on('mouseover', function (e) {
                    const layer = e.target as L.Polygon;
                    layer.setStyle({
                        weight: 2,
                        fillOpacity: 0.2,
                        dashArray: undefined, // Solid line on hover
                    });
                });

                polygon.on('mouseout', function (e) {
                    const layer = e.target as L.Polygon;
                    layer.setStyle({
                        weight: 1,
                        fillOpacity: 0.1,
                        dashArray: '5, 5',
                    });
                });

                if (layerGroupRef.current) {
                    layerGroupRef.current.addLayer(polygon);
                }
            });
        });

        // Cleanup on unmount or when zones change
        return () => {
            if (layerGroupRef.current) {
                layerGroupRef.current.clearLayers();
            }
        };
    }, [map, zones]);

    return null; // This component renders directly to the map
}
