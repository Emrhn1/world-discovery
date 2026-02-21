// src/components/landing/LandingExperience.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from './Globe';
import { DiscoveryTeasers } from './DiscoveryTeasers';
import { LandmarkDome } from './LandmarkDome';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { fadeUpVariants, scaleVariants, cinematicRevealVariants } from '@/lib/animations';

interface LandingExperienceProps {
    onEnter: () => void;
}

const poeticTeasers = [
    "Where ancient stones remember what we've forgotten",
    "Every journey begins with a single question",
    "The world holds secrets for those who seek",
    "Beyond maps, there are stories waiting",
];

/**
 * Cinematic landing experience
 * Fullscreen immersive intro with globe, text, and dome gallery
 */
export function LandingExperience({ onEnter }: LandingExperienceProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [currentTeaser] = useState(() =>
        poeticTeasers[Math.floor(Math.random() * poeticTeasers.length)]
    );
    const { initialize, isInitialized, playAmbient, isEnabled } = useSound();

    const handleEnter = useCallback(async () => {
        setIsExiting(true);
        if (!isInitialized) await initialize();
        if (isEnabled) await playAmbient('default', 1500);
        setTimeout(() => { onEnter(); }, 800);
    }, [initialize, isInitialized, playAmbient, isEnabled, onEnter]);

    const handleCountryClick = useCallback((_countryId: string) => {
        handleEnter();
    }, [handleEnter]);

    return (
        <AnimatePresence mode="wait">
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-50 bg-neutral-950 overflow-y-auto overflow-x-hidden"
                    variants={cinematicRevealVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Background grain texture */}
                    <div className="absolute inset-0 grain opacity-30 pointer-events-none" />

                    {/* Animated background particles */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full"
                                style={{
                                    width: 2 + Math.random() * 3,
                                    height: 2 + Math.random() * 3,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    background: i % 3 === 0
                                        ? 'rgba(239, 204, 77, 0.4)'
                                        : 'rgba(100, 180, 255, 0.3)',
                                }}
                                animate={{
                                    y: [0, -30 - Math.random() * 40, 0],
                                    opacity: [0, 0.8, 0],
                                    scale: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 4 + Math.random() * 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 5,
                                    ease: 'easeInOut',
                                }}
                            />
                        ))}
                    </div>

                    {/* Vignette overlay */}
                    <div className="absolute inset-0 vignette pointer-events-none" />

                    {/* ─── Hero Section: Globe + Content ─── */}
                    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 p-8 lg:px-20 lg:py-16">

                        {/* Left side - Globe */}
                        <div className="flex items-center justify-center lg:justify-end">
                            <Globe
                                className="w-full max-w-[520px] aspect-square"
                                onCountryClick={handleCountryClick}
                            />
                        </div>

                        {/* Right side - Content */}
                        <div className="flex flex-col justify-center items-center lg:items-start gap-14">

                            {/* Title */}
                            <motion.div
                                variants={fadeUpVariants}
                                initial="hidden"
                                animate="visible"
                                className="text-center lg:text-left"
                            >
                                <motion.div
                                    className="inline-block mb-4 px-4 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/5"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <span className="text-accent-400 text-sm font-medium tracking-wider uppercase">
                                        Explore the World
                                    </span>
                                </motion.div>

                                <h1 className="font-display text-display-lg md:text-display-xl text-gradient mb-6">
                                    Discover
                                </h1>
                                <p className="text-body-lg text-neutral-400 max-w-md text-balance leading-relaxed">
                                    {currentTeaser}
                                </p>
                            </motion.div>

                            {/* Discovery teasers */}
                            <motion.div
                                className="hidden md:block"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                <DiscoveryTeasers className="pl-6" />
                            </motion.div>

                            {/* CTA Button */}
                            <motion.div
                                variants={scaleVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 1.2 }}
                                className="flex flex-col items-center lg:items-start gap-6"
                            >
                                <button
                                    onClick={handleEnter}
                                    className={cn(
                                        'group relative px-12 py-5 rounded-full',
                                        'bg-gradient-to-r from-accent-500 to-accent-600',
                                        'text-neutral-900 font-semibold text-lg',
                                        'transition-all duration-300',
                                        'hover:scale-105 hover:shadow-glow-lg',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'
                                    )}
                                    aria-label="Enter the discovery experience"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Begin Your Journey
                                        <motion.span
                                            className="inline-block text-xl"
                                            animate={{ x: [0, 6, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            →
                                        </motion.span>
                                    </span>

                                    {/* Glow effect */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-accent-400/30 blur-xl"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                    />
                                </button>

                                <SoundToggle />
                            </motion.div>
                        </div>
                    </div>

                    {/* ─── Dome Gallery Section ─── */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.8, duration: 1.2 }}
                    >
                        {/* Section heading */}
                        <div className="text-center mb-2 px-8">
                            <motion.p
                                className="text-neutral-500 text-sm uppercase tracking-[0.3em] font-medium"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2.0 }}
                            >
                                Iconic Landmarks Await
                            </motion.p>
                        </div>

                        <LandmarkDome />
                    </motion.div>

                    {/* Bottom scroll indicator */}
                    <motion.div
                        className="sticky bottom-8 flex justify-center pb-8 pointer-events-none"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.6 }}
                    >
                        <motion.div
                            className="w-6 h-10 rounded-full border-2 border-neutral-600 flex items-start justify-center p-2 pointer-events-auto"
                            aria-hidden="true"
                        >
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-neutral-400"
                                animate={{ y: [0, 12, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default LandingExperience;