'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CountryIntro } from '@/components/country/CountryIntro';
import { CountryView } from '@/components/country/CountryView';
import { PlaceOverlay } from '@/components/place/PlaceOverlay';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useSound } from '@/hooks/useSound';
import { getCountryById, getPlaceById } from '@/lib/data';
import type { Country, Place } from '@/types';
import { fadeVariants } from '@/lib/animations';
import { MapReactionsProvider } from '@/hooks/useMapReactions';

// Dynamic import for the map to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('@/components/map/MapContainer'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
            </div>
        ),
    }
);

type ExplorationState = 'map' | 'country-intro' | 'country-view' | 'place-view';

/**
 * Main exploration view after landing
 * Manages the exploration state machine
 */
export function ExplorationView() {
    const [state, setState] = useState<ExplorationState>('map');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>([30, 20]);
    const [mapZoom, setMapZoom] = useState(2.5);

    const { playAmbient, isEnabled } = useSound();

    // Handle country selection
    const handleCountrySelect = useCallback((countryId: string) => {
        const country = getCountryById(countryId);
        if (!country) return;

        setSelectedCountry(country);
        setState('country-intro');

        // Pan map to country
        setMapCenter(country.coords);
        setMapZoom(5);
    }, []);

    // Handle country intro complete
    const handleIntroComplete = useCallback(() => {
        setState('country-view');

        // Start country-specific ambient if enabled
        if (isEnabled && selectedCountry) {
            playAmbient('ancient', 2000);
        }
    }, [isEnabled, selectedCountry, playAmbient]);

    // Handle place selection
    const handlePlaceSelect = useCallback((placeId: string) => {
        const place = getPlaceById(placeId);
        if (!place) return;

        setSelectedPlace(place);
        setState('place-view');

        // Pan map to place
        setMapCenter(place.coords);
        setMapZoom(15);

        // Switch ambient based on place type
        if (isEnabled) {
            const ambienceType = place.type === 'nature' ? 'nature' :
                place.type === 'city' ? 'city' : 'ancient';
            playAmbient(ambienceType, 2000);
        }
    }, [isEnabled, playAmbient]);

    // Handle closing place view
    const handlePlaceClose = useCallback(() => {
        setSelectedPlace(null);
        setState('country-view');

        // Zoom back out
        if (selectedCountry) {
            setMapCenter(selectedCountry.coords);
            setMapZoom(5);
        }
    }, [selectedCountry]);

    // Handle closing country view
    const handleCountryClose = useCallback(() => {
        setSelectedCountry(null);
        setSelectedPlace(null);
        setState('map');

        // Reset map
        setMapCenter([30, 20]);
        setMapZoom(2.5);

        // Reset to default ambient
        if (isEnabled) {
            playAmbient('default', 2000);
        }
    }, [isEnabled, playAmbient]);

    // Play default ambient on mount
    useEffect(() => {
        if (isEnabled) {
            playAmbient('default', 1500);
        }
    }, [isEnabled, playAmbient]);

    return (
        <motion.div
            className="fixed inset-0 bg-neutral-950"
            variants={fadeVariants}
            initial="hidden"
            animate="visible"
        >
            <MapReactionsProvider>
                {/* Map layer - always visible, lower z-index */}
                <div className="absolute inset-0 z-0">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        onCountryClick={handleCountrySelect}
                        onPlaceClick={handlePlaceSelect}
                        selectedCountry={selectedCountry?.id}
                        highlightPlaces={state === 'country-view' || state === 'place-view'}
                    />

                    {/* Map darkening overlay for focus effect */}
                    <AnimatePresence>
                        {state === 'place-view' && (
                            <motion.div
                                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Overlays - higher z-index to appear above map */}
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <div className="pointer-events-auto">
                        <AnimatePresence mode="wait">
                            {/* Country Introduction */}
                            {state === 'country-intro' && selectedCountry && (
                                <CountryIntro
                                    key="country-intro"
                                    country={selectedCountry}
                                    onContinue={handleIntroComplete}
                                />
                            )}

                            {/* Country View with exploration layers */}
                            {state === 'country-view' && selectedCountry && (
                                <CountryView
                                    key="country-view"
                                    country={selectedCountry}
                                    onPlaceSelect={handlePlaceSelect}
                                    onClose={handleCountryClose}
                                />
                            )}

                            {/* Place Detail Overlay */}
                            {state === 'place-view' && selectedPlace && (
                                <PlaceOverlay
                                    key="place-overlay"
                                    place={selectedPlace}
                                    onClose={handlePlaceClose}
                                />
                            )}
                        </AnimatePresence>

                        {/* UI Controls - always visible */}
                        <div className="absolute top-6 right-6 z-30">
                            <SoundToggle showLabel={false} />
                        </div>

                        {/* Back button when in country/place view */}
                        {(state === 'country-view' || state === 'place-view') && (
                            <motion.button
                                className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-sm text-neutral-300 hover:text-white transition-colors"
                                onClick={state === 'place-view' ? handlePlaceClose : handleCountryClose}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <span>←</span>
                                <span>{state === 'place-view' ? 'Back to Country' : 'Back to World'}</span>
                            </motion.button>
                        )}
                    </div>
                </div>
            </MapReactionsProvider>
        </motion.div>
    );
}

export default ExplorationView;
