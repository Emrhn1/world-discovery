'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LearnedProgress } from '@/types';

const STORAGE_KEY = 'learnedPlaces';

/**
 * Hook for managing learned places
 */
export function useLearnedPlaces() {
    const [learned, setLearned] = useState<LearnedProgress>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setLearned(JSON.parse(stored));
            }
        } catch {
            // Use empty state
        }
        setIsLoading(false);
    }, []);

    // Save to localStorage when learned changes
    useEffect(() => {
        if (isLoading) return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(learned));
        } catch {
            // Ignore storage errors
        }
    }, [learned, isLoading]);

    // Mark a place as learned
    const markAsLearned = useCallback((placeId: string) => {
        setLearned(prev => ({
            ...prev,
            [placeId]: {
                learned: true,
                learnedAt: Date.now(),
            },
        }));

        // Mock API call (future-ready)
        mockApiMarkLearned(placeId);
    }, []);

    // Check if a place is learned
    const isLearned = useCallback((placeId: string): boolean => {
        return learned[placeId]?.learned ?? false;
    }, [learned]);

    // Get total learned count
    const getLearnedCount = useCallback((): number => {
        return Object.values(learned).filter(p => p.learned).length;
    }, [learned]);

    // Get all learned place IDs
    const getLearnedIds = useCallback((): string[] => {
        return Object.entries(learned)
            .filter(([, value]) => value.learned)
            .map(([key]) => key);
    }, [learned]);

    // Reset all progress
    const resetProgress = useCallback(() => {
        setLearned({});
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        learned,
        isLoading,
        markAsLearned,
        isLearned,
        getLearnedCount,
        getLearnedIds,
        resetProgress,
    };
}

/**
 * Mock API function for future backend integration
 */
async function mockApiMarkLearned(placeId: string): Promise<void> {
    // In production, this would be:
    // await fetch('/api/learned', {
    //   method: 'POST',
    //   body: JSON.stringify({ placeId }),
    // });

    console.log(`[API Mock] POST /api/learned - placeId: ${placeId}`);
}

/**
 * Mock API function to get progress (for future backend)
 */
export async function mockApiGetProgress(): Promise<LearnedProgress> {
    // In production, this would be:
    // const response = await fetch('/api/progress');
    // return response.json();

    console.log('[API Mock] GET /api/progress');

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

export default useLearnedPlaces;
