'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import type { TimelinePhoto } from '@/types';

interface TimelineViewerProps {
    photos: TimelinePhoto[];
    placeName: string;
}

/**
 * Small floating timeline widget showing a place across different eras.
 * Positioned in bottom-left corner. Expands on interaction to reveal
 * larger view with era descriptions.
 */
export function TimelineViewer({ photos, placeName }: TimelineViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const { playUI, isEnabled } = useSound();

    const photo = photos[currentIndex];
    const total = photos.length;

    const goNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % total);
        if (isEnabled) playUI('hover');
    }, [total, isEnabled, playUI]);

    const goPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + total) % total);
        if (isEnabled) playUI('hover');
    }, [total, isEnabled, playUI]);

    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
        if (isEnabled) playUI('click');
    }, [isEnabled, playUI]);

    return (
        <motion.div
            className={cn(
                'absolute z-40 transition-all duration-500',
                isExpanded
                    ? 'bottom-8 left-8'
                    : 'bottom-24 left-6'
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
        >
            <motion.div
                className={cn(
                    'relative overflow-hidden rounded-xl',
                    'bg-black/60 backdrop-blur-md border border-white/10',
                    'cursor-pointer group transition-all duration-500',
                    isExpanded ? 'w-[420px]' : 'w-[220px]'
                )}
                layout
                onClick={toggleExpand}
            >
                {/* Header label */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-accent-400">⏳</span>
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
                            Time Travel
                        </span>
                    </div>
                    <motion.span
                        className="text-[10px] text-white/20"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                    >
                        ▼
                    </motion.span>
                </div>

                {/* Photo area */}
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={photo.era}
                            className={cn(
                                'relative overflow-hidden',
                                isExpanded ? 'h-[240px]' : 'h-[130px]'
                            )}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${photo.src})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                            {/* Sepia/vintage overlay for historical photos */}
                            {photo.year < 1950 && (
                                <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation arrows on photo */}
                    {total > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white text-xs transition-all opacity-0 group-hover:opacity-100"
                            >
                                ‹
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); goNext(); }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white text-xs transition-all opacity-0 group-hover:opacity-100"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Era badge on photo */}
                    <div className="absolute bottom-2 left-2 right-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={photo.era}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-xs font-display font-semibold text-white drop-shadow-lg">
                                        {photo.era}
                                    </p>
                                    <p className="text-[10px] text-white/50">{photo.year} AD</p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Description (only when expanded) */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            className="px-3 py-2.5 border-t border-white/5"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={photo.era}
                                    className="text-xs text-neutral-300 leading-relaxed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {photo.description}
                                </motion.p>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timeline dots */}
                <div className="flex items-center justify-center gap-1.5 py-2 border-t border-white/5">
                    {photos.map((p, i) => (
                        <button
                            key={p.era}
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentIndex(i);
                                if (isEnabled) playUI('hover');
                            }}
                            className={cn(
                                'rounded-full transition-all duration-300',
                                i === currentIndex
                                    ? 'w-5 h-1.5 bg-accent-400'
                                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                            )}
                        />
                    ))}
                    <span className="ml-2 text-[10px] text-white/20">
                        {currentIndex + 1}/{total}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default TimelineViewer;