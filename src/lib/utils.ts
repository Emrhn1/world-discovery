import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format coordinates for display
 */
export function formatCoords(coords: [number, number]): string {
    const [lat, lng] = coords;
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
}

/**
 * Delay helper for animations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Generate a unique ID
 */
export function uniqueId(prefix = 'id'): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    ms: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return function (...args: Parameters<T>) {
        const now = Date.now();
        if (now - lastCall >= ms) {
            lastCall = now;
            fn(...args);
        }
    };
}
