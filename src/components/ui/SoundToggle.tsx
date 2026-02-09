'use client';

import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
    className?: string;
    showLabel?: boolean;
}

/**
 * Sound toggle button with volume control
 */
export function SoundToggle({ className, showLabel = true }: SoundToggleProps) {
    const { isEnabled, volume, toggle, setVolume, initialize, isInitialized } = useSound();

    const handleToggle = async () => {
        if (!isInitialized) {
            await initialize();
        }
        toggle();
    };

    return (
        <motion.div
            className={cn(
                'flex items-center gap-3',
                className
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
        >
            <button
                onClick={handleToggle}
                className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full',
                    'glass-panel transition-all duration-300',
                    'hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                    isEnabled && 'ring-1 ring-accent-400/50'
                )}
                aria-label={isEnabled ? 'Mute sound' : 'Enable sound'}
                aria-pressed={isEnabled}
            >
                {isEnabled ? (
                    <SpeakerWaveIcon className="w-5 h-5 text-accent-400" />
                ) : (
                    <SpeakerXMarkIcon className="w-5 h-5 text-neutral-400" />
                )}

                {/* Pulse indicator when enabled */}
                {isEnabled && (
                    <motion.span
                        className="absolute inset-0 rounded-full bg-accent-400/20"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </button>

            {/* Volume slider - only show when enabled */}
            {isEnabled && (
                <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                >
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:bg-accent-400
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:hover:scale-125"
                        aria-label="Volume"
                    />
                </motion.div>
            )}

            {showLabel && !isEnabled && (
                <motion.span
                    className="text-sm text-neutral-400 font-medium"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Sound on for full experience
                </motion.span>
            )}
        </motion.div>
    );
}

// Icon components
function SpeakerWaveIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
    );
}

function SpeakerXMarkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
    );
}

export default SoundToggle;
