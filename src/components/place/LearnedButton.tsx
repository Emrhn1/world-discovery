'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LearnedButtonProps {
    isLearned: boolean;
    onLearn: () => void;
    className?: string;
}

/**
 * "I've Learned This" button with knowledge capsule animation
 */
export function LearnedButton({ isLearned, onLearn, className }: LearnedButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleClick = () => {
        if (isLearned || isAnimating) return;

        setIsAnimating(true);

        // Trigger animation, then call onLearn
        setTimeout(() => {
            onLearn();
            setIsAnimating(false);
        }, 600);
    };

    return (
        <div className={cn('relative', className)}>
            <motion.button
                onClick={handleClick}
                disabled={isLearned}
                className={cn(
                    'relative w-full py-4 px-6 rounded-xl font-medium text-lg',
                    'transition-all duration-300',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                    isLearned
                        ? 'bg-nature/20 text-nature border border-nature/30 cursor-default'
                        : 'bg-accent-500 hover:bg-accent-400 text-neutral-900 hover:scale-[1.02]'
                )}
                whileTap={isLearned ? {} : { scale: 0.98 }}
            >
                <span className="flex items-center justify-center gap-2">
                    {isLearned ? (
                        <>
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                ✓
                            </motion.span>
                            <span>Learned!</span>
                        </>
                    ) : (
                        <>
                            <span>💡</span>
                            <span>I&apos;ve learned this</span>
                        </>
                    )}
                </span>
            </motion.button>

            {/* Knowledge capsule animation */}
            <AnimatePresence>
                {isAnimating && (
                    <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{
                            scale: [1, 1.5, 2],
                            opacity: [1, 1, 0],
                            y: [0, -30, -60],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="w-12 h-12 rounded-full bg-accent-400 flex items-center justify-center shadow-glow-lg">
                            <span className="text-2xl">💡</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Particle effects when learned */}
            <AnimatePresence>
                {isAnimating && (
                    <>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-accent-400"
                                initial={{
                                    x: 0,
                                    y: 0,
                                    opacity: 1,
                                    scale: 1,
                                }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 8) * 80,
                                    y: Math.sin((i * Math.PI * 2) / 8) * 80 - 20,
                                    opacity: 0,
                                    scale: 0,
                                }}
                                transition={{
                                    duration: 0.6,
                                    delay: 0.1,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LearnedButton;
