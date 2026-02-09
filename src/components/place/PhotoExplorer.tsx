'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDiscoveryTypeConfig } from '@/lib/discoveryTypes';
import { useSound } from '@/hooks/useSound';
import type { Scene, SceneHotspot } from '@/types';

interface PhotoExplorerProps {
    scenes: Scene[];
    onSceneChange?: (index: number) => void;
}

/**
 * Fullscreen photo gallery with per-photo info hotspots.
 * Users browse scenes via pagination/arrows. Each scene has interactive
 * info markers at specific positions on the photo.
 */
export function PhotoExplorer({ scenes, onSceneChange }: PhotoExplorerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const [viewedHotspots, setViewedHotspots] = useState<Set<string>>(new Set());
    const [direction, setDirection] = useState(0); // -1 left, 1 right
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { playUI, isEnabled } = useSound();

    const scene = scenes[currentIndex];
    const totalScenes = scenes.length;

    // Preload adjacent images
    useEffect(() => {
        const preload = (idx: number) => {
            if (idx >= 0 && idx < totalScenes) {
                const img = new Image();
                img.src = scenes[idx].src;
            }
        };
        preload(currentIndex + 1);
        preload(currentIndex - 1);
    }, [currentIndex, scenes, totalScenes]);

    // Scene navigation
    const goToScene = useCallback((idx: number) => {
        if (idx < 0 || idx >= totalScenes || idx === currentIndex) return;
        setDirection(idx > currentIndex ? 1 : -1);
        setActiveHotspot(null);
        setIsImageLoaded(false);
        setCurrentIndex(idx);
        onSceneChange?.(idx);
        if (isEnabled) playUI('click');
    }, [currentIndex, totalScenes, onSceneChange, isEnabled, playUI]);

    const goNext = useCallback(() => goToScene(currentIndex + 1), [goToScene, currentIndex]);
    const goPrev = useCallback(() => goToScene(currentIndex - 1), [goToScene, currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') setActiveHotspot(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [goNext, goPrev]);

    // Handle hotspot click
    const handleHotspotClick = (hotspot: SceneHotspot) => {
        if (activeHotspot === hotspot.id) {
            setActiveHotspot(null);
        } else {
            setActiveHotspot(hotspot.id);
            setViewedHotspots(prev => new Set(prev).add(hotspot.id));
            if (isEnabled) playUI('click');
        }
    };

    // Close info card
    const closeInfoCard = useCallback(() => {
        setActiveHotspot(null);
    }, []);

    // Image load handler
    const handleImageLoad = useCallback(() => {
        setIsImageLoaded(true);
    }, []);

    // Scene counts per scene
    const sceneViewedCount = scene.hotspots.filter(h => viewedHotspots.has(h.id)).length;
    const sceneTotal = scene.hotspots.length;

    // Slide animation variants
    const slideVariants = {
        enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    return (
        <div ref={containerRef} className="absolute inset-0">
            {/* ═══ SCENE IMAGE with crossfade ═══ */}
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                    key={scene.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0"
                >
                    {/* The photo */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                        style={{
                            backgroundImage: `url(${scene.src})`,
                            opacity: isImageLoaded ? 0.7 : 0,
                        }}
                    />
                    {/* Hidden img for load detection */}
                    <img
                        src={scene.src}
                        alt={scene.alt || scene.title}
                        onLoad={handleImageLoad}
                        className="hidden"
                    />

                    {/* Atmospheric overlays (a bit lighter than fog-of-war mode) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-950/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/30 via-transparent to-neutral-950/30" />

                    {/* ═══ SCENE HOTSPOTS ═══ */}
                    {scene.hotspots.map((hotspot) => {
                        const isActive = activeHotspot === hotspot.id;
                        const isViewed = viewedHotspots.has(hotspot.id);
                        const typeConfig = hotspot.type ? getDiscoveryTypeConfig(hotspot.type) : null;
                        const accentColor = typeConfig?.accentHex || '#efcc4d';

                        return (
                            <div key={hotspot.id}>
                                {/* Hotspot marker */}
                                <motion.button
                                    className={cn(
                                        'absolute z-20 flex items-center justify-center',
                                        'w-10 h-10 -ml-5 -mt-5 rounded-full',
                                        'border-2 backdrop-blur-sm transition-all duration-300',
                                        'hover:scale-125 focus:outline-none',
                                        isActive
                                            ? 'scale-110'
                                            : isViewed
                                                ? 'bg-white/10 border-white/20'
                                                : 'bg-black/30 border-white/40'
                                    )}
                                    style={{
                                        top: hotspot.position.top,
                                        left: hotspot.position.left,
                                        borderColor: isActive ? accentColor : isViewed ? 'rgba(255,255,255,0.2)' : undefined,
                                        backgroundColor: isActive ? `${accentColor}30` : undefined,
                                    }}
                                    onClick={() => handleHotspotClick(hotspot)}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.4 + Math.random() * 0.3, type: 'spring', stiffness: 300 }}
                                    whileHover={{ scale: 1.2 }}
                                >
                                    <span className="text-base select-none">
                                        {isViewed && !isActive ? '✓' : hotspot.icon}
                                    </span>

                                    {/* Pulse ring for unviewed hotspots */}
                                    {!isViewed && !isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full border border-white/20"
                                            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 1 }}
                                        />
                                    )}
                                </motion.button>

                                {/* ═══ INFO CARD (appears when hotspot is active) ═══ */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            className="absolute z-30"
                                            style={{
                                                top: hotspot.position.top,
                                                left: hotspot.position.left,
                                            }}
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <div
                                                className={cn(
                                                    'relative mt-6 -ml-[140px] w-[280px]',
                                                    'bg-neutral-900/95 backdrop-blur-xl rounded-2xl',
                                                    'border border-white/10 shadow-2xl',
                                                    'overflow-hidden'
                                                )}
                                                style={{
                                                    borderColor: `${accentColor}30`,
                                                    boxShadow: `0 0 40px ${accentColor}10`,
                                                }}
                                            >
                                                {/* Accent line top */}
                                                <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />

                                                <div className="p-4">
                                                    {/* Arrow pointing up to hotspot */}
                                                    <div
                                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-neutral-900/95 border-l border-t border-white/10"
                                                        style={{ borderColor: `${accentColor}30` }}
                                                    />

                                                    {/* Type badge + close */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        {typeConfig && (
                                                            <span
                                                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                                style={{
                                                                    backgroundColor: `${accentColor}20`,
                                                                    color: accentColor,
                                                                }}
                                                            >
                                                                {typeConfig.icon} {typeConfig.label}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                closeInfoCard();
                                                            }}
                                                            className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white text-xs transition-colors"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>

                                                    {/* Title */}
                                                    <h4 className="text-sm font-semibold text-white mb-1.5 font-display">
                                                        {hotspot.title}
                                                    </h4>

                                                    {/* Description */}
                                                    <p className="text-xs text-neutral-300 leading-relaxed">
                                                        {hotspot.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* ═══ NAVIGATION ARROWS ═══ */}
            {currentIndex > 0 && (
                <motion.button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
                    onClick={goPrev}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </motion.button>
            )}

            {currentIndex < totalScenes - 1 && (
                <motion.button
                    className="absolute right-20 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all"
                    onClick={goNext}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </motion.button>
            )}

            {/* ═══ BOTTOM BAR: Scene info + Pagination + Hotspot progress ═══ */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-16 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent pointer-events-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-end justify-between pointer-events-auto">
                    {/* Scene title + description */}
                    <div className="max-w-md">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scene.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="font-display text-lg text-white mb-1">
                                    {scene.title}
                                </h3>
                                {scene.description && (
                                    <p className="text-sm text-white/50 line-clamp-2">
                                        {scene.description}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Pagination + hotspot counter */}
                    <div className="flex flex-col items-center gap-3">
                        {/* Hotspot progress for current scene */}
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <span>📍</span>
                            <span>{sceneViewedCount}/{sceneTotal}</span>
                        </div>

                        {/* Pagination dots */}
                        <div className="flex items-center gap-2">
                            {scenes.map((s, i) => {
                                const sceneViewed = s.hotspots.every(h => viewedHotspots.has(h.id));
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => goToScene(i)}
                                        className={cn(
                                            'relative rounded-full transition-all duration-300',
                                            i === currentIndex
                                                ? 'w-8 h-2 bg-accent-400'
                                                : sceneViewed
                                                    ? 'w-2 h-2 bg-green-400/60 hover:bg-green-400'
                                                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                        )}
                                        aria-label={`Go to ${s.title}`}
                                    />
                                );
                            })}
                        </div>

                        {/* Scene counter */}
                        <span className="text-xs text-white/30">
                            {currentIndex + 1} / {totalScenes}
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PhotoExplorer;