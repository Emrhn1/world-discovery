'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Discovery } from '@/types';

interface ProgressRailProps {
    total: number;
    visibleTotal: number;
    discovered: Set<number>;
    heroIndex?: number;
    onStepClick: (index: number) => void;
    hints: string[];
    discoveries: Discovery[];
    hiddenRevealed: Set<number>;
    hasHiddenSecrets: boolean;
}

/**
 * Interactive progress rail with support for variable discovery count,
 * hidden discoveries, and ambient states
 */
export function ProgressRail({
    total,
    visibleTotal,
    discovered,
    heroIndex = 0,
    onStepClick,
    hints,
    discoveries,
    hiddenRevealed,
    hasHiddenSecrets,
}: ProgressRailProps) {
    const allDiscovered = discovered.size >= total;
    const progress = total > 0 ? discovered.size / total : 0;

    // Ambient color based on progress
    const progressHue = Math.round(45 + progress * 30); // gold range
    const glowIntensity = progress * 0.4;

    return (
        <motion.div
            className="flex flex-col items-center gap-2.5 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-1000"
            style={{
                borderColor: allDiscovered
                    ? 'rgba(239,204,77,0.3)'
                    : `rgba(255,255,255,${0.1 + glowIntensity * 0.2})`,
                boxShadow: allDiscovered
                    ? '0 0 30px rgba(239,204,77,0.15)'
                    : `0 0 ${glowIntensity * 20}px rgba(239,204,77,${glowIntensity * 0.3})`,
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
        >
            {/* Title */}
            <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
                Progress
            </span>

            {/* Rail steps */}
            <div className="flex flex-col gap-1.5">
                {discoveries.map((disc, index) => {
                    const isDiscovered = discovered.has(index);
                    const isHero = index === heroIndex;
                    const isHidden = disc.isHidden && !hiddenRevealed.has(index);
                    const wasHiddenNowRevealed = disc.isHidden && hiddenRevealed.has(index);
                    const hint = hints[index] || `Discovery ${index + 1}`;

                    // Hidden and not yet revealed — show mystery indicator
                    if (isHidden) {
                        return (
                            <motion.div
                                key={index}
                                className="group relative flex items-center gap-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 0.4, height: 'auto' }}
                                transition={{ delay: 1 + index * 0.1 }}
                            >
                                <div className="relative flex items-center justify-center rounded-full w-5 h-5 bg-purple-500/10 border border-purple-400/20 border-dashed">
                                    <span className="text-purple-400/50 text-[10px]">?</span>
                                </div>
                                <div className="text-[10px] text-purple-400/30 italic opacity-0 group-hover:opacity-100 transition-opacity">
                                    Secret...
                                </div>
                            </motion.div>
                        );
                    }

                    return (
                        <motion.button
                            key={index}
                            className="group relative flex items-center gap-3 transition-all duration-200 focus:outline-none"
                            onClick={() => onStepClick(index)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.95 }}
                            initial={wasHiddenNowRevealed ? { scale: 0, opacity: 0 } : { opacity: 0, x: 10 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            transition={wasHiddenNowRevealed
                                ? { type: 'spring', stiffness: 400, damping: 15 }
                                : { delay: 0.6 + index * 0.08 }
                            }
                        >
                            {/* Step indicator */}
                            <div
                                className={cn(
                                    'relative flex items-center justify-center rounded-full transition-all duration-300',
                                    isHero ? 'w-8 h-8' : 'w-6 h-6',
                                    isDiscovered
                                        ? wasHiddenNowRevealed
                                            ? 'bg-purple-500/30 border-2 border-purple-400'
                                            : 'bg-accent-500/30 border-2 border-accent-400'
                                        : wasHiddenNowRevealed
                                            ? 'bg-purple-500/10 border-2 border-purple-400/50'
                                            : isHero
                                                ? 'animate-pulse border-2 border-accent-400/50'
                                                : 'bg-white/10 border-2 border-white/30'
                                )}
                            >
                                {isDiscovered ? (
                                    <span className={wasHiddenNowRevealed ? "text-purple-400 text-xs" : "text-accent-400 text-xs"}>✓</span>
                                ) : wasHiddenNowRevealed ? (
                                    <span className="text-purple-400 text-xs">🔮</span>
                                ) : isHero ? (
                                    <span className="text-accent-400 text-sm">★</span>
                                ) : (
                                    <span className="text-white/50 text-xs">{index + 1}</span>
                                )}

                                {isHero && !isDiscovered && (
                                    <div className="absolute inset-0 rounded-full bg-accent-400/20 animate-ping" />
                                )}
                            </div>

                            {/* Hint text on hover */}
                            <div
                                className={cn(
                                    'text-xs max-w-[120px] truncate transition-all duration-200',
                                    'opacity-0 group-hover:opacity-100',
                                    isDiscovered ? 'text-neutral-400' : 'text-neutral-500'
                                )}
                            >
                                {isDiscovered ? (
                                    <span className="line-through">{hint.substring(0, 25)}...</span>
                                ) : wasHiddenNowRevealed ? (
                                    <span className="italic text-purple-300/70">🔮 Secret</span>
                                ) : (
                                    <span className="italic">{isHero ? '★ Main discovery' : 'Tap to reveal'}</span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Hidden secrets hint */}
            <AnimatePresence>
                {hasHiddenSecrets && (
                    <motion.div
                        className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-purple-400/10"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 1.5 }}
                    >
                        <motion.span
                            className="text-[10px] text-purple-400/40 italic"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            Secrets remain...
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completion indicator */}
            <div className="flex items-center gap-2 mt-1.5 pt-2 border-t border-white/10">
                {/* Animated progress bar */}
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden min-w-[40px]">
                    <motion.div
                        className="h-full rounded-full"
                        style={{
                            background: allDiscovered
                                ? 'linear-gradient(90deg, #efcc4d, #22c55e)'
                                : `hsl(${progressHue}, 80%, 55%)`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                <span className="text-sm font-medium text-white">
                    {discovered.size}/{total}
                </span>
                {allDiscovered && (
                    <motion.span
                        className="text-nature text-xs"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        ✨
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
}

export default ProgressRail;
