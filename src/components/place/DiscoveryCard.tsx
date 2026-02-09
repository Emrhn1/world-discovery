'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getDiscoveryTypeConfig, getProgressCTA } from '@/lib/discoveryTypes';
import { useSound } from '@/hooks/useSound';
import type { Discovery, DiscoveryType } from '@/types';

type CardPhase = 'hook' | 'reveal' | 'interaction';

interface DiscoveryCardProps {
    discovery: Discovery;
    index: number;
    total: number;
    discovered: number;
    placeImage?: string;
    onComplete: () => void;
    onClose: () => void;
    onMapReaction?: (phase: CardPhase) => void;
}

/**
 * Multi-phase Discovery Card
 * Transforms static info dump into a 3-step emotional journey
 */
export function DiscoveryCard({
    discovery,
    index,
    total,
    discovered,
    placeImage,
    onComplete,
    onClose,
    onMapReaction,
}: DiscoveryCardProps) {
    const [phase, setPhase] = useState<CardPhase>('hook');
    const [storyLines, setStoryLines] = useState<string[]>([]);
    const [visibleLines, setVisibleLines] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const { playUI, isEnabled } = useSound();

    const typeConfig = getDiscoveryTypeConfig(discovery.type);
    const progressCTA = getProgressCTA(discovered + 1, total);

    // Split story into lines for progressive reveal
    useEffect(() => {
        const sentences = discovery.story.split(/(?<=[.!?])\s+/);
        setStoryLines(sentences);
    }, [discovery.story]);

    // Trigger map reaction on phase change
    useEffect(() => {
        onMapReaction?.(phase);
    }, [phase, onMapReaction]);

    // Handle phase transitions
    const advanceToReveal = useCallback(() => {
        if (isEnabled) playUI('click');
        setPhase('reveal');
        // Start revealing lines
        setVisibleLines(1);
    }, [isEnabled, playUI]);

    const revealNextLine = useCallback(() => {
        if (visibleLines < storyLines.length) {
            if (isEnabled) playUI('hover');
            setVisibleLines(prev => prev + 1);
        } else {
            // All lines revealed, go to interaction
            setPhase('interaction');
        }
    }, [visibleLines, storyLines.length, isEnabled, playUI]);

    const handleInteraction = useCallback(() => {
        if (isEnabled) playUI('success');
        setIsCompleted(true);
        setTimeout(() => {
            onComplete();
        }, 600);
    }, [isEnabled, playUI, onComplete]);

    // Auto-reveal lines with delay
    useEffect(() => {
        if (phase !== 'reveal' || visibleLines >= storyLines.length) return;

        const timer = setTimeout(() => {
            setVisibleLines(prev => prev + 1);
        }, 1200); // Pacing: 1.2s per line

        return () => clearTimeout(timer);
    }, [phase, visibleLines, storyLines.length]);

    // Transition to interaction when all lines visible
    useEffect(() => {
        if (phase === 'reveal' && visibleLines >= storyLines.length && storyLines.length > 0) {
            const timer = setTimeout(() => {
                setPhase('interaction');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [phase, visibleLines, storyLines.length]);

    // Interaction prompts based on discovery type
    const getInteractionPrompt = (type: DiscoveryType): string => {
        switch (type) {
            case 'engineering-mystery':
                return 'How did they achieve this?';
            case 'hidden-detail':
                return 'Look closer...';
            case 'cultural-shift':
                return 'What changed here?';
            case 'turning-point':
                return 'The moment of truth';
            case 'historical-insight':
            default:
                return 'Mark as understood';
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop with extra blur for focus */}
            <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={phase === 'hook' ? advanceToReveal : undefined}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            {/* The Card */}
            <motion.div
                className={cn(
                    'relative w-full max-w-2xl overflow-hidden',
                    'bg-neutral-900/95 backdrop-blur-xl rounded-3xl',
                    'border border-white/10 shadow-2xl'
                )}
                style={{
                    borderColor: `${typeConfig.accentHex}30`,
                    boxShadow: `0 0 60px ${typeConfig.accentHex}15`,
                }}
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    height: phase === 'hook' ? 'auto' : 'auto',
                }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                layout
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Type badge */}
                <motion.div
                    className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                        backgroundColor: `${typeConfig.accentHex}20`,
                        color: typeConfig.accentHex,
                        borderColor: `${typeConfig.accentHex}30`,
                    }}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <span>{typeConfig.icon}</span>
                    <span>{typeConfig.label}</span>
                </motion.div>

                {/* Hero badge for main discovery */}
                {discovery.isHero && (
                    <motion.div
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-accent-500/20 border border-accent-400/30 rounded-full text-xs text-accent-400 font-medium"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        ★ Main Discovery
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════════
            PHASE 1: HOOK - Dramatic one-liner only
        ═══════════════════════════════════════════════════════ */}
                <AnimatePresence mode="wait">
                    {phase === 'hook' && (
                        <motion.div
                            key="hook"
                            className="p-8 pt-16 pb-12 flex flex-col items-center justify-center min-h-[300px] cursor-pointer"
                            onClick={advanceToReveal}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {/* Big dramatic hook */}
                            <motion.p
                                className="text-2xl md:text-3xl text-white text-center font-display leading-relaxed max-w-lg"
                                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                            >
                                &ldquo;{discovery.hook}&rdquo;
                            </motion.p>

                            {/* Subtle tap hint */}
                            <motion.p
                                className="mt-8 text-sm text-neutral-500"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                            >
                                Tap to reveal more
                            </motion.p>

                            {/* Pulsing indicator */}
                            <motion.div
                                className="mt-4 w-6 h-6 rounded-full border-2"
                                style={{ borderColor: typeConfig.accentHex }}
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
              PHASE 2: REVEAL - Story unfolds line by line
          ═══════════════════════════════════════════════════════ */}
                    {phase === 'reveal' && (
                        <motion.div
                            key="reveal"
                            className="p-8 pt-16"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={revealNextLine}
                        >
                            {/* Visual element - place image or placeholder */}
                            <motion.div
                                className="relative w-full h-40 md:h-48 rounded-xl overflow-hidden mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {placeImage ? (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${placeImage})` }}
                                    />
                                ) : (
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            background: `linear-gradient(135deg, ${typeConfig.accentHex}20, transparent)`,
                                        }}
                                    />
                                )}
                                {/* Blueprint-style overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage: `
                      linear-gradient(${typeConfig.accentHex}10 1px, transparent 1px),
                      linear-gradient(90deg, ${typeConfig.accentHex}10 1px, transparent 1px)
                    `,
                                        backgroundSize: '20px 20px',
                                    }}
                                />
                            </motion.div>

                            {/* Hook reminder (smaller) */}
                            <motion.p
                                className="text-lg text-neutral-400 italic mb-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                            >
                                &ldquo;{discovery.hook}&rdquo;
                            </motion.p>

                            {/* Story lines - revealed progressively */}
                            <div className="space-y-3 min-h-[120px]">
                                {storyLines.map((line, i) => (
                                    <motion.p
                                        key={i}
                                        className="text-base md:text-lg text-white/90 leading-relaxed"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{
                                            opacity: i < visibleLines ? 1 : 0,
                                            x: i < visibleLines ? 0 : -10,
                                        }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    >
                                        {line}
                                    </motion.p>
                                ))}
                            </div>

                            {/* Progress indicator */}
                            <motion.div
                                className="mt-6 flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: typeConfig.accentHex }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(visibleLines / storyLines.length) * 100}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                                <span className="text-xs text-neutral-500">
                                    {visibleLines}/{storyLines.length}
                                </span>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
              PHASE 3: INTERACTION - Meaningful engagement
          ═══════════════════════════════════════════════════════ */}
                    {phase === 'interaction' && (
                        <motion.div
                            key="interaction"
                            className="p-8 pt-16 pb-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Summary of what was learned */}
                            <motion.div
                                className="text-center mb-8"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <p className="text-lg text-white mb-2">{typeConfig.tagline}</p>
                                <p className="text-sm text-neutral-500">
                                    Discovery {index + 1} of {total}
                                </p>
                            </motion.div>

                            {/* Interaction prompt */}
                            <motion.div
                                className="flex flex-col items-center gap-4"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <p className="text-neutral-400 text-sm italic">
                                    {getInteractionPrompt(discovery.type)}
                                </p>

                                {/* Main action button */}
                                <motion.button
                                    className={cn(
                                        'px-8 py-4 rounded-2xl font-semibold text-lg',
                                        'transition-all duration-300',
                                        isCompleted
                                            ? 'bg-nature/30 text-nature border border-nature/30'
                                            : 'text-neutral-900 hover:scale-105'
                                    )}
                                    style={{
                                        backgroundColor: isCompleted ? undefined : typeConfig.accentHex,
                                    }}
                                    onClick={handleInteraction}
                                    disabled={isCompleted}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isCompleted ? (
                                        <span className="flex items-center gap-2">
                                            <span>✓</span>
                                            <span>Understood</span>
                                        </span>
                                    ) : (
                                        <span>I understand this now</span>
                                    )}
                                </motion.button>

                                {/* Progress hint */}
                                <p className="text-xs text-neutral-600 mt-2">
                                    {progressCTA}
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom accent line */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: typeConfig.accentHex }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                />
            </motion.div>
        </motion.div>
    );
}

export default DiscoveryCard;
