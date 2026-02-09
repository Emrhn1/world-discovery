'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/useSound';
import type { AmbienceType } from '@/types';

interface AmbientPlayerProps {
    ambience: AmbienceType;
    showControls?: boolean;
    className?: string;
}

/**
 * Ambient sound player for regions
 * Auto-starts ambient audio and provides visual feedback
 */
export function AmbientPlayer({
    ambience,
    showControls = true,
    className
}: AmbientPlayerProps) {
    const { isEnabled, volume, playAmbient, toggle, setVolume } = useSound();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showVolume, setShowVolume] = useState(false);

    // Auto-start ambient when enabled
    useEffect(() => {
        if (isEnabled) {
            playAmbient(ambience, 1500);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [isEnabled, ambience, playAmbient]);

    // Ambient type icons
    const ambienceInfo = {
        nature: { icon: '🌿', label: 'Nature Sounds' },
        city: { icon: '🏙️', label: 'City Ambience' },
        ancient: { icon: '🏛️', label: 'Ancient Atmosphere' },
        default: { icon: '🎵', label: 'Ambient' },
    };

    const info = ambienceInfo[ambience];

    if (!showControls) return null;

    return (
        <motion.div
            className={cn(
                'flex items-center gap-2 px-3 py-2',
                'bg-black/30 backdrop-blur-md rounded-xl border border-white/10',
                className
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
        >
            {/* Sound toggle */}
            <button
                onClick={toggle}
                className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    isEnabled
                        ? 'bg-accent-500/20 text-accent-400'
                        : 'bg-white/5 text-neutral-500'
                )}
                aria-label={isEnabled ? 'Mute sound' : 'Enable sound'}
            >
                {isEnabled ? '🔊' : '🔇'}
            </button>

            {/* Ambient indicator */}
            <AnimatePresence>
                {isEnabled && isPlaying && (
                    <motion.div
                        className="flex items-center gap-2"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                    >
                        <span className="text-sm">{info.icon}</span>
                        <span className="text-xs text-neutral-400">{info.label}</span>

                        {/* Audio visualizer bars */}
                        <div className="flex items-center gap-0.5 h-4">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-0.5 bg-accent-400 rounded-full"
                                    animate={{
                                        height: ['8px', '16px', '8px'],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Volume slider */}
            <div
                className="relative"
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
            >
                <button
                    className="w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-white"
                    aria-label="Volume"
                >
                    <span className="text-xs">♪</span>
                </button>

                <AnimatePresence>
                    {showVolume && (
                        <motion.div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-neutral-900 rounded-lg border border-white/10"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume * 100}
                                onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
                                className="w-20 accent-accent-400"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export default AmbientPlayer;
