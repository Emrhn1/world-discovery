'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    getPlaceCountsByCountryAsync,
    getPlacesByCountryAndTypeAsync,
    prefetchPlaceByIdAsync,
} from '@/lib/dataAsync';
import type { Country, PlaceType, Place } from '@/types';

interface CountryViewProps {
    country: Country;
    onPlaceSelect: (placeId: string) => void;
    onClose: () => void;
}

interface ExplorationLayer {
    type: PlaceType;
    label: string;
    icon: string;
}

const EXPLORATION_LAYERS: ExplorationLayer[] = [
    { type: 'historical', label: 'Historical', icon: '' },
    { type: 'nature', label: 'Nature', icon: '' },
    { type: 'city', label: 'Cities', icon: '' },
];

/**
 * Country exploration view - Cinematic layer selection
 * Floating UI elements instead of panels
 */
export function CountryView({ country, onPlaceSelect, onClose: _onClose }: CountryViewProps) {
    const [activeLayer, setActiveLayer] = useState<PlaceType | null>(null);
    const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);

    const [activePlaces, setActivePlaces] = useState<Place[]>([]);
    const [layerCounts, setLayerCounts] = useState<Record<PlaceType, number>>({
        historical: 0,
        nature: 0,
        city: 0,
    });

    useEffect(() => {
        let cancelled = false;

        const loadLayerCounts = async () => {
            const counts = await getPlaceCountsByCountryAsync(country.id);
            if (!cancelled) {
                setLayerCounts(counts);
            }
        };

        loadLayerCounts().catch(() => {
            if (!cancelled) {
                setLayerCounts({ historical: 0, nature: 0, city: 0 });
            }
        });

        return () => {
            cancelled = true;
        };
    }, [country.id]);

    useEffect(() => {
        let cancelled = false;

        const loadActivePlaces = async () => {
            if (!activeLayer) {
                setActivePlaces([]);
                return;
            }

            const places = await getPlacesByCountryAndTypeAsync(country.id, activeLayer);
            if (!cancelled) {
                setActivePlaces(places);
                places.forEach((place) => prefetchPlaceByIdAsync(place.id));
            }
        };

        loadActivePlaces().catch(() => {
            if (!cancelled) {
                setActivePlaces([]);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [country.id, activeLayer]);

    // Get available layers
    const availableLayers = useMemo(() => {
        return EXPLORATION_LAYERS.filter(layer => layerCounts[layer.type] > 0);
    }, [layerCounts]);

    return (
        <>
            {/* Country badge - top left, floating */}
            <motion.div
                className="absolute top-20 left-6 z-30"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -30, opacity: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-3 px-5 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-lg">
                    {country.flag && (
                        <span className="text-3xl">{country.flag}</span>
                    )}
                    <div>
                        <h2 className="font-display text-xl text-neutral-900">{country.name}</h2>
                        <p className="text-sm text-neutral-600">{country.teaser}</p>
                    </div>
                </div>
            </motion.div>

            {/* Exploration layers - floating pills, bottom left */}
            <motion.div
                className="absolute bottom-8 left-6 z-30"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ delay: 0.3 }}
            >
                <p className="text-xs uppercase tracking-wider text-neutral-600 mb-3 ml-1">
                    Explore
                </p>
                <div className="flex gap-2">
                    {availableLayers.map((layer, index) => (
                        <motion.button
                            key={layer.type}
                            onClick={() =>
                                setActiveLayer(activeLayer === layer.type ? null : layer.type)
                            }
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 rounded-xl',
                                'backdrop-blur-md border transition-all duration-300',
                                'hover:scale-105 focus:outline-none shadow-sm',
                                activeLayer === layer.type
                                    ? 'bg-neutral-900 border-neutral-900 text-white'
                                    : 'bg-white/90 border-neutral-300 text-neutral-700 hover:border-neutral-400'
                            )}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-lg">{layer.icon}</span>
                            <span className="text-sm font-medium">{layer.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                                {layerCounts[layer.type]}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Place selection - floating cards when layer active */}
            <AnimatePresence>
                {activeLayer && activePlaces.length > 0 && (
                    <motion.div
                        className="absolute bottom-28 left-6 z-30 max-w-md"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                    >
                        <div className="flex flex-wrap gap-2">
                            {activePlaces.map((place, index) => (
                                <motion.button
                                    key={place.id}
                                    onClick={() => onPlaceSelect(place.id)}
                                    onMouseEnter={() => {
                                        setHoveredPlace(place);
                                        prefetchPlaceByIdAsync(place.id);
                                    }}
                                    onMouseLeave={() => setHoveredPlace(null)}
                                    className={cn(
                                        'px-4 py-2 rounded-xl',
                                        'bg-white/90 backdrop-blur-md border border-neutral-300',
                                        'text-neutral-900 text-sm font-medium shadow-sm',
                                        'hover:bg-neutral-100 hover:border-neutral-400',
                                        'transition-all duration-200',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900'
                                    )}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {place.name}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hover preview - appears when hovering place button */}
            <AnimatePresence>
                {hoveredPlace && (
                    <motion.div
                        className="absolute bottom-48 left-6 z-30 max-w-sm"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 10, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="p-4 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10">
                            <p className="text-accent-400 italic text-sm">
                                &ldquo;{hoveredPlace.teaser}&rdquo;
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint text when no layer selected */}
            {!activeLayer && (
                <motion.p
                    className="absolute bottom-28 left-6 z-30 text-sm text-neutral-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    Select a category to discover places
                </motion.p>
            )}
        </>
    );
}

export default CountryView;
