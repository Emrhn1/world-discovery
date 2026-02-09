'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from './Globe';
import { DiscoveryTeasers } from './DiscoveryTeasers';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';
import { fadeUpVariants, scaleVariants, cinematicRevealVariants } from '@/lib/animations';

interface LandingExperienceProps {
    onEnter: () => void;
}

// Poetic teasers for the landing page
const poeticTeasers = [
    "Where ancient stones remember what we've forgotten",
    "Every journey begins with a single question",
    "The world holds secrets for those who seek",
    "Beyond maps, there are stories waiting",
];

/**
 * Cinematic landing experience
 * Fullscreen immersive intro with globe and discovery teasers
 */
export function LandingExperience({ onEnter }: LandingExperienceProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [currentTeaser] = useState(() =>
        poeticTeasers[Math.floor(Math.random() * poeticTeasers.length)]
    );
    const { initialize, isInitialized, playAmbient, isEnabled } = useSound();

    const handleEnter = useCallback(async () => {
        setIsExiting(true);

        // Initialize sound if not already
        if (!isInitialized) {
            await initialize();
        }

        // Start ambient sound if enabled
        if (isEnabled) {
            await playAmbient('default', 1500);
        }

        // Wait for exit animation
        setTimeout(() => {
            onEnter();
        }, 800);
    }, [initialize, isInitialized, playAmbient, isEnabled, onEnter]);

    const handleCountryClick = useCallback((countryId: string) => {
        console.log('Country clicked from landing:', countryId);
        // Could potentially navigate directly to that country
        handleEnter();
    }, [handleEnter]);

    return (
        <AnimatePresence mode="wait">
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-50 bg-neutral-950 overflow-hidden"
                    variants={cinematicRevealVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Background grain texture */}
                    <div className="absolute inset-0 grain opacity-30" />

                    {/* Vignette overlay */}
                    <div className="absolute inset-0 vignette pointer-events-none" />

                    {/* Main content grid */}
                    <div className="relative h-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-16">

                        {/* Left side - Globe */}
                        <div className="flex items-center justify-center lg:justify-end">
                            <Globe
                                className="w-full max-w-[500px] aspect-square"
                                onCountryClick={handleCountryClick}
                            />
                        </div>

                        {/* Right side - Content */}
                        <div className="flex flex-col justify-center items-center lg:items-start gap-12">

                            {/* Title */}
                            <motion.div
                                variants={fadeUpVariants}
                                initial="hidden"
                                animate="visible"
                                className="text-center lg:text-left"
                            >
                                <h1 className="font-display text-display-lg md:text-display-xl text-gradient mb-4">
                                    Discover
                                </h1>
                                <p className="text-body-lg text-neutral-400 max-w-md text-balance">
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
                                        'group relative px-10 py-4 rounded-full',
                                        'bg-gradient-to-r from-accent-500 to-accent-600',
                                        'text-neutral-900 font-semibold text-lg',
                                        'transition-all duration-300',
                                        'hover:scale-105 hover:shadow-glow-lg',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950'
                                    )}
                                    aria-label="Enter the discovery experience"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Enter
                                        <motion.span
                                            className="inline-block"
                                            animate={{ x: [0, 5, 0] }}
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

                                {/* Sound toggle */}
                                <SoundToggle />
                            </motion.div>
                        </div>
                    </div>

                    {/* Bottom decorative element */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.6 }}
                    >
                        <motion.div
                            className="w-6 h-10 rounded-full border-2 border-neutral-600 flex items-start justify-center p-2"
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
