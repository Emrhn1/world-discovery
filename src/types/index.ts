// Country data type
export interface Country {
    id: string;
    name: string;
    coords: [number, number]; // [lat, lng]
    teaser: string;
    ambience: string; // audio file reference
    places: string[]; // place IDs
    flag?: string; // emoji flag
    dramaticIntro: string; // atmospheric intro text
}

// Place types for categorization
export type PlaceType = 'historical' | 'nature' | 'city';

// Media types
export interface Media {
    type: 'image' | 'video';
    src: string;
    alt?: string;
}

// Video with timeline facts
export interface Video {
    src: string;
    duration: number; // seconds
    timelineFacts?: {
        time: number; // seconds
        fact: string;
    }[];
}

// Discovery types for visual variety
export type DiscoveryType =
    | 'historical-insight'
    | 'engineering-mystery'
    | 'cultural-shift'
    | 'turning-point'
    | 'hidden-detail';

// Hidden discovery trigger types
export type HiddenTrigger = 'long-hover' | 'double-click' | 'chain';

// Individual discovery/fact with type
export interface Discovery {
    hook: string;           // Dramatic one-liner (Phase 1)
    story: string;          // Short story paragraph (Phase 2)
    type: DiscoveryType;    // Category for styling
    isHero?: boolean;       // Main discovery of the place
    isHidden?: boolean;     // Not visible initially
    hiddenTrigger?: HiddenTrigger; // How player reveals it
    chainRequires?: number[]; // Indices that must be found first (for 'chain')
    position?: { top: string; left: string }; // Custom hotspot position
}

// Place data type
export interface Place {
    id: string;
    name: string;
    countryId: string;
    coords: [number, number]; // [lat, lng]
    type: PlaceType;
    teaser: string; // one-line dramatic teaser
    shortStory: string; // paragraph description
    bullets: string[]; // legacy - kept for compatibility
    discoveries?: Discovery[]; // typed discoveries with phases
    scenes?: Scene[];                   // NEW: photo-based exploration
    timelinePhotos?: TimelinePhoto[];   // NEW: different time periods
    media: Media[];
    video?: Video;
    ambience?: string; // place-specific ambient sound
    zones?: Zone[];    // interactive map zones
}

export interface Zone {
    name: string;
    coords: [number, number][]; // Polygon coordinates
    color?: string;
    description?: string;
}

// Learned progress tracking
export interface LearnedProgress {
    [placeId: string]: {
        learned: boolean;
        learnedAt: number; // timestamp
    };
}

// Sound profile types
export type AmbienceType = 'nature' | 'city' | 'ancient' | 'default';

// Sound state
export interface SoundState {
    enabled: boolean;
    volume: number; // 0-1
    currentAmbience: AmbienceType | null;
}

// Discovery state for experience flow
export interface DiscoveryState {
    hasEntered: boolean; // passed landing screen
    currentCountry: string | null;
    currentPlace: string | null;
    activeLayer: PlaceType | null;
    showIntro: boolean;
}

// Exploration layer button
export interface ExplorationLayer {
    type: PlaceType;
    label: string;
    icon: string;
    color: string;
}

// Animation variants for Framer Motion
export interface AnimationConfig {
    initial: object;
    animate: object;
    exit?: object;
    transition?: object;
}

// ═══ SCENE-BASED EXPLORATION ═══

/** A single info hotspot on a scene photo */
export interface SceneHotspot {
    id: string;
    position: { top: string; left: string };
    icon: string;           // emoji or symbol shown on the photo
    title: string;
    description: string;
    type?: DiscoveryType;   // for accent color theming
}

/** A photo scene with positioned hotspots */
export interface Scene {
    id: string;
    title: string;          // e.g. "Exterior View", "Interior - Great Dome"
    description?: string;
    src: string;
    alt?: string;
    hotspots: SceneHotspot[];
}

/** A historical photo from a specific time period */
export interface TimelinePhoto {
    era: string;            // e.g. "Byzantine (537 AD)"
    year: number;
    src: string;
    description: string;
}
