import type { AmbienceType, SoundState } from '@/types';

// Sound file paths
const AMBIENT_SOUNDS: Record<AmbienceType, string> = {
    nature: '/sounds/ambient/nature.mp3',
    city: '/sounds/ambient/city.mp3',
    ancient: '/sounds/ambient/ancient.mp3',
    default: '/sounds/ambient/default.mp3',
};

const UI_SOUNDS = {
    hover: '/sounds/ui/hover.mp3',
    click: '/sounds/ui/click.mp3',
    success: '/sounds/ui/success.mp3',
} as const;

type UISoundType = keyof typeof UI_SOUNDS;

/**
 * SoundManager - Web Audio API wrapper for immersive audio experience
 * Singleton pattern ensures only one audio context exists
 */
class SoundManager {
    private static instance: SoundManager | null = null;

    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientGain: GainNode | null = null;
    private uiGain: GainNode | null = null;

    private currentAmbientSource: AudioBufferSourceNode | null = null;
    private currentAmbientBuffer: AudioBuffer | null = null;
    private loadedBuffers: Map<string, AudioBuffer> = new Map();

    private state: SoundState = {
        enabled: false,
        volume: 0.7,
        currentAmbience: null,
    };

    private fadeInterval: NodeJS.Timeout | null = null;

    private constructor() {
        // Private constructor for singleton
        this.initializeFromStorage();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    public async initialize(): Promise<void> {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.ambientGain = this.audioContext.createGain();
            this.uiGain = this.audioContext.createGain();

            // Connect nodes
            this.ambientGain.connect(this.masterGain);
            this.uiGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // Set initial volumes
            this.masterGain.gain.value = this.state.enabled ? this.state.volume : 0;
            this.ambientGain.gain.value = 0.5;
            this.uiGain.gain.value = 0.3;

            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log('[SoundManager] Initialized');
        } catch (error) {
            console.error('[SoundManager] Failed to initialize:', error);
        }
    }

    /**
     * Load sound state from localStorage
     */
    private initializeFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem('soundState');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.state.enabled = parsed.enabled ?? false;
                this.state.volume = parsed.volume ?? 0.7;
            }
        } catch {
            // Use defaults
        }
    }

    /**
     * Save sound state to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('soundState', JSON.stringify({
                enabled: this.state.enabled,
                volume: this.state.volume,
            }));
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Load an audio file or generate fallback
     */
    private async loadSound(url: string, type?: UISoundType | AmbienceType): Promise<AudioBuffer | null> {
        if (!this.audioContext) return null;

        // Check cache
        if (this.loadedBuffers.has(url)) {
            return this.loadedBuffers.get(url)!;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.loadedBuffers.set(url, audioBuffer);
            return audioBuffer;
        } catch {
            console.warn(`[SoundManager] Failed to load sound: ${url}, generating fallback`);
            if (type) {
                const fallback = this.generateFallbackSound(type);
                if (fallback) {
                    this.loadedBuffers.set(url, fallback);
                    return fallback;
                }
            }
            return null;
        }
    }

    /**
     * Generate procedural sound for missing files
     */
    private generateFallbackSound(type: string): AudioBuffer | null {
        if (!this.audioContext) return null;
        const ctx = this.audioContext;
        const sampleRate = ctx.sampleRate;

        // Helper to create buffer
        const createBuffer = (duration: number, generate: (t: number, i: number) => number) => {
            const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = generate(i / sampleRate, i);
            }
            return buffer;
        };

        switch (type) {
            case 'hover':
                // Short high pip
                return createBuffer(0.05, (t) => Math.sin(2 * Math.PI * 800 * t) * Math.exp(-20 * t));
            case 'click':
                // Low thud
                return createBuffer(0.05, (t) => Math.sin(2 * Math.PI * 200 * t) * Math.exp(-30 * t));
            case 'success':
                // Major triad arpeggio
                return createBuffer(0.4, (t) => {
                    const freq = t < 0.1 ? 440 : t < 0.2 ? 554 : 659; // A4, C#5, E5
                    return Math.sin(2 * Math.PI * freq * t) * Math.exp(-5 * t) * 0.5;
                });

            case 'nature':
            case 'city':
            case 'ancient':
            case 'default':
                // Pinkish noise for ambience (wind-like)
                return createBuffer(2.0, () => (Math.random() * 2 - 1) * 0.1);

            default:
                return null;
        }
    }

    /**
     * Play ambient sound with optional crossfade
     */
    public async playAmbient(type: AmbienceType, crossfadeDuration = 2000): Promise<void> {
        if (!this.state.enabled || !this.audioContext || !this.ambientGain) return;

        const url = AMBIENT_SOUNDS[type];
        const buffer = await this.loadSound(url, type);

        if (!buffer) return;

        // If same ambience, don't restart
        if (this.state.currentAmbience === type && this.currentAmbientSource) {
            return;
        }

        // Crossfade to new ambient
        await this.crossfadeAmbient(buffer, crossfadeDuration);
        this.state.currentAmbience = type;
    }

    /**
     * Crossfade between ambient sounds
     */
    private async crossfadeAmbient(newBuffer: AudioBuffer, duration: number): Promise<void> {
        if (!this.audioContext || !this.ambientGain) return;

        const now = this.audioContext.currentTime;
        const fadeDuration = duration / 1000;

        // Fade out current
        if (this.currentAmbientSource) {
            this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
            this.ambientGain.gain.linearRampToValueAtTime(0, now + fadeDuration / 2);

            // Stop after fade
            const oldSource = this.currentAmbientSource;
            setTimeout(() => {
                try {
                    oldSource.stop();
                } catch {
                    // Already stopped
                }
            }, duration / 2);
        }

        // Create and start new source
        const newSource = this.audioContext.createBufferSource();
        newSource.buffer = newBuffer;
        newSource.loop = true;
        newSource.connect(this.ambientGain);
        newSource.start();

        // Fade in new
        this.ambientGain.gain.setValueAtTime(0, now + fadeDuration / 2);
        this.ambientGain.gain.linearRampToValueAtTime(0.5, now + fadeDuration);

        this.currentAmbientSource = newSource;
        this.currentAmbientBuffer = newBuffer;
    }

    /**
     * Stop ambient sound
     */
    public stopAmbient(fadeDuration = 1000): void {
        if (!this.audioContext || !this.ambientGain || !this.currentAmbientSource) return;

        const now = this.audioContext.currentTime;
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.linearRampToValueAtTime(0, now + fadeDuration / 1000);

        const source = this.currentAmbientSource;
        setTimeout(() => {
            try {
                source.stop();
            } catch {
                // Already stopped
            }
        }, fadeDuration);

        this.currentAmbientSource = null;
        this.currentAmbientBuffer = null;
        this.state.currentAmbience = null;
    }

    /**
     * Play UI sound (short, one-shot)
     */
    public async playUI(type: UISoundType): Promise<void> {
        if (!this.state.enabled || !this.audioContext || !this.uiGain) return;

        const url = UI_SOUNDS[type];
        const buffer = await this.loadSound(url, type);

        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.uiGain);
        source.start();
    }

    /**
     * Enable/disable sound
     */
    public setEnabled(enabled: boolean): void {
        this.state.enabled = enabled;
        this.saveToStorage();

        if (this.masterGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(
                enabled ? this.state.volume : 0,
                now + 0.3
            );
        }

        // Stop ambient if disabled
        if (!enabled && this.currentAmbientSource) {
            this.stopAmbient(500);
        }
    }

    /**
     * Toggle sound on/off
     */
    public toggle(): boolean {
        this.setEnabled(!this.state.enabled);
        return this.state.enabled;
    }

    /**
     * Set master volume (0-1)
     */
    public setVolume(volume: number): void {
        this.state.volume = Math.max(0, Math.min(1, volume));
        this.saveToStorage();

        if (this.masterGain && this.audioContext && this.state.enabled) {
            const now = this.audioContext.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(this.state.volume, now + 0.1);
        }
    }

    /**
     * Get current state
     */
    public getState(): SoundState {
        return { ...this.state };
    }

    /**
     * Check if sound is enabled
     */
    public isEnabled(): boolean {
        return this.state.enabled;
    }

    /**
     * Get current volume
     */
    public getVolume(): number {
        return this.state.volume;
    }

    /**
     * Cleanup
     */
    public dispose(): void {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        if (this.currentAmbientSource) {
            try {
                this.currentAmbientSource.stop();
            } catch {
                // Already stopped
            }
        }

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.loadedBuffers.clear();
        SoundManager.instance = null;
    }
}

export default SoundManager;
export type { UISoundType };
