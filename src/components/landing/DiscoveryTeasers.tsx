'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations';

interface DiscoveryTeasersProps {
    className?: string;
}

// Teaser phrases that evoke curiosity
const teasers = [
    { text: 'Ancient Harbor', delay: 0 },
    { text: 'Hidden Palace', delay: 0.1 },
    { text: 'Stone & Wind', delay: 0.2 },
    { text: 'Sacred Peak', delay: 0.3 },
    { text: 'Lost Empire', delay: 0.4 },
    { text: 'Eternal Flame', delay: 0.5 },
    { text: 'Forgotten Path', delay: 0.6 },
    { text: 'Golden Dawn', delay: 0.7 },
];

/**
 * Discovery teasers that appear on the landing page
 * Short, evocative phrases to spark curiosity
 */
export function DiscoveryTeasers({ className }: DiscoveryTeasersProps) {
    return (
        <motion.div
            className={cn('flex flex-col gap-4', className)}
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
        >
            {teasers.map((teaser, index) => (
                <motion.div
                    key={teaser.text}
                    variants={staggerItemVariants}
                    className="group relative"
                    custom={index}
                >
                    <motion.span
                        className={cn(
                            'inline-block text-teaser uppercase tracking-widest',
                            'text-neutral-400 transition-colors duration-300',
                            'group-hover:text-accent-400'
                        )}
                        whileHover={{
                            x: 10,
                            transition: { duration: 0.2 },
                        }}
                    >
                        {teaser.text}
                    </motion.span>

                    {/* Decorative line */}
                    <motion.div
                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-px bg-accent-400/50"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
}

export default DiscoveryTeasers;
