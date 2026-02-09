'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cinematicRevealVariants, fadeUpVariants } from '@/lib/animations';
import type { Country } from '@/types';

interface CountryIntroProps {
    country: Country;
    onContinue: () => void;
}

/**
 * Atmospheric country introduction
 * Fullscreen overlay with dramatic text and effects
 */
export function CountryIntro({ country, onContinue }: CountryIntroProps) {
    const [showContinue, setShowContinue] = useState(false);

    // Show continue button after intro text
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContinue(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    // Auto-continue after some time or on any click
    useEffect(() => {
        const handler = () => {
            if (showContinue) {
                onContinue();
            }
        };

        window.addEventListener('click', handler);
        window.addEventListener('keydown', handler);

        return () => {
            window.removeEventListener('click', handler);
            window.removeEventListener('keydown', handler);
        };
    }, [showContinue, onContinue]);

    return (
        <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            variants={cinematicRevealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Dark overlay with blur */}
            <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-sm" />

            {/* Grain texture */}
            <div className="absolute inset-0 grain opacity-20" />

            {/* Vignette effect */}
            <div className="absolute inset-0 vignette" />

            {/* Content */}
            <div className="relative z-10 text-center px-8 max-w-3xl">
                {/* Flag and country name */}
                <motion.div
                    className="mb-8"
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {country.flag && (
                        <span className="text-6xl mb-4 block">{country.flag}</span>
                    )}
                    <h2 className="font-display text-display-md text-gradient-gold">
                        {country.name}
                    </h2>
                </motion.div>

                {/* Dramatic intro text */}
                <motion.p
                    className="text-body-lg text-neutral-300 leading-relaxed text-balance"
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                >
                    {country.dramaticIntro}
                </motion.p>

                {/* Continue button */}
                <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: showContinue ? 1 : 0,
                        y: showContinue ? 0 : 20
                    }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={onContinue}
                        className={cn(
                            'group flex items-center gap-2 mx-auto',
                            'text-sm text-neutral-400 hover:text-accent-400',
                            'transition-colors duration-300'
                        )}
                    >
                        <span>Continue to explore</span>
                        <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                        >
                            →
                        </motion.span>
                    </button>

                    {/* Hint */}
                    <p className="text-xs text-neutral-600 mt-3">
                        Click anywhere or press any key
                    </p>
                </motion.div>
            </div>
        </motion.div>
    );
}

export default CountryIntro;
