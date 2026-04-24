'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnedPlaces } from '@/hooks/useLearnedPlaces';
import { getCountriesAsync } from '@/lib/dataAsync';
import type { Country } from '@/types';

export function PassportBadge() {
    const [isOpen, setIsOpen] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);

    const { getLearnedCount, getLearnedIds, isLoading } = useLearnedPlaces();

    useEffect(() => {
        getCountriesAsync().then(setCountries).catch(() => { });
    }, []);

    const learnedCount = getLearnedCount();
    const learnedIds = getLearnedIds();

    const totalPlaces = countries.reduce((sum, c) => sum + c.places.length, 0);

    const completedCountries = countries.filter(country =>
        country.places.length > 0 &&
        country.places.every(placeId => learnedIds.includes(placeId))
    );

    const visitedCountries = countries.filter(country =>
        country.places.some(placeId => learnedIds.includes(placeId))
    );

    const getCountryProgress = useCallback((country: Country) => {
        const learned = country.places.filter(id => learnedIds.includes(id)).length;
        return { learned, total: country.places.length };
    }, [learnedIds]);

    if (isLoading && learnedCount === 0) return null;

    return (
        <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            {/* Compact badge */}
            <motion.button
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-accent-400/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="text-base">🗺️</span>
                <span className="text-sm font-medium text-accent-300">
                    {learnedCount}
                </span>
                {completedCountries.length > 0 && (
                    <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-accent-400"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.button>

            {/* Expanded panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute right-0 top-full mt-2 w-72 bg-neutral-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        style={{ boxShadow: '0 0 40px rgba(239,204,77,0.08)' }}
                    >
                        {/* Gold accent line */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent-400 to-transparent" />

                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🗺️</span>
                                    <span className="text-sm font-semibold text-white font-display">Explorer Passport</span>
                                </div>
                                {completedCountries.length > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 border border-accent-400/20">
                                        {completedCountries.length} complete
                                    </span>
                                )}
                            </div>

                            {/* Progress stats */}
                            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-accent-400 font-display">{learnedCount}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Places</div>
                                </div>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300"
                                        initial={{ width: 0 }}
                                        animate={{ width: totalPlaces > 0 ? `${(learnedCount / totalPlaces) * 100}%` : '0%' }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-medium text-neutral-400">{totalPlaces}</div>
                                    <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Total</div>
                                </div>
                            </div>

                            {/* Country list */}
                            {visitedCountries.length > 0 ? (
                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {visitedCountries.map(country => {
                                        const { learned, total } = getCountryProgress(country);
                                        const isComplete = learned === total && total > 0;
                                        return (
                                            <div
                                                key={country.id}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                            >
                                                <span className="text-base">{country.flag || '🌍'}</span>
                                                <span className="flex-1 text-xs text-neutral-300 truncate">{country.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-neutral-500">{learned}/{total}</span>
                                                    {isComplete && (
                                                        <motion.span
                                                            className="text-accent-400 text-[10px]"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: 'spring', stiffness: 400 }}
                                                        >
                                                            ★
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-xs text-neutral-600 italic">Start exploring to fill your passport.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PassportBadge;
