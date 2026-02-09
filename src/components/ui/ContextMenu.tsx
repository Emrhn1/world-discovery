'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
    title: string;
    icon: string;
    className?: string;
}

interface MenuItem {
    id: string;
    label: string;
    icon: string;
    locked: boolean;
    active?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: '🗺️', locked: false, active: true },
    { id: 'timeline', label: 'Timeline', icon: '📅', locked: true },
    { id: 'discoveries', label: 'Your Discoveries', icon: '💡', locked: true },
];

/**
 * Context switch menu - clickable title with dropdown
 * Shows current view and locked future features
 */
export function ContextMenu({ title, icon, className }: ContextMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleItemClick = (item: MenuItem) => {
        if (item.locked) {
            // Could show a toast or hint here
            return;
        }
        setIsOpen(false);
    };

    return (
        <div ref={menuRef} className={cn('relative', className)}>
            {/* Trigger button */}
            <motion.button
                className={cn(
                    'flex items-center gap-2 px-4 py-2',
                    'bg-black/40 backdrop-blur-md rounded-xl border border-white/10',
                    'text-white hover:bg-black/60 transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400'
                )}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className="text-lg">{icon}</span>
                <span className="font-display text-lg">{title}</span>
                <motion.span
                    className="text-neutral-400 text-sm ml-1"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                >
                    ▾
                </motion.span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={cn(
                            'absolute top-full left-0 mt-2 w-56',
                            'bg-neutral-900/95 backdrop-blur-md rounded-xl border border-white/10',
                            'shadow-xl overflow-hidden z-50'
                        )}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                    >
                        {MENU_ITEMS.map((item, index) => (
                            <motion.button
                                key={item.id}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3',
                                    'text-left transition-colors',
                                    item.locked
                                        ? 'text-neutral-500 cursor-not-allowed'
                                        : 'text-white hover:bg-white/5',
                                    item.active && 'bg-accent-500/10 border-l-2 border-accent-400'
                                )}
                                onClick={() => handleItemClick(item)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <span className={cn(item.locked && 'opacity-50')}>{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                                {item.locked && (
                                    <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-neutral-500">
                                        Soon
                                    </span>
                                )}
                                {item.active && (
                                    <span className="text-accent-400 text-xs">●</span>
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ContextMenu;
