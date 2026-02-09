'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLearnedPlaces } from '@/hooks/useLearnedPlaces';
import { useSound } from '@/hooks/useSound';
import { useMapReactions } from '@/hooks/useMapReactions';
import { RegionIntro } from './RegionIntro';
import { ProgressRail } from './ProgressRail';
import { DiscoveryCard } from './DiscoveryCard';
import { RegionZones } from './RegionZones';
import { PhotoExplorer } from './PhotoExplorer';
import { TimelineViewer } from './TimelineViewer';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { Place, Discovery } from '@/types';

interface PlaceSceneProps {
    place: Place;
    onClose: () => void;
}

type ScenePhase = 'intro' | 'title' | 'explore' | 'detail';

// Default hotspot positions — used when discovery has no custom position
const DEFAULT_POSITIONS = [
    { top: '25%', left: '20%' },
    { top: '32%', left: '55%' },
    { top: '48%', left: '35%' },
    { top: '58%', left: '72%' },
    { top: '42%', left: '82%' },
    { top: '68%', left: '28%' },
    { top: '52%', left: '60%' },
    { top: '38%', left: '45%' },
];

function getHotspotPosition(discovery: Discovery, index: number) {
    return discovery.position || DEFAULT_POSITIONS[index % DEFAULT_POSITIONS.length];
}

/**
 * Cinematic Place Scene
 * Supports two explore modes:
 *   1. Scene-based (PhotoExplorer) — when place.scenes exists
 *   2. Discovery-based (fog of war) — fallback for places without scenes
 */
export function PlaceOverlay({ place, onClose }: PlaceSceneProps) {
    const [phase, setPhase] = useState<ScenePhase>('intro');
    const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
    const [revealedFacts, setRevealedFacts] = useState<Set<number>>(new Set());
    const [showSpotlight, setShowSpotlight] = useState(false);
    const { isLearned, markAsLearned } = useLearnedPlaces();
    const { playUI, playAmbient, isEnabled } = useSound();
    const { onDiscoveryPhase, dimMap } = useMapReactions();
    const alreadyLearned = isLearned(place.id);

    // ═══ Does this place use scene-based exploration? ═══
    const hasScenes = !!(place.scenes && place.scenes.length > 0);
    const hasTimeline = !!(place.timelinePhotos && place.timelinePhotos.length > 0);

    // ═══ FOG OF WAR STATE (only for non-scene mode) ═══
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hasMoved, setHasMoved] = useState(false);
    const sceneRef = useRef<HTMLDivElement>(null);

    // ═══ HIDDEN DISCOVERY STATE ═══
    const [hiddenRevealed, setHiddenRevealed] = useState<Set<number>>(new Set());
    const [longHoverIndex, setLongHoverIndex] = useState<number | null>(null);
    const longHoverTimer = useRef<NodeJS.Timeout | null>(null);
    const [secretFlash, setSecretFlash] = useState(false);

    // ═══ AMBIENT REACTION STATE ═══
    const [discoveryFlash, setDiscoveryFlash] = useState(false);
    const [enlightened, setEnlightened] = useState(false);

    // ═══ DISCOVERIES ═══
    const discoveries: Discovery[] = useMemo(() => {
        return place.discoveries || place.bullets.map((bullet, i) => ({
            hook: bullet,
            story: place.shortStory || bullet,
            type: i === 0 ? 'turning-point' : 'historical-insight',
            isHero: i === 0,
        } as Discovery));
    }, [place]);

    const visibleDiscoveries = useMemo(() =>
        discoveries.map((d, i) => ({ ...d, originalIndex: i }))
            .filter(d => !d.isHidden || hiddenRevealed.has(d.originalIndex)),
        [discoveries, hiddenRevealed]
    );

    const hiddenDiscoveries = useMemo(() =>
        discoveries.map((d, i) => ({ ...d, originalIndex: i }))
            .filter(d => d.isHidden && !hiddenRevealed.has(d.originalIndex)),
        [discoveries, hiddenRevealed]
    );

    const heroIndex = discoveries.findIndex(d => d.isHero) ?? 0;
    const totalVisible = visibleDiscoveries.length;
    const totalAll = discoveries.length;
    const hasHiddenSecrets = hiddenDiscoveries.length > 0;

    // ═══ FOG OF WAR CALCULATIONS ═══
    const discoveryProgress = totalAll > 0 ? revealedFacts.size / totalAll : 0;
    const baseFogRadius = 140;
    const fogRadius = baseFogRadius + (revealedFacts.size * 50);
    const fogOpacity = Math.max(0.15, 0.88 - discoveryProgress * 0.5);

    // ═══ AMBIENT LEVEL ═══
    const ambientLevel = discoveryProgress;
    const ambientHue = Math.round(220 - ambientLevel * 180);
    const ambientSaturation = Math.round(10 + ambientLevel * 40);
    const ambientBrightness = 0.35 + ambientLevel * 0.35;
    const vignetteIntensity = 0.6 - ambientLevel * 0.3;

    const allDiscovered = revealedFacts.size >= totalAll;

    // ═══ MOUSE TRACKING FOR FOG ═══
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (hasScenes) return; // No fog in scene mode
        if (!sceneRef.current) return;
        const rect = sceneRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });
        if (!hasMoved) setHasMoved(true);

        hiddenDiscoveries.forEach(hd => {
            if (hd.hiddenTrigger !== 'long-hover' && hd.hiddenTrigger !== 'double-click') return;
            const pos = getHotspotPosition(hd, hd.originalIndex);
            const hx = (parseFloat(pos.left) / 100) * rect.width;
            const hy = (parseFloat(pos.top) / 100) * rect.height;
            const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);

            if (hd.hiddenTrigger === 'long-hover' && dist < 80) {
                if (longHoverIndex !== hd.originalIndex) {
                    setLongHoverIndex(hd.originalIndex);
                    if (longHoverTimer.current) clearTimeout(longHoverTimer.current);
                    longHoverTimer.current = setTimeout(() => {
                        revealHiddenDiscovery(hd.originalIndex);
                    }, 3000);
                }
            } else if (longHoverIndex === hd.originalIndex && dist >= 80) {
                setLongHoverIndex(null);
                if (longHoverTimer.current) clearTimeout(longHoverTimer.current);
            }
        });
    }, [hasScenes, hasMoved, hiddenDiscoveries, longHoverIndex]);

    const isHotspotVisible = useCallback((pos: { top: string; left: string }) => {
        if (!hasMoved || !sceneRef.current) return false;
        if (allDiscovered) return true;
        const rect = sceneRef.current.getBoundingClientRect();
        const hx = (parseFloat(pos.left) / 100) * rect.width;
        const hy = (parseFloat(pos.top) / 100) * rect.height;
        const dist = Math.sqrt((mousePos.x - hx) ** 2 + (mousePos.y - hy) ** 2);
        return dist < fogRadius * 0.85;
    }, [mousePos, fogRadius, hasMoved, allDiscovered]);

    const revealHiddenDiscovery = useCallback((index: number) => {
        setHiddenRevealed(prev => new Set(prev).add(index));
        setSecretFlash(true);
        if (isEnabled) playUI('success');
        setTimeout(() => setSecretFlash(false), 800);
    }, [isEnabled, playUI]);

    const checkChainTriggers = useCallback((newRevealed: Set<number>) => {
        discoveries.forEach((d, i) => {
            if (!d.isHidden || !d.chainRequires || hiddenRevealed.has(i)) return;
            if (d.hiddenTrigger === 'chain') {
                const allMet = d.chainRequires.every(req => newRevealed.has(req));
                if (allMet) {
                    setTimeout(() => revealHiddenDiscovery(i), 1200);
                }
            }
        });
    }, [discoveries, hiddenRevealed, revealHiddenDiscovery]);

    const handleSceneDoubleClick = useCallback((e: React.MouseEvent) => {
        if (hasScenes) return;
        if (!sceneRef.current) return;
        const rect = sceneRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        hiddenDiscoveries.forEach(hd => {
            if (hd.hiddenTrigger !== 'double-click') return;
            const pos = getHotspotPosition(hd, hd.originalIndex);
            const hx = (parseFloat(pos.left) / 100) * rect.width;
            const hy = (parseFloat(pos.top) / 100) * rect.height;
            const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
            if (dist < 100) revealHiddenDiscovery(hd.originalIndex);
        });
    }, [hasScenes, hiddenDiscoveries, revealHiddenDiscovery]);

    // ═══ AMBIENT START ═══
    useEffect(() => {
        if (phase === 'explore' && isEnabled) {
            const ambienceType = place.type === 'nature' ? 'nature' :
                place.type === 'city' ? 'city' : 'ancient';
            playAmbient(ambienceType, 1500);
        }
    }, [phase, isEnabled, place.type, playAmbient]);

    const handleIntroComplete = useCallback(() => setPhase('title'), []);

    useEffect(() => {
        if (phase !== 'title') return;
        const timer = setTimeout(() => setPhase('explore'), 2500);
        return () => clearTimeout(timer);
    }, [phase]);

    // ═══ HOTSPOT CLICK (discovery mode) ═══
    const handleHotspotClick = (index: number) => {
        if (isEnabled) playUI('click');
        if (index === heroIndex && !revealedFacts.has(index)) {
            setShowSpotlight(true);
            setTimeout(() => setShowSpotlight(false), 500);
        }
        setActiveHotspot(index);
        const newRevealed = new Set(revealedFacts).add(index);
        setRevealedFacts(newRevealed);
        setDiscoveryFlash(true);
        setTimeout(() => setDiscoveryFlash(false), 600);
        checkChainTriggers(newRevealed);
        if (newRevealed.size >= totalAll) {
            setTimeout(() => setEnlightened(true), 800);
        }
    };

    const handleRailClick = (index: number) => {
        if (revealedFacts.has(index)) setActiveHotspot(index);
        else if (isEnabled) playUI('hover');
    };

    const handleCloseDetail = () => { setActiveHotspot(null); dimMap(false); };

    const handleLearn = () => {
        if (alreadyLearned) return;
        markAsLearned(place.id);
        if (isEnabled) playUI('success');
    };

    const typeIcon = place.type === 'historical' ? '🏛️' :
        place.type === 'nature' ? '🌿' : '🏙️';

    useEffect(() => {
        return () => { if (longHoverTimer.current) clearTimeout(longHoverTimer.current); };
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* ═══ BACKDROP ═══ */}
            <div className="absolute inset-0 bg-neutral-950">
                {/* Only show static background in discovery (non-scene) mode */}
                {!hasScenes && (
                    <>
                        <div
                            className={cn(
                                "absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-out",
                                showSpotlight ? "opacity-30" : ""
                            )}
                            style={{
                                backgroundImage: place.media?.[0]?.src
                                    ? `url(${place.media[0].src})`
                                    : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                                opacity: showSpotlight ? 0.3 : ambientBrightness,
                                filter: `saturate(${0.6 + ambientLevel * 0.6})`,
                            }}
                        />
                        <div
                            className="absolute inset-0 transition-all duration-[2000ms] ease-out mix-blend-overlay"
                            style={{
                                background: `radial-gradient(ellipse at 50% 40%, 
                                    hsla(${ambientHue}, ${ambientSaturation}%, 50%, ${ambientLevel * 0.15}) 0%, 
                                    transparent 70%)`,
                            }}
                        />
                        <div
                            className="absolute inset-0 transition-all duration-[2000ms]"
                            style={{
                                background: `linear-gradient(to top, 
                                    rgba(13,15,19,${0.95 - ambientLevel * 0.2}) 0%, 
                                    rgba(13,15,19,${0.4 - ambientLevel * 0.15}) 50%, 
                                    rgba(13,15,19,${0.6 - ambientLevel * 0.2}) 100%)`,
                            }}
                        />
                        <div
                            className="absolute inset-0 transition-all duration-[2000ms]"
                            style={{
                                background: `radial-gradient(ellipse at center, 
                                    transparent 0%, transparent 40%, 
                                    rgba(0,0,0,${vignetteIntensity}) 100%)`,
                            }}
                        />
                    </>
                )}
                <div className="absolute inset-0 grain opacity-30" />

                {/* Effects (both modes) */}
                <AnimatePresence>
                    {discoveryFlash && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, 
                                    rgba(239,204,77,0.15) 0%, transparent 60%)`,
                            }}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {secretFlash && (
                        <motion.div className="absolute inset-0 pointer-events-none z-20"
                            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 0.8 }}>
                            <div className="absolute inset-0 bg-purple-500/20" />
                            <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
                                initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                                transition={{ duration: 1 }}>
                                🔮 Secret Found!
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {enlightened && (
                        <motion.div className="absolute inset-0 pointer-events-none z-20"
                            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0.1] }} transition={{ duration: 2, ease: 'easeOut' }}>
                            <div className="absolute inset-0" style={{
                                background: `radial-gradient(ellipse at 50% 40%, rgba(239,204,77,0.3) 0%, rgba(239,204,77,0.05) 50%, transparent 80%)`,
                            }} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {showSpotlight && (
                        <motion.div className="absolute inset-0 bg-black/50"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                    )}
                </AnimatePresence>
            </div>

            {/* Map Zones */}
            {phase === 'explore' && place.zones && <RegionZones zones={place.zones} />}

            {/* PHASE: Intro */}
            {phase === 'intro' && <RegionIntro place={place} onStart={handleIntroComplete} />}

            {/* PHASE: Title */}
            <AnimatePresence>
                {phase === 'title' && (
                    <motion.div className="absolute inset-0 flex items-center justify-center z-40"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.8 }}>
                        <div className="text-center">
                            <motion.span className="text-5xl mb-4 block"
                                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, type: 'spring' }}>{typeIcon}</motion.span>
                            <motion.h1 className="font-display text-display-lg text-white mb-4"
                                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}>{place.name}</motion.h1>
                            <motion.p className="text-xl text-accent-400 italic max-w-md mx-auto"
                                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.6 }}>&ldquo;{place.teaser}&rdquo;</motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════════════════════
                PHASE: EXPLORE — Scene-based OR Discovery-based
            ═══════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {phase === 'explore' && (
                    <motion.div
                        ref={sceneRef}
                        className="absolute inset-0 z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onMouseMove={handleMouseMove}
                        onDoubleClick={handleSceneDoubleClick}
                    >
                        {/* ═══ SCENE-BASED MODE: Photo Gallery ═══ */}
                        {hasScenes && (
                            <PhotoExplorer scenes={place.scenes!} />
                        )}

                        {/* ═══ DISCOVERY-BASED MODE: Fog of War ═══ */}
                        {!hasScenes && (
                            <>
                                {/* Fog overlay */}
                                {!allDiscovered && (
                                    <div className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-1000"
                                        style={{
                                            background: hasMoved
                                                ? `radial-gradient(circle ${fogRadius}px at ${mousePos.x}px ${mousePos.y}px, 
                                                    transparent 0%, transparent 40%,
                                                    rgba(5,5,10,${fogOpacity * 0.5}) 65%, 
                                                    rgba(5,5,10,${fogOpacity}) 100%)`
                                                : `rgba(5,5,10,${fogOpacity})`,
                                        }}
                                    />
                                )}
                                {allDiscovered && (
                                    <motion.div className="absolute inset-0 pointer-events-none z-10"
                                        initial={{ opacity: 1 }} animate={{ opacity: 0 }}
                                        transition={{ duration: 2, ease: 'easeOut' }}
                                        style={{ background: `rgba(5,5,10,${fogOpacity})` }} />
                                )}
                                {/* Explore hint */}
                                {!hasMoved && (
                                    <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                                        <motion.div className="text-center"
                                            animate={{ opacity: [0.4, 0.9, 0.4] }}
                                            transition={{ duration: 3, repeat: Infinity }}>
                                            <p className="text-white/50 text-lg font-display mb-2">Move your cursor to explore</p>
                                            <p className="text-white/30 text-sm">Discover hidden secrets in the darkness</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                                {/* Long hover indicator */}
                                <AnimatePresence>
                                    {longHoverIndex !== null && (
                                        <motion.div className="absolute pointer-events-none z-20"
                                            style={{ ...getHotspotPosition(discoveries[longHoverIndex], longHoverIndex), transform: 'translate(-50%, -50%)' }}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <motion.div className="w-20 h-20 rounded-full border-2 border-purple-400/50"
                                                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 3, ease: 'linear' }}>
                                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                                    <motion.circle cx="50" cy="50" r="45" fill="none" stroke="rgba(168,85,247,0.5)"
                                                        strokeWidth="3" strokeDasharray="283" strokeLinecap="round"
                                                        initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 0 }}
                                                        transition={{ duration: 3, ease: 'linear' }} />
                                                </svg>
                                            </motion.div>
                                            <motion.p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-300/70 whitespace-nowrap"
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>Hold still...</motion.p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {/* Discovery hotspots */}
                                {visibleDiscoveries.map((disc) => {
                                    const index = disc.originalIndex;
                                    const isHero = disc.isHero;
                                    const isDiscovered = revealedFacts.has(index);
                                    const pos = getHotspotPosition(disc, index);
                                    const visible = isHotspotVisible(pos) || isDiscovered;
                                    const wasHidden = disc.isHidden;
                                    return (
                                        <motion.button key={index}
                                            className={cn('absolute rounded-full flex items-center justify-center border-2 transition-all duration-300 hover:scale-110 focus:outline-none',
                                                isHero ? 'w-14 h-14' : 'w-10 h-10',
                                                isDiscovered ? 'bg-accent-500/30 border-accent-400'
                                                    : wasHidden ? 'bg-purple-500/20 border-purple-400'
                                                        : isHero ? 'bg-accent-500/20 border-accent-400 animate-pulse'
                                                            : 'bg-white/10 border-white/40',
                                                !visible && !isDiscovered && 'opacity-0 pointer-events-none'
                                            )}
                                            style={pos}
                                            onClick={() => handleHotspotClick(index)}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: visible || isDiscovered ? 1 : 0, opacity: visible || isDiscovered ? 1 : 0 }}
                                            transition={wasHidden ? { type: 'spring', stiffness: 400, damping: 20 }
                                                : { delay: 0.7 + visibleDiscoveries.indexOf(disc) * 0.1, type: 'spring' }}
                                            aria-label={`Discovery point ${index + 1}`}>
                                            {isDiscovered ? <span className="text-accent-400">✓</span>
                                                : wasHidden ? <span className="text-purple-400 text-lg">🔮</span>
                                                    : isHero ? <span className="text-accent-400 text-xl">★</span>
                                                        : <span className="text-white/70">?</span>}
                                            {isHero && !isDiscovered && (<>
                                                <div className="absolute inset-0 rounded-full bg-accent-400/20 animate-ping" />
                                                <div className="absolute -inset-2 rounded-full border border-accent-400/30 animate-pulse" />
                                            </>)}
                                            {wasHidden && !isDiscovered && (<>
                                                <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
                                                <div className="absolute -inset-2 rounded-full border border-purple-400/20 animate-pulse" />
                                            </>)}
                                        </motion.button>
                                    );
                                })}
                                {/* Hidden discovery hints */}
                                {hiddenDiscoveries.map((hd) => {
                                    const pos = getHotspotPosition(hd, hd.originalIndex);
                                    const nearMouse = isHotspotVisible(pos);
                                    if (!nearMouse) return null;
                                    return (
                                        <motion.div key={`hint-${hd.originalIndex}`} className="absolute pointer-events-none z-5" style={pos}
                                            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.3, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}>
                                            <div className="w-8 h-8 -ml-4 -mt-4">
                                                <div className="w-full h-full rounded-full bg-purple-400/10 blur-sm" />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {/* Progress Rail for discovery mode */}
                                <motion.div className="absolute top-1/2 right-6 -translate-y-1/2 z-40"
                                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                                    <ProgressRail total={totalAll} visibleTotal={totalVisible} discovered={revealedFacts}
                                        heroIndex={heroIndex} onStepClick={handleRailClick} hints={discoveries.map(d => d.hook)}
                                        discoveries={discoveries} hiddenRevealed={hiddenRevealed} hasHiddenSecrets={hasHiddenSecrets} />
                                </motion.div>
                            </>
                        )}

                        {/* ═══ TIMELINE VIEWER (both modes, if data exists) ═══ */}
                        {hasTimeline && (
                            <TimelineViewer
                                photos={place.timelinePhotos!}
                                placeName={place.name}
                            />
                        )}

                        {/* Context Menu (top-left) — both modes */}
                        <motion.div className="absolute top-6 left-6 z-40"
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                            <ContextMenu title={place.name} icon={typeIcon} />
                        </motion.div>

                        {/* Close button (top-right) — both modes */}
                        <motion.button onClick={onClose}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/50 transition-all z-50"
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                            aria-label="Close">
                            <span className="text-xl">×</span>
                        </motion.button>

                        {/* Learn button */}
                        <AnimatePresence>
                            {allDiscovered && !alreadyLearned && !hasScenes && (
                                <motion.button
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-neutral-900 font-semibold rounded-full transition-colors shadow-glow z-40"
                                    onClick={handleLearn}
                                    initial={{ y: 30, opacity: 0, scale: 0.9 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}>
                                    💡 I&apos;ve learned this
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {alreadyLearned && !hasScenes && (
                            <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-nature/20 border border-nature/30 text-nature rounded-full z-40"
                                initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                ✓ Knowledge acquired
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DISCOVERY CARD (discovery mode only) */}
            <AnimatePresence>
                {activeHotspot !== null && phase === 'explore' && !hasScenes && discoveries[activeHotspot] && (
                    <DiscoveryCard discovery={discoveries[activeHotspot]} index={activeHotspot}
                        total={totalAll} discovered={revealedFacts.size}
                        placeImage={place.media?.[0]?.src}
                        onComplete={handleCloseDetail} onClose={handleCloseDetail}
                        onMapReaction={(p) => { onDiscoveryPhase(p, place.coords); if (p === 'hook' && isEnabled) playUI('hover'); }} />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default PlaceOverlay;
