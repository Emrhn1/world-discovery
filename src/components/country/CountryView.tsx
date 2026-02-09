'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getPlacesByCountryAndType } from '@/lib/data';
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
    { type: 'historical', label: 'Historical', icon: '🏛️' },
    { type: 'nature', label: 'Nature', icon: '🌿' },
    { type: 'city', label: 'Cities', icon: '🏙️' },
];

/**
 * Country exploration view - Cinematic layer selection
 * Floating UI elements instead of panels
 */
export function CountryView({ country, onPlaceSelect, onClose: _onClose }: CountryViewProps) {
    const [activeLayer, setActiveLayer] = useState<PlaceType | null>(null);
    const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);

    // Get places for active layer
    const activePlaces = useMemo<Place[]>(() => {
        if (!activeLayer) return [];
        return getPlacesByCountryAndType(country.id, activeLayer);
    }, [country.id, activeLayer]);

    // Get available layers
    const availableLayers = useMemo(() => {
        return EXPLORATION_LAYERS.filter(layer => {
            const places = getPlacesByCountryAndType(country.id, layer.type);
            return places.length > 0;
        });
    }, [country.id]);

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
                <div className="flex items-center gap-3 px-5 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                    {country.flag && (
                        <span className="text-3xl">{country.flag}</span>
                    )}
                    <div>
                        <h2 className="font-display text-xl text-white">{country.name}</h2>
                        <p className="text-sm text-neutral-400">{country.teaser}</p>
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
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3 ml-1">
                    Explore
                </p>
                <div className="flex gap-2">
                    {availableLayers.map((layer, index) => (
                        <motion.button
                            key={layer.type}
                            onClick={() => setActiveLayer(
                                activeLayer === layer.type ? null : layer.type
                            )}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 rounded-xl',
                                'backdrop-blur-md border transition-all duration-300',
                                'hover:scale-105 focus:outline-none',
                                activeLayer === layer.type
                                    ? 'bg-white/20 border-white/30 text-white'
                                    : 'bg-black/30 border-white/10 text-neutral-300 hover:border-white/20'
                            )}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-lg">{layer.icon}</span>
                            <span className="text-sm font-medium">{layer.label}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                                {getPlacesByCountryAndType(country.id, layer.type).length}
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
                                    onMouseEnter={() => setHoveredPlace(place)}
                                    onMouseLeave={() => setHoveredPlace(null)}
                                    className={cn(
                                        'px-4 py-2 rounded-xl',
                                        'bg-black/50 backdrop-blur-md border border-white/10',
                                        'text-white text-sm font-medium',
                                        'hover:bg-white/10 hover:border-white/20',
                                        'transition-all duration-200',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400'
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
