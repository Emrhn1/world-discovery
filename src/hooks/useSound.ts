'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import SoundManager, { type UISoundType } from '@/lib/sound/SoundManager';
import type { AmbienceType } from '@/types';

/**
 * Hook for interacting with the SoundManager
 */
export function useSound() {
    const soundManagerRef = useRef<SoundManager | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [volume, setVolumeState] = useState(0.7);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize sound manager
    useEffect(() => {
        soundManagerRef.current = SoundManager.getInstance();
        const state = soundManagerRef.current.getState();
        setIsEnabled(state.enabled);
        setVolumeState(state.volume);

        return () => {
            // Don't dispose on unmount - keep singleton alive
        };
    }, []);

    // Initialize audio context (requires user interaction)
    const initialize = useCallback(async () => {
        if (!soundManagerRef.current) return;

        await soundManagerRef.current.initialize();
        setIsInitialized(true);

        // Update state after initialization
        const state = soundManagerRef.current.getState();
        setIsEnabled(state.enabled);
        setVolumeState(state.volume);
    }, []);

    // Toggle sound
    const toggle = useCallback(() => {
        if (!soundManagerRef.current) return false;

        const newState = soundManagerRef.current.toggle();
        setIsEnabled(newState);
        return newState;
    }, []);

    // Set enabled
    const setEnabled = useCallback((enabled: boolean) => {
        if (!soundManagerRef.current) return;

        soundManagerRef.current.setEnabled(enabled);
        setIsEnabled(enabled);
    }, []);

    // Set volume
    const setVolume = useCallback((vol: number) => {
        if (!soundManagerRef.current) return;

        soundManagerRef.current.setVolume(vol);
        setVolumeState(vol);
    }, []);

    // Play ambient
    const playAmbient = useCallback(async (type: AmbienceType, crossfade = 2000) => {
        if (!soundManagerRef.current || !isInitialized) return;

        await soundManagerRef.current.playAmbient(type, crossfade);
    }, [isInitialized]);

    // Stop ambient
    const stopAmbient = useCallback((fade = 1000) => {
        if (!soundManagerRef.current) return;

        soundManagerRef.current.stopAmbient(fade);
    }, []);

    // Play UI sound
    const playUI = useCallback(async (type: UISoundType) => {
        if (!soundManagerRef.current || !isInitialized) return;

        await soundManagerRef.current.playUI(type);
    }, [isInitialized]);

    return {
        isEnabled,
        isInitialized,
        volume,
        initialize,
        toggle,
        setEnabled,
        setVolume,
        playAmbient,
        stopAmbient,
        playUI,
    };
}

export default useSound;
