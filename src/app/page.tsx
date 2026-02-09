'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { LandingExperience } from '@/components/landing/LandingExperience';

// Dynamically import the exploration view to reduce initial bundle
const ExplorationView = dynamic(
  () => import('@/components/exploration/ExplorationView'),
  {
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
        <div className="w-8 h-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false
  }
);

/**
 * Main page - orchestrates the landing and exploration experiences
 */
export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);

  return (
    <main className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <LandingExperience
            key="landing"
            onEnter={() => setHasEntered(true)}
          />
        ) : (
          <ExplorationView key="exploration" />
        )}
      </AnimatePresence>
    </main>
  );
}
