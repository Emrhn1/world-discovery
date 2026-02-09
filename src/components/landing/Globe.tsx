'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getCountries } from '@/lib/data';

interface GlobeProps {
    className?: string;
    onCountryClick?: (countryId: string) => void;
}

/**
 * Animated 3D-looking globe with country markers
 * Uses Canvas for performance
 */
export function Globe({ className, onCountryClick }: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const rotationRef = useRef(0);
    const countries = getCountries();

    // Convert lat/lng to 3D coordinates on sphere
    const latLngTo3D = useCallback((lat: number, lng: number, radius: number, rotation: number) => {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + rotation) * (Math.PI / 180);

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        return { x, y, z };
    }, []);

    // Draw the globe
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

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

        // Draw atmosphere glow
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.95,
            centerX, centerY, radius * 1.15
        );
        glowGradient.addColorStop(0, 'rgba(100, 180, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Draw longitude lines
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.15)';
        ctx.lineWidth = 1;

        for (let lng = 0; lng < 360; lng += 30) {
            ctx.beginPath();
            for (let lat = -90; lat <= 90; lat += 5) {
                const pos = latLngTo3D(lat, lng, radius, rotationRef.current);
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;

                // Only draw if on front side of globe
                if (pos.z > 0) {
                    if (lat === -90) {
                        ctx.moveTo(screenX, screenY);
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                }
            }
            ctx.stroke();
        }

        // Draw latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            for (let lng = 0; lng <= 360; lng += 5) {
                const pos = latLngTo3D(lat, lng, radius, rotationRef.current);
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;

                if (pos.z > 0) {
                    if (lng === 0) {
                        ctx.moveTo(screenX, screenY);
                    } else {
                        ctx.lineTo(screenX, screenY);
                    }
                }
            }
            ctx.stroke();
        }

        // Draw country markers
        countries.forEach((country) => {
            const [lat, lng] = country.coords;
            const pos = latLngTo3D(lat, lng, radius, rotationRef.current);

            // Only draw if on front side
            if (pos.z > 0) {
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;
                const markerRadius = 6 + (pos.z / radius) * 4;

                // Glow effect
                const markerGlow = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, markerRadius * 2
                );
                markerGlow.addColorStop(0, 'rgba(239, 204, 77, 0.6)');
                markerGlow.addColorStop(1, 'rgba(239, 204, 77, 0)');

                ctx.beginPath();
                ctx.arc(screenX, screenY, markerRadius * 2, 0, Math.PI * 2);
                ctx.fillStyle = markerGlow;
                ctx.fill();

                // Marker dot
                ctx.beginPath();
                ctx.arc(screenX, screenY, markerRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(239, 204, 77, 0.9)';
                ctx.fill();

                // Inner highlight
                ctx.beginPath();
                ctx.arc(screenX - 2, screenY - 2, markerRadius * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fill();
            }
        });

        // Update rotation
        rotationRef.current += 0.15;
    }, [countries, latLngTo3D]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resize();
        window.addEventListener('resize', resize);

        // Animation loop
        const animate = () => {
            const rect = canvas.getBoundingClientRect();
            draw(ctx, rect.width, rect.height);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [draw]);

    // Handle clicks
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !onCountryClick) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const radius = Math.min(rect.width, rect.height) * 0.4;

        // Check if click is near a country marker
        for (const country of countries) {
            const [lat, lng] = country.coords;
            const pos = latLngTo3D(lat, lng, radius, rotationRef.current);

            if (pos.z > 0) {
                const screenX = centerX + pos.x;
                const screenY = centerY - pos.y;
                const distance = Math.sqrt((x - screenX) ** 2 + (y - screenY) ** 2);

                if (distance < 20) {
                    onCountryClick(country.id);
                    return;
                }
            }
        }
    }, [countries, latLngTo3D, onCountryClick]);

    return (
        <motion.div
            className={cn('relative', className)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="w-full h-full cursor-pointer"
                style={{ touchAction: 'none' }}
                aria-label="Interactive globe with country markers"
                role="img"
            />

            {/* Subtle sparkle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

export default Globe;
