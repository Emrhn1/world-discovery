'use client';

import { useCallback, useMemo } from 'react';
import { getAccessTokenOrNull } from '@/lib/supabase/browser';

const STORAGE_KEY = 'world-discovery-visited-regions';

function authHeaders(token: string | null): HeadersInit {
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export function useVisitedRegions() {
  const getVisited = useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  const hasVisited = useCallback((regionId: string): boolean => {
    return getVisited().has(regionId);
  }, [getVisited]);

  const markVisited = useCallback((regionId: string): void => {
    if (typeof window === 'undefined') return;

    try {
      const visited = getVisited();
      visited.add(regionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visited)));
    } catch {
      // ignore
    }

    void (async () => {
      const token = await getAccessTokenOrNull();
      if (!token) return;

      await fetch('/api/visited-regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
        body: JSON.stringify({ regionId, regionType: 'place' }),
      });
    })();
  }, [getVisited]);

  const visitedRegions = useMemo(() => getVisited(), [getVisited]);

  return {
    hasVisited,
    markVisited,
    visitedRegions,
  };
}

export default useVisitedRegions;
