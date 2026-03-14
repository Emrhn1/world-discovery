'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLearnedPlaces } from '@/hooks/useLearnedPlaces';
import { useSound } from '@/hooks/useSound';
import { PhotoExplorer } from './PhotoExplorer';
import { TimelineViewer } from './TimelineViewer';
import { ContextMenu } from '@/components/ui/ContextMenu';
import type { Place, Scene, SceneHotspot } from '@/types';

interface PlaceSceneProps {
    place: Place;
    onClose: () => void;
}

type ScenePhase = 'intro' | 'title' | 'explore';

/**
 * Helper: Convert legacy discovery/bullets data to modern scene format
 */
function generateScenesFromPlace(place: Place): Scene[] {
    // If place already has scenes, use them
    if (place.scenes && place.scenes.length > 0) {
        return place.scenes;
    }

    // Otherwise, generate scenes from media and discoveries/bullets
    const scenes: Scene[] = [];
    
    // Get discoveries or fallback to bullets
    const discoveries = place.discoveries || place.bullets.map((bullet, i) => ({
        hook: bullet,
        story: place.shortStory || bullet,
        type: (i === 0 ? 'turning-point' : 'historical-insight') as const,
        isHero: i === 0,
        position: undefined, // Explicitly set position as undefined for generated discoveries
    }));

    // Get media items
    const mediaItems = place.media || [];
    
    // Create one scene per media item (or at least one scene)
    const numScenes = Math.max(mediaItems.length, 1);
    
    for (let i = 0; i < numScenes; i++) {
        const media = mediaItems[i];
        
        // Distribute discoveries across scenes as hotspots
        const discoveriesForThisScene = discoveries.filter((_, idx) => 
            idx % numScenes === i
        );

        // Position hotspots in a visually pleasing pattern
        const hotspotPositions = [
            { top: '25%', left: '20%' },
            { top: '35%', left: '60%' },
            { top: '55%', left: '35%' },
            { top: '65%', left: '75%' },
            { top: '45%', left: '80%' },
        ];

        const hotspots: SceneHotspot[] = discoveriesForThisScene.map((disc, idx) => {
            // Safely access position property
            const position = ('position' in disc && disc.position) 
                ? disc.position 
                : hotspotPositions[idx % hotspotPositions.length];
            
            return {
                id: `hotspot-${i}-${idx}`,
                position: position,
                icon: place.type === 'historical' ? '🏛️' : 
                      place.type === 'nature' ? '🌿' : '🏙️',
                title: typeof disc.hook === 'string' ? disc.hook : disc.hook || 'Discovery',
                description: typeof disc.story === 'string' ? disc.story : disc.story || '',
                type: disc.type,
            };
        });

        scenes.push({
            id: `scene-${i}`,
            title: media?.alt || `View ${i + 1}`,
            description: i === 0 ? place.shortStory : undefined,
            src: media?.src || 'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17',
            alt: media?.alt || place.name,
            hotspots,
        });
    }

    return scenes;
}

/**
 * Cinematic Place Scene - Always uses PhotoExplorer with scenes
 */
export function PlaceOverlay({ place, onClose }: PlaceSceneProps) {
    const [phase, setPhase] = useState<ScenePhase>('intro');
    const { isLearned, markAsLearned } = useLearnedPlaces();
    const { playUI, playAmbient, isEnabled } = useSound();
    const alreadyLearned = isLearned(place.id);

    // Generate or use existing scenes
    const scenes = useMemo(() => generateScenesFromPlace(place), [place]);
    const hasTimeline = !!(place.timelinePhotos && place.timelinePhotos.length > 0);

    // Start ambient sound
    useEffect(() => {
        if (phase !== 'explore' || !isEnabled) return;
        
        // Safely determine ambience type
        const ambienceType = (place.ambience as 'ancient' | 'nature' | 'city' | 'default') || 
            (place.type === 'nature' ? 'nature' :
             place.type === 'city' ? 'city' : 'ancient');
        
        playAmbient(ambienceType, 1500);
    }, [phase, isEnabled, place.ambience, place.type, playAmbient]);

    const handleIntroComplete = useCallback(() => setPhase('title'), []);

    useEffect(() => {
        if (phase !== 'title') return;
        const timer = setTimeout(() => setPhase('explore'), 2500);
        return () => clearTimeout(timer);
    }, [phase]);

    const handleLearn = () => {
        if (alreadyLearned) return;
        markAsLearned(place.id);
        if (isEnabled) playUI('success');
    };

    const typeIcon = place.type === 'historical' ? '🏛️' :
        place.type === 'nature' ? '🌿' : '🏙️';

    return (
        <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* BACKDROP */}
            <div className="absolute inset-0 bg-neutral-950" />

            {/* PHASES */}
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

                {/* EXPLORE PHASE - PhotoExplorer with scenes */}
                {phase === 'explore' && (
                    <motion.div
                        key="explore"
                        className="absolute inset-0 z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* PhotoExplorer - main scene viewer */}
                        <PhotoExplorer scenes={scenes} />

                        {/* Timeline Viewer (if timeline data exists) */}
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

                        {/* Learn button (if not already learned) */}
                        {!alreadyLearned && (
                            <motion.button
                                className="absolute bottom-8 right-8 px-6 py-3 bg-accent-500 hover:bg-accent-400 text-neutral-900 font-semibold rounded-full transition-colors shadow-lg z-40"
                                onClick={handleLearn}
                                initial={{ y: 30, opacity: 0, scale: 0.9 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                💡 Mark as Learned
                            </motion.button>
                        )}

                        {alreadyLearned && (
                            <motion.div
                                className="absolute bottom-8 right-8 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full z-40"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                ✓ Learned
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default PlaceOverlay;
