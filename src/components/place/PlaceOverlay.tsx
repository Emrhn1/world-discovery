'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearnedPlaces } from '@/hooks/useLearnedPlaces';
import { useMapReactions } from '@/hooks/useMapReactions';
import { useSound } from '@/hooks/useSound';
import { PhotoExplorer } from './PhotoExplorer';
import { TimelineViewer } from './TimelineViewer';
import { DiscoveryCard } from './DiscoveryCard';
import { ProgressRail } from './ProgressRail';
import { LearnedButton } from './LearnedButton';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { Place, Scene, SceneHotspot, Discovery, DiscoveryType } from '@/types';

interface PlaceSceneProps {
    place: Place;
    onClose: () => void;
}

type ScenePhase = 'intro' | 'title' | 'explore';
type CardPhase = 'hook' | 'reveal' | 'interaction';

function generateScenesFromPlace(place: Place): Scene[] {
    if (place.scenes && place.scenes.length > 0) return place.scenes;

    const discoveries = place.discoveries || place.bullets.map((bullet, i) => ({
        hook: bullet,
        story: place.shortStory || bullet,
        type: (i === 0 ? 'turning-point' : 'historical-insight') as DiscoveryType,
        isHero: i === 0,
        position: undefined,
    }));

    const mediaItems = place.media || [];
    const numScenes = Math.max(mediaItems.length, 1);

    const hotspotPositions = [
        { top: '25%', left: '20%' },
        { top: '35%', left: '60%' },
        { top: '55%', left: '35%' },
        { top: '65%', left: '75%' },
        { top: '45%', left: '80%' },
    ];

    return Array.from({ length: numScenes }, (_, i) => {
        const media = mediaItems[i];
        const discoveriesForScene = discoveries.filter((_, idx) => idx % numScenes === i);

        const hotspots: SceneHotspot[] = discoveriesForScene.map((disc, idx) => {
            const position = ('position' in disc && disc.position)
                ? disc.position
                : hotspotPositions[idx % hotspotPositions.length];

            return {
                id: `hotspot-${i}-${idx}`,
                position,
                icon: place.type === 'historical' ? '🏛️' : place.type === 'nature' ? '🌿' : '🏙️',
                title: disc.hook,
                description: disc.story,
                type: disc.type,
            };
        });

        return {
            id: `scene-${i}`,
            title: media?.alt || `View ${i + 1}`,
            description: i === 0 ? place.shortStory : undefined,
            src: media?.src || 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17',
            alt: media?.alt || place.name,
            hotspots,
        };
    });
}

export function PlaceOverlay({ place, onClose }: PlaceSceneProps) {
    const [phase, setPhase] = useState<ScenePhase>('intro');
    const [discoveredIndexes, setDiscoveredIndexes] = useState<Set<number>>(new Set());
    const [revealedHiddenIndexes, setRevealedHiddenIndexes] = useState<Set<number>>(new Set());
    const [activeDiscoveryIndex, setActiveDiscoveryIndex] = useState<number | null>(null);

    const { isLearned, markAsLearned } = useLearnedPlaces();
    const { onDiscoveryPhase, dimMap } = useMapReactions();
    const { playUI, playAmbient, isEnabled } = useSound();
    const alreadyLearned = isLearned(place.id);

    const scenes = useMemo(() => generateScenesFromPlace(place), [place]);
    const hasTimeline = !!(place.timelinePhotos && place.timelinePhotos.length > 0);

    // Only overlay discoveries when place has proper scenes (avoid double-rendering in fallback)
    const discoveries: Discovery[] = useMemo(
        () => (place.scenes && place.scenes.length > 0 ? (place.discoveries ?? []) : []),
        [place]
    );

    const hasHiddenSecrets = discoveries.some((d, i) => d.isHidden && !revealedHiddenIndexes.has(i));

    // Auto-unlock chain discoveries when their prerequisites are satisfied
    useEffect(() => {
        if (!discoveries.length) return;
        setRevealedHiddenIndexes(prev => {
            const next = new Set(prev);
            discoveries.forEach((disc, i) => {
                if (disc.isHidden && disc.hiddenTrigger === 'chain') {
                    const ready = (disc.chainRequires ?? []).every(j => discoveredIndexes.has(j));
                    if (ready) next.add(i);
                }
            });
            return next;
        });
    }, [discoveredIndexes, discoveries]);

    useEffect(() => {
        if (phase !== 'explore' || !isEnabled) return;
        const ambienceType = (place.ambience as 'ancient' | 'nature' | 'city' | 'default') ||
            (place.type === 'nature' ? 'nature' : place.type === 'city' ? 'city' : 'ancient');
        playAmbient(ambienceType, 1500);
    }, [phase, isEnabled, place.ambience, place.type, playAmbient]);

    const handleIntroComplete = useCallback(() => setPhase('title'), []);

    useEffect(() => {
        if (phase !== 'title') return;
        const timer = setTimeout(() => setPhase('explore'), 2500);
        return () => clearTimeout(timer);
    }, [phase]);

    const handleDiscoveryOpen = useCallback((index: number) => {
        setActiveDiscoveryIndex(index);
        if (isEnabled) playUI('click');
    }, [isEnabled, playUI]);

    const handleRevealHidden = useCallback((index: number) => {
        setRevealedHiddenIndexes(prev => new Set(prev).add(index));
    }, []);

    const handleDiscoveryComplete = useCallback(() => {
        if (activeDiscoveryIndex !== null) {
            setDiscoveredIndexes(prev => new Set(prev).add(activeDiscoveryIndex));
        }
        setActiveDiscoveryIndex(null);
        dimMap(false);
        if (isEnabled) playUI('success');
    }, [activeDiscoveryIndex, dimMap, isEnabled, playUI]);

    const handleDiscoveryClose = useCallback(() => {
        setActiveDiscoveryIndex(null);
        dimMap(false);
    }, [dimMap]);

    const handleMapReaction = useCallback((cardPhase: CardPhase) => {
        onDiscoveryPhase(cardPhase, place.coords);
    }, [onDiscoveryPhase, place.coords]);

    const handleLearn = useCallback(() => {
        if (alreadyLearned) return;
        markAsLearned(place.id);
        if (isEnabled) playUI('success');
    }, [alreadyLearned, markAsLearned, place.id, isEnabled, playUI]);

    const typeIcon = place.type === 'historical' ? '🏛️' : place.type === 'nature' ? '🌿' : '🏙️';

    const heroIndex = discoveries.findIndex(d => d.isHero);
    const hints = discoveries.map(d => d.hook.slice(0, 30));
    const visibleTotal = discoveries.filter((d, i) => !d.isHidden || revealedHiddenIndexes.has(i)).length;
    const placeImage = place.scenes?.[0]?.src ?? place.media?.[0]?.src;

    const activeDiscovery = activeDiscoveryIndex !== null ? discoveries[activeDiscoveryIndex] : null;

    return (
        <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="absolute inset-0 bg-neutral-950" />

            <AnimatePresence mode="wait">
                {/* INTRO PHASE */}
                {phase === 'intro' && (
                    <motion.div
                        key="intro"
                        className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-neutral-950"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-center px-8"
                        >
                            <motion.div
                                className="text-5xl mb-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {typeIcon}
                            </motion.div>
                            <motion.p
                                className="text-sm uppercase tracking-widest text-neutral-500 mb-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                {place.type === 'historical' ? 'Historical Site' :
                                    place.type === 'nature' ? 'Natural Wonder' : 'City Exploration'}
                            </motion.p>
                            <motion.h2
                                className="font-display text-4xl text-white mb-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.9 }}
                            >
                                {place.name}
                            </motion.h2>
                            <motion.p
                                className="text-neutral-400 max-w-md"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                            >
                                {place.teaser}
                            </motion.p>
                        </motion.div>
                        <motion.button
                            onClick={handleIntroComplete}
                            className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Begin Exploration
                        </motion.button>
                    </motion.div>
                )}

                {/* TITLE PHASE */}
                {phase === 'title' && (
                    <motion.div
                        key="title"
                        className="absolute inset-0 flex items-center justify-center z-10 bg-neutral-950"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <motion.h1
                            className="font-display text-6xl text-white text-center px-8"
                            initial={{ scale: 1.2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {place.name}
                        </motion.h1>
                    </motion.div>
                )}

                {/* EXPLORE PHASE */}
                {phase === 'explore' && (
                    <motion.div
                        key="explore"
                        className="absolute inset-0 z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* PhotoExplorer with discovery overlay */}
                        <PhotoExplorer
                            scenes={scenes}
                            discoveries={discoveries}
                            discoveredIndexes={discoveredIndexes}
                            revealedHiddenIndexes={revealedHiddenIndexes}
                            onDiscoveryOpen={handleDiscoveryOpen}
                            onRevealHidden={handleRevealHidden}
                        />

                        {/* Timeline Viewer */}
                        {hasTimeline && (
                            <TimelineViewer
                                photos={place.timelinePhotos!}
                                placeName={place.name}
                            />
                        )}

                        {/* Context Menu (top-left) */}
                        <motion.div
                            className="absolute top-6 left-6 z-40"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <ContextMenu title={place.name} icon={typeIcon} />
                        </motion.div>

                        {/* Close button (top-right) */}
                        <motion.button
                            onClick={onClose}
                            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all z-50"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Close"
                        >
                            <span className="text-xl">×</span>
                        </motion.button>

                        {/* Progress Rail (right-center) — only if place has discoveries */}
                        {discoveries.length > 0 && (
                            <motion.div
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-40"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <ProgressRail
                                    total={discoveries.length}
                                    visibleTotal={visibleTotal}
                                    discovered={discoveredIndexes}
                                    heroIndex={heroIndex >= 0 ? heroIndex : 0}
                                    onStepClick={handleDiscoveryOpen}
                                    hints={hints}
                                    discoveries={discoveries}
                                    hiddenRevealed={revealedHiddenIndexes}
                                    hasHiddenSecrets={hasHiddenSecrets}
                                />
                            </motion.div>
                        )}

                        {/* Learn button */}
                        <motion.div
                            className="absolute bottom-8 right-20 z-40"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <LearnedButton
                                isLearned={alreadyLearned}
                                onLearn={handleLearn}
                                className="min-w-[180px]"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DiscoveryCard modal — on top of everything */}
            <AnimatePresence>
                {phase === 'explore' && activeDiscovery !== null && activeDiscoveryIndex !== null && (
                    <DiscoveryCard
                        key={`discovery-${activeDiscoveryIndex}`}
                        discovery={activeDiscovery}
                        index={activeDiscoveryIndex}
                        total={discoveries.length}
                        discovered={discoveredIndexes.size}
                        placeImage={placeImage}
                        onComplete={handleDiscoveryComplete}
                        onClose={handleDiscoveryClose}
                        onMapReaction={handleMapReaction}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default PlaceOverlay;
