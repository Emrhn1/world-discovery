'use client';

import { useCallback, useMemo } from 'react';

const STORAGE_KEY = 'world-discovery-visited-regions';

/**
 * Hook for tracking which regions the user has visited
 * Used to show intro card only on first visit
 */
export function useVisitedRegions() {
    // Get visited regions from localStorage
    const getVisited = useCallback((): Set<string> => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    }, []);

    // Check if a region has been visited
    const hasVisited = useCallback((regionId: string): boolean => {
        return getVisited().has(regionId);
    }, [getVisited]);

    // Mark a region as visited
    const markVisited = useCallback((regionId: string): void => {
        if (typeof window === 'undefined') return;
        try {
            const visited = getVisited();
            visited.add(regionId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visited)));
        } catch {
            // Silently fail if localStorage is unavailable
        }
    }, [getVisited]);

    // Get all visited region IDs
    const visitedRegions = useMemo(() => getVisited(), [getVisited]);

    return {
        hasVisited,
        markVisited,
        visitedRegions,
    };
}

export default useVisitedRegions;
