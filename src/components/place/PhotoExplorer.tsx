'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDiscoveryTypeConfig } from '@/lib/discoveryTypes';
import { useSound } from '@/hooks/useSound';
import type { Scene, SceneHotspot, Discovery } from '@/types';

interface PhotoExplorerProps {
    scenes: Scene[];
    discoveries?: Discovery[];
    discoveredIndexes?: Set<number>;
    revealedHiddenIndexes?: Set<number>;
    onDiscoveryOpen?: (index: number) => void;
    onRevealHidden?: (index: number) => void;
    onSceneChange?: (index: number) => void;
}

export function PhotoExplorer({
    scenes,
    discoveries = [],
    discoveredIndexes = new Set(),
    revealedHiddenIndexes = new Set(),
    onDiscoveryOpen,
    onRevealHidden,
    onSceneChange,
}: PhotoExplorerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const [viewedHotspots, setViewedHotspots] = useState<Set<string>>(new Set());
    const [direction, setDirection] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [resolvedImageSrc, setResolvedImageSrc] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoveredHiddenIndexRef = useRef<number | null>(null);

    const { playUI, isEnabled } = useSound();

    const scene = scenes[currentIndex];
    const totalScenes = scenes.length;
    const sceneMediaType = detectMediaType(scene);
    const isEmbedVideo =
        sceneMediaType === 'video' &&
        /(youtube\.com|youtu\.be|vimeo\.com)/i.test(scene.src);

    useEffect(() => {
        if (sceneMediaType !== 'image') return;
        setResolvedImageSrc(scene.src);
        setIsImageLoaded(false);
    }, [scene.id, scene.src, sceneMediaType]);

    useEffect(() => {
        const preload = (idx: number) => {
            if (idx >= 0 && idx < totalScenes) {
                const target = scenes[idx];
                if (detectMediaType(target) === 'image') {
                    const img = new Image();
                    img.src = target.src;
                }
            }
        };
        preload(currentIndex + 1);
        preload(currentIndex - 1);
    }, [currentIndex, scenes, totalScenes]);

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

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') setActiveHotspot(null);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [goNext, goPrev]);

    const handleHotspotClick = (hotspot: SceneHotspot) => {
        if (activeHotspot === hotspot.id) {
            setActiveHotspot(null);
        } else {
            setActiveHotspot(hotspot.id);
            setViewedHotspots(prev => new Set(prev).add(hotspot.id));
            if (isEnabled) playUI('click');
        }
    };

    const closeInfoCard = useCallback(() => setActiveHotspot(null), []);

    const handleImageLoad = useCallback(() => setIsImageLoaded(true), []);

    const handleImageError = useCallback(() => {
        const fallback = `https://picsum.photos/seed/${encodeURIComponent(scene.id)}-fallback/1600/900`;
        if (resolvedImageSrc !== fallback) {
            setResolvedImageSrc(fallback);
            setIsImageLoaded(false);
            return;
        }
        setIsImageLoaded(true);
    }, [resolvedImageSrc, scene.id]);

    // ═══ POINTER TRACKING FOR LONG-HOVER HIDDEN DISCOVERIES ═══
    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (!discoveries.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pctX = ((e.clientX - rect.left) / rect.width) * 100;
        const pctY = ((e.clientY - rect.top) / rect.height) * 100;

        let nearIndex = -1;
        for (let i = 0; i < discoveries.length; i++) {
            const disc = discoveries[i];
            if (!disc.isHidden || disc.hiddenTrigger !== 'long-hover') continue;
            if (revealedHiddenIndexes.has(i)) continue;
            if (!disc.position) continue;
            const top = parseFloat(disc.position.top);
            const left = parseFloat(disc.position.left);
            const dist = Math.sqrt((pctX - left) ** 2 + (pctY - top) ** 2);
            if (dist < 9) { nearIndex = i; break; }
        }

        if (nearIndex !== -1) {
            if (hoveredHiddenIndexRef.current !== nearIndex) {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                hoveredHiddenIndexRef.current = nearIndex;
                hoverTimerRef.current = setTimeout(() => {
                    onRevealHidden?.(nearIndex);
                    if (isEnabled) playUI('success');
                    hoveredHiddenIndexRef.current = null;
                }, 1200);
            }
        } else {
            if (hoverTimerRef.current) {
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = null;
            }
            hoveredHiddenIndexRef.current = null;
        }
    }, [discoveries, revealedHiddenIndexes, onRevealHidden, isEnabled, playUI]);

    const handlePointerLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        hoveredHiddenIndexRef.current = null;
    }, []);

    // ═══ DOUBLE-CLICK DETECTION FOR HIDDEN DISCOVERIES ═══
    const handleSceneDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!discoveries.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pctX = ((e.clientX - rect.left) / rect.width) * 100;
        const pctY = ((e.clientY - rect.top) / rect.height) * 100;

        for (let i = 0; i < discoveries.length; i++) {
            const disc = discoveries[i];
            if (!disc.isHidden || disc.hiddenTrigger !== 'double-click') continue;
            if (revealedHiddenIndexes.has(i)) continue;
            if (!disc.position) continue;
            const top = parseFloat(disc.position.top);
            const left = parseFloat(disc.position.left);
            const dist = Math.sqrt((pctX - left) ** 2 + (pctY - top) ** 2);
            if (dist < 9) {
                onRevealHidden?.(i);
                if (isEnabled) playUI('success');
                break;
            }
        }
    }, [discoveries, revealedHiddenIndexes, onRevealHidden, isEnabled, playUI]);

    // Cleanup hover timer on unmount
    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    const sceneViewedCount = scene.hotspots.filter(h => viewedHotspots.has(h.id)).length;
    const sceneTotal = scene.hotspots.length;

    const slideVariants = {
        enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    return (
        <div ref={containerRef} className="absolute inset-0">
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
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    onDoubleClick={handleSceneDoubleClick}
                >
                    {/* The photo */}
                    {sceneMediaType === 'image' ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                                style={{
                                    backgroundImage: `url(${resolvedImageSrc})`,
                                    opacity: isImageLoaded ? 0.7 : 0,
                                }}
                            />
                            <img
                                src={resolvedImageSrc}
                                alt={scene.alt || scene.title}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                className="hidden"
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: isImageLoaded ? 0.7 : 0 }}>
                            {isEmbedVideo ? (
                                <iframe
                                    src={toEmbedUrl(scene.src)}
                                    title={scene.alt || scene.title}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                    onLoad={handleImageLoad}
                                />
                            ) : (
                                <video
                                    className="w-full h-full object-cover"
                                    src={scene.src}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    controls
                                    onLoadedData={handleImageLoad}
                                />
                            )}
                        </div>
                    )}

                    {/* Atmospheric overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-950/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/30 via-transparent to-neutral-950/30" />

                    {/* ═══ SCENE HOTSPOTS (info pins) ═══ */}
                    {scene.hotspots.map((hotspot) => {
                        const isActive = activeHotspot === hotspot.id;
                        const isViewed = viewedHotspots.has(hotspot.id);
                        const typeConfig = hotspot.type ? getDiscoveryTypeConfig(hotspot.type) : null;
                        const accentColor = typeConfig?.accentHex || '#efcc4d';

                        return (
                            <div key={hotspot.id}>
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
                                    {!isViewed && !isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full border border-white/20"
                                            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 1 }}
                                        />
                                    )}
                                </motion.button>

                                {/* Info card */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            className="absolute z-30"
                                            style={{ top: hotspot.position.top, left: hotspot.position.left }}
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <div
                                                className={cn(
                                                    'relative mt-6 -ml-[140px] w-[280px]',
                                                    'bg-neutral-900/95 backdrop-blur-xl rounded-2xl',
                                                    'border border-white/10 shadow-2xl overflow-hidden'
                                                )}
                                                style={{
                                                    borderColor: `${accentColor}30`,
                                                    boxShadow: `0 0 40px ${accentColor}10`,
                                                }}
                                            >
                                                <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }} />
                                                <div className="p-4">
                                                    <div
                                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-neutral-900/95 border-l border-t border-white/10"
                                                        style={{ borderColor: `${accentColor}30` }}
                                                    />
                                                    <div className="flex items-center justify-between mb-2">
                                                        {typeConfig && (
                                                            <span
                                                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                            >
                                                                {typeConfig.icon} {typeConfig.label}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); closeInfoCard(); }}
                                                            className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white text-xs transition-colors"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-white mb-1.5 font-display">{hotspot.title}</h4>
                                                    <p className="text-xs text-neutral-300 leading-relaxed">{hotspot.description}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* ═══ DISCOVERY LAYER (emotional narrative hooks) ═══ */}
                    {discoveries.map((disc, discIndex) => {
                        if (!disc.position) return null;

                        const isRevealed = revealedHiddenIndexes.has(discIndex);
                        const isDiscovered = discoveredIndexes.has(discIndex);
                        const isVisible = !disc.isHidden || isRevealed;

                        // Subtle long-hover hint: barely-visible pulsing dot
                        if (disc.isHidden && !isRevealed && disc.hiddenTrigger === 'long-hover') {
                            return (
                                <div
                                    key={`hint-lh-${discIndex}`}
                                    className="absolute pointer-events-none z-20"
                                    style={{ top: disc.position.top, left: disc.position.left }}
                                >
                                    <motion.div
                                        className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-purple-400/15 border border-purple-400/10"
                                        animate={{ scale: [1, 1.6, 1], opacity: [0.08, 0.18, 0.08] }}
                                        transition={{ duration: 3.5, repeat: Infinity, delay: discIndex * 0.8 }}
                                    />
                                </div>
                            );
                        }

                        // Double-click hint: invisible but detectable area + faint pulse
                        if (disc.isHidden && !isRevealed && disc.hiddenTrigger === 'double-click') {
                            return (
                                <div
                                    key={`hint-dc-${discIndex}`}
                                    className="absolute pointer-events-none z-20"
                                    style={{ top: disc.position.top, left: disc.position.left }}
                                >
                                    <motion.div
                                        className="w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border border-purple-400/20"
                                        animate={{ opacity: [0, 0.15, 0], scale: [0.8, 1.2, 0.8] }}
                                        transition={{ duration: 5, repeat: Infinity, delay: discIndex * 1.2 + 3 }}
                                    />
                                </div>
                            );
                        }

                        // Chain not ready: invisible
                        if (disc.isHidden && !isRevealed && disc.hiddenTrigger === 'chain') {
                            return null;
                        }

                        if (!isVisible) return null;

                        // Visible discovery hotspot
                        return (
                            <div
                                key={`disc-${discIndex}`}
                                className="absolute z-[25]"
                                style={{ top: disc.position.top, left: disc.position.left }}
                            >
                                <motion.button
                                    className={cn(
                                        'relative flex items-center justify-center',
                                        'w-9 h-9 -ml-[18px] -mt-[18px] rounded-full border-2 backdrop-blur-sm',
                                        'focus:outline-none transition-colors duration-300',
                                        isDiscovered
                                            ? disc.isHidden
                                                ? 'bg-purple-500/30 border-purple-400'
                                                : 'bg-accent-500/30 border-accent-400'
                                            : disc.isHidden
                                                ? 'bg-purple-500/20 border-purple-400/70 hover:bg-purple-500/30'
                                                : disc.isHero
                                                    ? 'bg-accent-500/25 border-accent-400/80 hover:bg-accent-500/35'
                                                    : 'bg-accent-500/15 border-accent-400/50 hover:bg-accent-500/25'
                                    )}
                                    onClick={() => onDiscoveryOpen?.(discIndex)}
                                    initial={isRevealed && disc.isHidden
                                        ? { scale: 0, opacity: 0 }
                                        : { scale: 0, opacity: 0 }
                                    }
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={isRevealed && disc.isHidden
                                        ? { type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }
                                        : { delay: 0.5 + discIndex * 0.12, type: 'spring', stiffness: 300, damping: 25 }
                                    }
                                    whileHover={{ scale: 1.25 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="text-sm select-none">
                                        {isDiscovered ? '✓' : disc.isHidden ? '🔮' : disc.isHero ? '★' : '🔍'}
                                    </span>

                                    {/* Pulse ring for undiscovered */}
                                    {!isDiscovered && (
                                        <motion.div
                                            className={cn(
                                                'absolute inset-0 rounded-full border',
                                                disc.isHidden ? 'border-purple-400/40' : 'border-accent-400/40'
                                            )}
                                            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                                            transition={{ duration: 2.2, repeat: Infinity, delay: discIndex * 0.6 }}
                                        />
                                    )}

                                    {/* Chain/hidden glow on reveal */}
                                    {isRevealed && disc.isHidden && !isDiscovered && (
                                        <motion.div
                                            className="absolute inset-0 rounded-full bg-purple-400/20"
                                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                    )}
                                </motion.button>

                                {/* Label tooltip */}
                                {!isDiscovered && (
                                    <motion.div
                                        className={cn(
                                            'absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap',
                                            'px-2 py-0.5 rounded text-[9px] border backdrop-blur-sm pointer-events-none',
                                            disc.isHidden
                                                ? 'bg-purple-950/70 text-purple-300 border-purple-400/20'
                                                : 'bg-black/60 text-accent-300 border-accent-400/20'
                                        )}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 + discIndex * 0.12 }}
                                    >
                                        {disc.isHidden ? '🔮 Secret' : disc.isHero ? '★ Main Discovery' : 'Discovery'}
                                    </motion.div>
                                )}
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

            {/* ═══ BOTTOM BAR ═══ */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-16 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent pointer-events-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="flex items-end justify-between pointer-events-auto">
                    <div className="max-w-md">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={scene.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="font-display text-lg text-white mb-1">{scene.title}</h3>
                                {scene.description && (
                                    <p className="text-sm text-white/50 line-clamp-2">{scene.description}</p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-white/40">
                            <span>📍</span>
                            <span>{sceneViewedCount}/{sceneTotal}</span>
                        </div>
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
                        <span className="text-xs text-white/30">{currentIndex + 1} / {totalScenes}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default PhotoExplorer;

function detectMediaType(scene: Scene): 'image' | 'video' {
    if (scene.mediaType) return scene.mediaType;
    const src = scene.src.toLowerCase();
    if (
        src.includes('youtube.com') ||
        src.includes('youtu.be') ||
        src.includes('vimeo.com') ||
        /\.(mp4|webm|ogg)(\?.*)?$/i.test(src)
    ) return 'video';
    return 'image';
}

function toEmbedUrl(url: string): string {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            const id = u.pathname.slice(1);
            return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&rel=0`;
        }
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.includes('/embed/')) return url;
            const id = u.searchParams.get('v');
            if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&rel=0`;
        }
        if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.split('/').filter(Boolean).pop();
            if (id) return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1`;
        }
        return url;
    } catch {
        return url;
    }
}
