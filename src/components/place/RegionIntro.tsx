'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisitedRegions } from '@/hooks/useVisitedRegions';
import type { Place } from '@/types';

interface RegionIntroProps {
    place: Place;
    onStart: () => void;
}

/**
 * Floating intro card shown on first visit to a region
 * Auto-fades after interaction or timeout
 */
export function RegionIntro({ place, onStart }: RegionIntroProps) {
    const [isVisible, setIsVisible] = useState(true);
    const { hasVisited, markVisited } = useVisitedRegions();

    // Check if already visited
    useEffect(() => {
        if (hasVisited(place.id)) {
            setIsVisible(false);
            onStart();
        }
    }, [place.id, hasVisited, onStart]);

    const handleStart = useCallback(() => {
        markVisited(place.id);
        setIsVisible(false);
        onStart();
    }, [place.id, markVisited, onStart]);

    // Auto-fade after 8 seconds
    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            handleStart();
        }, 8000);

        return () => clearTimeout(timer);
    }, [isVisible, handleStart]);

    // Type-specific intro text
    const getIntroText = () => {
        switch (place.type) {
            case 'historical':
                return 'Discover hidden stories and ancient secrets waiting to be revealed.';
            case 'nature':
                return 'Explore the wonders of nature through interactive discovery points.';
            case 'city':
                return 'Uncover the soul of this place through guided exploration.';
            default:
                return 'Tap the discovery points to learn more about this place.';
        }
    };

    // Type icon
    const typeIcon = place.type === 'historical' ? '🏛️' :
        place.type === 'nature' ? '🌿' : '🏙️';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleStart}
                    />

                    {/* Intro Card */}
                    <motion.div
                        className="relative max-w-md w-full p-8 bg-neutral-900/95 backdrop-blur-md rounded-2xl border border-white/10 text-center"
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: -10, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {/* Icon */}
                        <motion.div
                            className="text-5xl mb-4"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                        >
                            {typeIcon}
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            className="font-display text-2xl text-white mb-3"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Explore {place.name}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            className="text-neutral-400 mb-6 leading-relaxed"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {getIntroText()}
                        </motion.p>

                        {/* Discovery hint */}
                        <motion.div
                            className="flex items-center justify-center gap-2 text-sm text-neutral-500 mb-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span className="w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xs">
                                ?
                            </span>
                            <span>Tap discovery points to reveal hidden knowledge</span>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            className="px-8 py-3 bg-accent-500 hover:bg-accent-400 text-neutral-900 font-semibold rounded-xl transition-colors"
                            onClick={handleStart}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Start Exploring
                        </motion.button>

                        {/* Skip hint */}
                        <motion.p
                            className="text-xs text-neutral-600 mt-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            Or tap anywhere to begin
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default RegionIntro;
