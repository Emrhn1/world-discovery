import type { DiscoveryType } from '@/types';

/**
 * Discovery type configuration
 * Each type has unique visual identity for the card experience
 */
export interface DiscoveryTypeConfig {
    label: string;
    icon: string;
    color: string;        // Tailwind color class
    accentHex: string;    // Hex for custom styling
    animation: string;    // Micro-animation style
    tagline: string;      // Flavor text
}

export const DISCOVERY_TYPES: Record<DiscoveryType, DiscoveryTypeConfig> = {
    'historical-insight': {
        label: 'Historical Insight',
        icon: '📜',
        color: 'amber',
        accentHex: '#f59e0b',
        animation: 'fade-scroll',
        tagline: 'A glimpse into the past',
    },
    'engineering-mystery': {
        label: 'Engineering Mystery',
        icon: '⚙️',
        color: 'cyan',
        accentHex: '#06b6d4',
        animation: 'blueprint-reveal',
        tagline: 'How did they do it?',
    },
    'cultural-shift': {
        label: 'Cultural Shift',
        icon: '🌍',
        color: 'purple',
        accentHex: '#a855f7',
        animation: 'wave-in',
        tagline: 'A change that echoed through time',
    },
    'turning-point': {
        label: 'Turning Point',
        icon: '⚡',
        color: 'rose',
        accentHex: '#f43f5e',
        animation: 'flash-reveal',
        tagline: 'The moment everything changed',
    },
    'hidden-detail': {
        label: 'Hidden Detail',
        icon: '🔍',
        color: 'emerald',
        accentHex: '#10b981',
        animation: 'zoom-focus',
        tagline: 'What most people miss',
    },
};

/**
 * Get config for a discovery type
 */
export function getDiscoveryTypeConfig(type: DiscoveryType): DiscoveryTypeConfig {
    return DISCOVERY_TYPES[type];
}

/**
 * Get adaptive CTA text based on progress
 */
export function getProgressCTA(discovered: number, total: number): string {
    const progress = discovered / total;

    if (progress === 0) {
        return 'Begin your discovery';
    } else if (progress < 0.5) {
        return 'Other secrets remain here';
    } else if (progress < 1) {
        return "You're close to understanding this place";
    } else {
        return 'You now understand this place';
    }
}

/**
 * Get completion message based on progress
 */
export function getCompletionMessage(discovered: number, total: number): string {
    const remaining = total - discovered;

    if (remaining === 0) {
        return 'All discoveries revealed';
    } else if (remaining === 1) {
        return '1 secret remains';
    } else {
        return `${remaining} secrets remain`;
    }
}

export default DISCOVERY_TYPES;
