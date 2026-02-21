// src/components/landing/Globe.tsx
'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getCountries } from '@/lib/data';
import Image from 'next/image';

interface GlobeProps {
    className?: string;
    onCountryClick?: (countryId: string) => void;
}

type FlagPosition = {
    id: string;
    flagSrc: string;
    name: string;
    x: number;
    y: number;
    scale: number;
    opacity: number;
    isClickable: boolean;
    zIndex: number;
};

// Generate random but evenly distributed positions on sphere
function generateSpherePositions(count: number): Array<{ lat: number; lng: number }> {
    const positions: Array<{ lat: number; lng: number }> = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const angleIncrement = Math.PI * 2 * goldenRatio;

    for (let i = 0; i < count; i++) {
        const t = i / count;
        const inclination = Math.acos(1 - 2 * t);
        const azimuth = angleIncrement * i;

        const lat = 90 - (inclination * 180) / Math.PI;
        const lng = ((azimuth * 180) / Math.PI) % 360 - 180;

        positions.push({ lat, lng });
    }

    return positions;
}

/**
 * Animated 3D-looking globe with country flag images randomly distributed on surface
 * Uses Canvas for globe rendering and DOM for flag images
 */
export function Globe({ className, onCountryClick }: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const rotationRef = useRef(0);
    const [flagPositions, setFlagPositions] = useState<FlagPosition[]>([]);
    const countries = getCountries();

    // Generate flags with random positions (memoized)
    const allFlags = useCallback(() => {
        // Map our data countries to their clickable flags
        // Only include countries that have flag files in public/flags
        const countryFlagMap: Record<string, string> = {
            'TR': '/flags/turkey.png',    // Ekle bu dosyayı
        };

        const dataFlags = countries
            .filter(c => countryFlagMap[c.id]) // Sadece flag dosyası olanları al
            .map(c => ({
                flagSrc: countryFlagMap[c.id],
                name: c.name,
                id: c.id,
                isClickable: true,
            }));

        // Additional decorative flags from public/flags folder
        const extraFlags = [
            { flagSrc: '/flags/Flag_of_France.svg.webp', name: 'France', isClickable: false },
            { flagSrc: '/flags/germany.png', name: 'Germany', isClickable: false },
            { flagSrc: '/flags/spain.png', name: 'Spain', isClickable: false },
            { flagSrc: '/flags/uk.png', name: 'United Kingdom', isClickable: false },
            { flagSrc: '/flags/greece.png', name: 'Greece', isClickable: false },
            { flagSrc: '/flags/india.png', name: 'India', isClickable: false },
            { flagSrc: '/flags/china.png', name: 'China', isClickable: false },
            { flagSrc: '/flags/turkey.png', name: 'Turkey', isClickable: false },
            { flagSrc: '/flags/australia.png', name: 'Australia', isClickable: false },
            { flagSrc: '/flags/brazil.jpg', name: 'Brazil', isClickable: false },
            { flagSrc: '/flags/usa.png', name: 'USA', isClickable: false },
            { flagSrc: '/flags/mexico.png', name: 'Mexico', isClickable: false },
            { flagSrc: '/flags/southafrica.png', name: 'South Africa', isClickable: false },
            { flagSrc: '/flags/russia.png', name: 'Russia', isClickable: false },
            { flagSrc: '/flags/thailand.png', name: 'Thailand', isClickable: false },
            { flagSrc: '/flags/japan.png', name: 'Japan', isClickable: false },
            { flagSrc: '/flags/peru.png', name: 'Peru', isClickable: false },
            { flagSrc: '/flags/italy.webp', name: 'Italy', isClickable: false },
            { flagSrc: '/flags/egypt.png', name: 'Egypt', isClickable: false },
            { flagSrc: '/flags/southkorea.png', name: 'South Korea', isClickable: false },
            { flagSrc: '/flags/morocco.png', name: 'Morocco', isClickable: false },
            { flagSrc: '/flags/argentina.png', name: 'Argentina', isClickable: false },
            { flagSrc: '/flags/norway.png', name: 'Norway', isClickable: false },
            { flagSrc: '/flags/canada.png', name: 'Canada', isClickable: false },
            { flagSrc: '/flags/kenya.png', name: 'Kenya', isClickable: false },
            { flagSrc: '/flags/indonesia.png', name: 'Indonesia', isClickable: false },
            { flagSrc: '/flags/portugal.png', name: 'Portugal', isClickable: false },
            { flagSrc: '/flags/sweden.png', name: 'Sweden', isClickable: false },
            { flagSrc: '/flags/columbia.png', name: 'Colombia', isClickable: false },
            { flagSrc: '/flags/newzealand.png', name: 'New Zealand', isClickable: false },
            
        ].map((f, idx) => ({ ...f, id: `extra-${idx}` }));

        const allFlagsData = [...dataFlags, ...extraFlags];
        
        // Generate evenly distributed positions
        const positions = generateSpherePositions(allFlagsData.length);

        return allFlagsData.map((flag, idx) => ({
            ...flag,
            lat: positions[idx].lat,
            lng: positions[idx].lng,
        }));
    }, [countries]);

    // Convert lat/lng to 3D coordinates on sphere
    const latLngTo3D = useCallback((lat: number, lng: number, radius: number, rotation: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + rotation) * (Math.PI / 180);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return { x, y, z };
    }, []);

    // Draw the globe (canvas only - no flags)
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw atmosphere glow (outer)
        const outerGlow = ctx.createRadialGradient(
            centerX, centerY, radius * 0.8,
            centerX, centerY, radius * 1.25
        );
        outerGlow.addColorStop(0, 'rgba(100, 180, 255, 0)');
        outerGlow.addColorStop(0.5, 'rgba(70, 140, 230, 0.15)');
        outerGlow.addColorStop(1, 'rgba(70, 140, 230, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = outerGlow;
        ctx.fill();

        // Draw globe background with gradient
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            0,
            centerX,
            centerY,
            radius
        );
        gradient.addColorStop(0, 'rgba(30, 58, 95, 0.8)');
        gradient.addColorStop(0.5, 'rgba(15, 35, 60, 0.9)');
        gradient.addColorStop(1, 'rgba(8, 20, 40, 1)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw atmosphere glow (inner edge)
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.95,
            centerX, centerY, radius * 1.08
        );
        glowGradient.addColorStop(0, 'rgba(100, 180, 255, 0.25)');
        glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.08, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Draw longitude lines
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.12)';
        ctx.lineWidth = 0.5;

        for (let lng = 0; lng < 360; lng += 30) {
            ctx.beginPath();
            let started = false;
            for (let lat = -90; lat <= 90; lat += 3) {
                const pos = latLngTo3D(lat, lng, radius, rotationRef.current);
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;

                if (pos.z > 0) {
                    if (!started) {
                        ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }

        // Draw latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            let started = false;
            for (let lng = 0; lng <= 360; lng += 3) {
                const pos = latLngTo3D(lat, lng, radius, rotationRef.current);
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;

                if (pos.z > 0) {
                    if (!started) {
                        ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                } else {
                    started = false;
                }
            }
            ctx.stroke();
        }

        // Update rotation
        rotationRef.current += 0.18;
    }, [latLngTo3D]);

    // Update flag positions
    const updateFlagPositions = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        const flags = allFlags();
        const positions: FlagPosition[] = [];

        flags.forEach((flag) => {
            const pos = latLngTo3D(flag.lat, flag.lng, radius, rotationRef.current);
            
            // Only show flags on front side
            if (pos.z > 0) {
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;
                const depthFactor = pos.z / radius;
                
                positions.push({
                    id: flag.id,
                    flagSrc: flag.flagSrc,
                    name: flag.name,
                    x: screenX,
                    y: screenY,
                    scale: flag.isClickable 
                        ? 0.7 + depthFactor * 0.9
                        : 0.5 + depthFactor * 0.6,
                    opacity: 0.4 + depthFactor * 0.6,
                    isClickable: flag.isClickable,
                    zIndex: Math.floor(pos.z),
                });
            }
        });

        setFlagPositions(positions);
    }, [allFlags, latLngTo3D]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            draw(ctx, rect.width, rect.height);
            updateFlagPositions();
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [draw, updateFlagPositions]);

    // Handle flag clicks
    const handleFlagClick = useCallback((countryId: string, isClickable: boolean) => {
        if (isClickable && onCountryClick) {
            onCountryClick(countryId);
        }
    }, [onCountryClick]);

    return (
        <motion.div
            ref={containerRef}
            className={cn('relative', className)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ touchAction: 'none' }}
                aria-label="Interactive globe with country flags"
                role="img"
            />

            {/* Flag overlay - Now with actual flag images */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                    {flagPositions.map((flag) => (
                        <motion.div
                            key={flag.id}
                            className={cn(
                                'absolute',
                                flag.isClickable && 'pointer-events-auto cursor-pointer'
                            )}
                            style={{
                                left: flag.x,
                                top: flag.y,
                                transform: 'translate(-50%, -50%)',
                                zIndex: flag.zIndex,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                                opacity: flag.opacity, 
                                scale: flag.scale,
                            }}
                            transition={{ duration: 0.2 }}
                            onClick={() => handleFlagClick(flag.id, flag.isClickable)}
                        >
                            {/* Glow for clickable flags */}
                            {flag.isClickable && (
                                <div 
                                    className="absolute inset-0 rounded-full blur-lg"
                                    style={{
                                        background: `radial-gradient(circle, rgba(239, 204, 77, ${0.4 * flag.opacity}) 0%, transparent 70%)`,
                                        width: '250%',
                                        height: '250%',
                                        left: '-75%',
                                        top: '-75%',
                                    }}
                                />
                            )}
                            
                            {/* Flag IMAGE */}
                            <div 
                                className="relative select-none"
                                style={{
                                    width: flag.isClickable ? '48px' : '36px',
                                    height: flag.isClickable ? '36px' : '27px',
                                    filter: flag.isClickable 
                                        ? 'drop-shadow(0 0 8px rgba(239, 204, 77, 0.5))'
                                        : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                                }}
                            >
                                <Image
                                    src={flag.flagSrc}
                                    alt={`${flag.name} flag`}
                                    fill
                                    className="object-cover rounded-sm"
                                    unoptimized
                                />
                            </div>

                            {/* Name label for clickable flags */}
                            {flag.isClickable && flag.opacity > 0.85 && (
                                <motion.div
                                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-accent-400 pointer-events-none px-2 py-1 rounded bg-neutral-900/80 backdrop-blur-sm"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                                    }}
                                >
                                    {flag.name}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Subtle sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default Globe;