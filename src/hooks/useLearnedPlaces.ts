'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LearnedProgress } from '@/types';
import { getAccessTokenOrNull } from '@/lib/supabase/browser';

const STORAGE_KEY = 'learnedPlaces';

function authHeaders(token: string | null): HeadersInit {
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export function useLearnedPlaces() {
  const [learned, setLearned] = useState<LearnedProgress>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // local fallback first
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && !cancelled) {
          setLearned(JSON.parse(stored));
        }
      } catch {
        // ignore
      }

      try {
        const token = await getAccessTokenOrNull();
        if (!token) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const response = await fetch('/api/progress', {
          method: 'GET',
          headers: authHeaders(token),
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json() as { progress?: LearnedProgress };
          if (!cancelled && data.progress) {
            setLearned(data.progress);
          }
        }
      } catch {
        // keep local fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(learned));
    } catch {
      // Ignore storage errors
    }
  }, [learned, isLoading]);

  const markAsLearned = useCallback((placeId: string) => {
    const learnedAt = Date.now();

    setLearned(prev => ({
      ...prev,
      [placeId]: {
        learned: true,
        learnedAt,
      },
    }));

    void (async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return;

      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
        body: JSON.stringify({ placeId }),
      });
    })();
  }, []);

  const isLearned = useCallback((placeId: string): boolean => {
    return learned[placeId]?.learned ?? false;
  }, [learned]);

  const getLearnedCount = useCallback((): number => {
    return Object.values(learned).filter(p => p.learned).length;
  }, [learned]);

  const getLearnedIds = useCallback((): string[] => {
    return Object.entries(learned)
      .filter(([, value]) => value.learned)
      .map(([key]) => key);
  }, [learned]);

  const resetProgress = useCallback(() => {
    setLearned({});
    localStorage.removeItem(STORAGE_KEY);

    void (async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return;

      await fetch('/api/progress', {
        method: 'DELETE',
        headers: authHeaders(token),
      });
    })();
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

export default useLearnedPlaces;
