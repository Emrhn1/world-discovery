'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { useSound } from '@/hooks/useSound';

interface LandingExperienceProps {
    onEnter: () => void;
}

const PLACES = [
    { id: 'harbor', name: 'Ancient Harbor',  sub: 'Alexandria, EG', tag: 'CAIRO · 31.2°N',  x: 42, y: 58, mood: '#2a4a6b', mood2: '#0a1c30' },
    { id: 'palace', name: 'Hidden Palace',   sub: 'Jaipur, IN',     tag: 'JAIPUR · 26.9°N', x: 66, y: 44, mood: '#6b3a5a', mood2: '#1a0d20' },
    { id: 'stone',  name: 'Stone & Wind',    sub: 'Orkney, UK',     tag: 'ORKNEY · 58.9°N', x: 38, y: 22, mood: '#3b5a6b', mood2: '#0a1822' },
    { id: 'peak',   name: 'Sacred Peak',     sub: 'Kumano, JP',     tag: 'KUMANO · 33.8°N', x: 82, y: 36, mood: '#5b6ba8', mood2: '#0e142a' },
    { id: 'empire', name: 'Lost Empire',     sub: 'Cusco, PE',      tag: 'CUSCO · 13.5°S',  x: 22, y: 68, mood: '#6b5a3a', mood2: '#1a1205' },
    { id: 'flame',  name: 'Eternal Flame',   sub: 'Yazd, IR',       tag: 'YAZD · 31.9°N',   x: 58, y: 52, mood: '#a8532e', mood2: '#2a0e08' },
    { id: 'path',   name: 'Forgotten Path',  sub: 'Kyoto, JP',      tag: 'KYOTO · 35.0°N',  x: 78, y: 48, mood: '#4a6b4a', mood2: '#0e1a0e' },
    { id: 'dawn',   name: 'Golden Dawn',     sub: 'Bagan, MM',      tag: 'BAGAN · 21.2°N',  x: 72, y: 60, mood: '#c48a3e', mood2: '#2a1a05' },
];

type Place = typeof PLACES[0];

// Map globe % coords to SVG viewBox (-100..100)
function vx(p: Place) { return (p.x - 50) * 2 * 0.84; }
function vy(p: Place) { return (p.y - 50) * 2 * 0.84; }

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', 'Courier New', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif" };

export function LandingExperience({ onEnter }: LandingExperienceProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [activePlaceId, setActivePlaceId] = useState(PLACES[0].id);
    const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
    const [bloomPos, setBloomPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [clock, setClock] = useState('--:--:-- UTC');
    const [ctaMx, setCtaMx] = useState(50);
    const [ctaMy, setCtaMy] = useState(25);
    const [ctaHovered, setCtaHovered] = useState(false);

    const mouseRef = useRef({ x: 0, y: 0 });
    const bloomRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef(0);
    const idleRef = useRef(0);

    const { initialize, isInitialized, playAmbient, isEnabled } = useSound();

    const activePlace = PLACES.find(p => p.id === activePlaceId)!;

    // Constellation SVG path
    const constellationD = PLACES.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${vx(p).toFixed(1)} ${vy(p).toFixed(1)}`
    ).join(' ');

    // Dust particles — stable layout
    const dustParticles = useMemo(() =>
        Array.from({ length: 40 }, () => ({
            left: Math.random() * 100,
            top: Math.random() * 100,
            dur: (12 + Math.random() * 18).toFixed(1),
            tx: (Math.random() * 80 - 40).toFixed(0),
            ty: (Math.random() * 80 - 40).toFixed(0),
            delay: (-Math.random() * 20).toFixed(1),
            opacity: (0.2 + Math.random() * 0.5).toFixed(2),
        }))
    , []);

    // Mouse tracking
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
            setCursorPos({ x: e.clientX, y: e.clientY });
            idleRef.current = 0;
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, []);

    // Smooth bloom follow
    useEffect(() => {
        const tick = () => {
            bloomRef.current.x += (mouseRef.current.x - bloomRef.current.x) * 0.04;
            bloomRef.current.y += (mouseRef.current.y - bloomRef.current.y) * 0.04;
            setBloomPos({ x: bloomRef.current.x, y: bloomRef.current.y });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // UTC clock + idle auto-cycle
    useEffect(() => {
        const pad = (n: number) => String(n).padStart(2, '0');
        const tick = () => {
            const d = new Date();
            setClock(`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`);
        };
        tick();
        const clockId = setInterval(tick, 1000);

        const idleId = setInterval(() => {
            idleRef.current++;
            if (idleRef.current > 6) {
                setActivePlaceId(prev => {
                    const i = PLACES.findIndex(p => p.id === prev);
                    return PLACES[(i + 1) % PLACES.length].id;
                });
                idleRef.current = 0;
            }
        }, 1000);

        return () => { clearInterval(clockId); clearInterval(idleId); };
    }, []);

    const handleEnter = useCallback(async () => {
        setIsExiting(true);
        if (!isInitialized) await initialize();
        if (isEnabled) await playAmbient('default', 1500);
        setTimeout(() => onEnter(), 800);
    }, [initialize, isInitialized, playAmbient, isEnabled, onEnter]);

    const activate = (id: string) => {
        setActivePlaceId(id);
        idleRef.current = 0;
    };

    const tiltX = (activePlace.y - 50) * 0.4;
    const tiltY = (50 - activePlace.x) * 0.4;

    if (isExiting) {
        return (
            <motion.div
                className="fixed inset-0 z-50"
                style={{ background: '#05070e' }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            />
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 overflow-hidden"
                style={{ background: '#05070e', cursor: 'none', userSelect: 'none' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                {/* ═══ CUSTOM CURSOR ═══ */}
                <div
                    className="fixed pointer-events-none mix-blend-screen rounded-full"
                    style={{
                        zIndex: 9999,
                        width: isHovering ? 56 : 24,
                        height: isHovering ? 56 : 24,
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: 'translate(-50%,-50%)',
                        border: `1px solid ${isHovering ? 'rgba(228,182,96,.9)' : 'rgba(228,182,96,.6)'}`,
                        background: isHovering ? 'rgba(228,182,96,.06)' : 'transparent',
                        transition: 'width .25s, height .25s, border-color .25s, background .25s',
                    }}
                />
                <div
                    className="fixed pointer-events-none rounded-full"
                    style={{
                        zIndex: 9999,
                        width: 4, height: 4,
                        left: cursorPos.x, top: cursorPos.y,
                        transform: 'translate(-50%,-50%)',
                        background: '#e4b660',
                        boxShadow: '0 0 12px #e4b660',
                    }}
                />

                {/* ═══ DEEP SPACE BACKGROUND ═══ */}
                <div
                    className="absolute inset-0"
                    style={{
                        transition: 'background 1.2s cubic-bezier(.2,.7,.2,1)',
                        background: `
                            radial-gradient(ellipse 60% 45% at 30% 55%, color-mix(in oklab, ${activePlace.mood} 35%, transparent) 0%, transparent 60%),
                            radial-gradient(ellipse 80% 60% at 70% 80%, color-mix(in oklab, ${activePlace.mood2} 60%, transparent) 0%, transparent 70%),
                            radial-gradient(ellipse 100% 80% at 50% 0%, #101530 0%, #05070e 60%),
                            linear-gradient(180deg, #05070e 0%, #030510 100%)
                        `,
                    }}
                />

                {/* ═══ BLOOM (cursor follower) ═══ */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        width: 900, height: 900,
                        left: bloomPos.x - 450,
                        top: bloomPos.y - 450,
                        background: `radial-gradient(circle, color-mix(in oklab, ${activePlace.mood} 40%, transparent) 0%, transparent 60%)`,
                        filter: 'blur(40px)',
                        opacity: 0.55,
                        transition: 'background 1.2s',
                    }}
                />

                {/* ═══ STARS (3 parallax layers) ═══ */}
                <div className="absolute pointer-events-none" style={{ inset: '-10%' }}>
                    <div className="hero-stars-l1 absolute inset-0" />
                    <div className="hero-stars-l2 absolute inset-0" />
                    <div className="hero-stars-l3 absolute inset-0" />
                </div>

                {/* ═══ DUST PARTICLES ═══ */}
                <div className="absolute inset-0 pointer-events-none">
                    {dustParticles.map((p, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full"
                            style={{
                                left: `${p.left}%`, top: `${p.top}%`,
                                width: 2, height: 2,
                                background: 'rgba(228,182,96,.6)',
                                boxShadow: '0 0 8px rgba(228,182,96,.5)',
                                opacity: Number(p.opacity),
                                animation: `hero-float ${p.dur}s ease-in-out infinite`,
                                animationDelay: `${p.delay}s`,
                                ['--htx' as string]: `${p.tx}px`,
                                ['--hty' as string]: `${p.ty}px`,
                            }}
                        />
                    ))}
                </div>

                {/* ═══ GRAIN NOISE ═══ */}
                <div className="grain absolute pointer-events-none" style={{ inset: '-20%', opacity: 0.08, mixBlendMode: 'overlay' }} />

                {/* ═══ CORNER ACCENTS ═══ */}
                {(['tl','tr','bl','br'] as const).map(c => (
                    <div key={c} className="absolute pointer-events-none" style={{
                        zIndex: 5,
                        width: 20, height: 20,
                        top: c.startsWith('t') ? 16 : undefined,
                        bottom: c.startsWith('b') ? 16 : undefined,
                        left: c.endsWith('l') ? 16 : undefined,
                        right: c.endsWith('r') ? 16 : undefined,
                        borderTop:    c.startsWith('t') ? '1px solid rgba(228,182,96,.4)' : undefined,
                        borderBottom: c.startsWith('b') ? '1px solid rgba(228,182,96,.4)' : undefined,
                        borderLeft:   c.endsWith('l')   ? '1px solid rgba(228,182,96,.4)' : undefined,
                        borderRight:  c.endsWith('r')   ? '1px solid rgba(228,182,96,.4)' : undefined,
                    }} />
                ))}

                {/* ═══ TOP BAR ═══ */}
                <div
                    className="absolute z-10 flex justify-between items-center"
                    style={{ top: 24, left: 72, right: 72, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(90,99,128,.8)', fontFamily: 'Inter, system-ui' }}
                >
                    <div className="flex items-center gap-2.5" style={{ color: 'rgba(200,205,220,.9)' }}>
                        <div className="relative rounded-full" style={{ width: 18, height: 18, border: '1px solid #e4b660' }}>
                            <div className="absolute rounded-full" style={{ inset: 4, background: '#e4b660', boxShadow: '0 0 10px #e4b660' }} />
                        </div>
                        <span>World Discovery</span>
                    </div>

                    <nav className="flex gap-7">
                        {['Atlas','Stories','Journal','About'].map(n => (
                            <a key={n} href="#" className="no-underline transition-colors duration-300"
                               style={{ color: 'rgba(90,99,128,.8)' }}
                               onMouseEnter={() => setIsHovering(true)}
                               onMouseLeave={() => setIsHovering(false)}
                               onFocus={() => setIsHovering(true)}
                               onBlur={() => setIsHovering(false)}
                            >
                                {n}
                            </a>
                        ))}
                    </nav>

                    <div className="flex gap-5 items-center" style={{ ...MONO, letterSpacing: '0.1em', textTransform: 'none' }}>
                        <span>
                            <span className="inline-block rounded-full mr-2" style={{ width: 6, height: 6, background: '#4bd07a', boxShadow: '0 0 8px #4bd07a', verticalAlign: 'middle', animation: 'hero-dot-pulse 2s infinite' }} />
                            08 EXPEDITIONS LIVE
                        </span>
                        <span>{clock}</span>
                    </div>
                </div>

                {/* ═══ HERO GRID ═══ */}
                <div
                    className="relative w-full h-full"
                    style={{ zIndex: 2, display: 'grid', gridTemplateColumns: '1.05fr .95fr', padding: '80px 72px 64px', gap: 40 }}
                >
                    {/* ─── GLOBE COLUMN ─── */}
                    <div className="flex items-center justify-center">
                        <div
                            className="relative"
                            style={{
                                width: 'min(580px, 90%)',
                                aspectRatio: '1 / 1',
                                transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                                transition: 'transform 1.1s cubic-bezier(.2,.7,.2,1)',
                            }}
                        >
                            {/* Coordinate labels */}
                            {[
                                { cls: 'top-[-8px] left-[-8px]',    label: 'LAT', val: '+23.4378°' },
                                { cls: 'top-[-8px] right-[-8px]',   label: 'LON', val: '−41.9052°', right: true },
                                { cls: 'bottom-[-8px] left-[-8px]', label: 'ALT', val: '0 km' },
                                { cls: 'bottom-[-8px] right-[-8px]',label: 'SYS', val: 'TERRA / LIVE', right: true },
                            ].map(({ cls, label, val, right }) => (
                                <div key={label} className={`absolute ${cls}`} style={{ ...MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(90,99,128,.8)', textAlign: right ? 'right' : 'left' }}>
                                    <span style={{ color: 'rgba(228,182,96,.8)' }}>{label}</span> {val}
                                </div>
                            ))}

                            {/* N/S poles */}
                            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -20, ...MONO, fontSize: 9, letterSpacing: '0.3em', color: 'rgba(90,99,128,.8)' }}>— N —</div>
                            <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -20, ...MONO, fontSize: 9, letterSpacing: '0.3em', color: 'rgba(90,99,128,.8)' }}>— S —</div>

                            {/* Orbiting rings (Framer Motion) */}
                            <motion.div
                                className="absolute rounded-full"
                                style={{ inset: '-4%', border: '1px dashed rgba(228,182,96,.15)' }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute rounded-full"
                                style={{ inset: '-10%', border: '1px dashed rgba(78,198,194,.08)' }}
                                animate={{ rotate: -360 }}
                                transition={{ duration: 120, ease: 'linear', repeat: Infinity }}
                            />

                            {/* Globe sphere */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    inset: '8%',
                                    backdropFilter: 'blur(2px)',
                                    transition: 'box-shadow 1.2s, background 1.2s',
                                    background: `
                                        radial-gradient(circle at 35% 30%, rgba(255,255,255,.15) 0%, rgba(255,255,255,.02) 25%, transparent 50%),
                                        radial-gradient(circle at 70% 70%, color-mix(in oklab, ${activePlace.mood} 40%, transparent) 0%, transparent 55%),
                                        radial-gradient(circle at 50% 50%, rgba(20,28,60,.6) 0%, rgba(5,8,20,.85) 75%)
                                    `,
                                    boxShadow: `
                                        inset 0 0 80px rgba(78,198,194,.18),
                                        inset -30px -30px 120px rgba(5,8,20,.9),
                                        0 0 80px ${activePlace.mood}88,
                                        0 0 160px ${activePlace.mood}44
                                    `,
                                }}
                            >
                                {/* Rim light (simulated ::before) */}
                                <div
                                    className="absolute inset-[-2px] rounded-full pointer-events-none"
                                    style={{
                                        background: `conic-gradient(from 210deg, transparent 0deg, color-mix(in oklab, ${activePlace.mood} 80%, white) 40deg, transparent 120deg)`,
                                        filter: 'blur(8px)',
                                        opacity: 0.5,
                                        zIndex: -1,
                                        transition: 'background 1.2s',
                                    }}
                                />
                            </div>

                            {/* SVG wireframe + constellation */}
                            <svg
                                viewBox="-100 -100 200 200"
                                preserveAspectRatio="xMidYMid meet"
                                className="absolute pointer-events-none overflow-visible"
                                style={{ inset: '8%', width: '84%', height: '84%' }}
                            >
                                <g fill="none" stroke="rgba(180,200,255,.12)" strokeWidth="0.5">
                                    <circle cx="0" cy="0" r="96" />
                                    <ellipse cx="0" cy="0" rx="96" ry="96" />
                                    <ellipse cx="0" cy="0" rx="20" ry="96" />
                                    <ellipse cx="0" cy="0" rx="50" ry="96" />
                                    <ellipse cx="0" cy="0" rx="78" ry="96" />
                                    {/* Equator */}
                                    <ellipse cx="0" cy="0" rx="96" ry="20" stroke="rgba(228,182,96,.25)" strokeWidth="0.8" strokeDasharray="2 3" />
                                    <ellipse cx="0" cy="0" rx="94" ry="55" />
                                    <ellipse cx="0" cy="0" rx="94" ry="82" />
                                    <ellipse cx="0" cy="0" rx="94" ry="36" />
                                </g>
                                <path
                                    d={constellationD}
                                    fill="none"
                                    stroke="rgba(228,182,96,.35)"
                                    strokeWidth="0.8"
                                    strokeDasharray="1 2"
                                    style={{ filter: 'drop-shadow(0 0 4px rgba(228,182,96,.5))' }}
                                />
                            </svg>

                            {/* Place markers */}
                            {PLACES.map(place => {
                                const isActive = place.id === activePlaceId;
                                return (
                                    <div
                                        key={place.id}
                                        className="absolute"
                                        style={{
                                            left: `${place.x}%`,
                                            top: `${place.y}%`,
                                            transform: `translate(-50%,-50%) scale(${isActive ? 1.1 : 1})`,
                                            transition: 'transform .5s cubic-bezier(.2,.7,.2,1), opacity .4s',
                                            zIndex: 4,
                                            cursor: 'none',
                                        }}
                                        onMouseEnter={() => { activate(place.id); setIsHovering(true); }}
                                        onMouseLeave={() => setIsHovering(false)}
                                        onClick={handleEnter}
                                    >
                                        {/* Pulse rings */}
                                        {[0, 1200].map(delay => (
                                            <motion.div
                                                key={delay}
                                                className="absolute rounded-full border border-[#e4b660]"
                                                style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
                                                initial={{ width: 8, height: 8, opacity: 0.9 }}
                                                animate={{ width: 48, height: 48, opacity: 0 }}
                                                transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity, delay: delay / 1000 }}
                                            />
                                        ))}

                                        {/* Dot */}
                                        <div
                                            className="absolute rounded-full"
                                            style={{
                                                left: '50%', top: '50%',
                                                width: 10, height: 10,
                                                transform: 'translate(-50%,-50%)',
                                                background: isActive ? '#f7d488' : '#e4b660',
                                                boxShadow: isActive
                                                    ? '0 0 18px #f7d488, 0 0 48px rgba(247,212,136,.7)'
                                                    : '0 0 12px #e4b660, 0 0 28px rgba(228,182,96,.6)',
                                                transition: 'background .3s, box-shadow .3s',
                                            }}
                                        />

                                        {/* Label */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: 16, top: -4,
                                                whiteSpace: 'nowrap',
                                                ...MONO,
                                                fontSize: 10,
                                                letterSpacing: '0.18em',
                                                textTransform: 'uppercase',
                                                color: isActive ? '#f7d488' : 'rgba(200,205,220,.8)',
                                                opacity: isActive ? 1 : 0,
                                                transform: isActive ? 'translateX(0)' : 'translateX(-4px)',
                                                transition: 'opacity .3s, transform .3s',
                                            }}
                                        >
                                            {place.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── CONTENT COLUMN ─── */}
                    <div className="relative flex flex-col justify-center" style={{ paddingRight: 12, maxWidth: 520 }}>

                        {/* Eyebrow */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                            className="inline-flex items-center gap-2.5 mb-7"
                            style={{
                                width: 'fit-content',
                                padding: '7px 14px',
                                border: '1px solid rgba(228,182,96,.35)',
                                borderRadius: 99,
                                fontSize: 10,
                                letterSpacing: '0.28em',
                                textTransform: 'uppercase',
                                color: '#e4b660',
                                background: 'rgba(228,182,96,.04)',
                                backdropFilter: 'blur(8px)',
                            }}
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                        >
                            <span className="rounded-full" style={{ width: 5, height: 5, background: '#e4b660', boxShadow: '0 0 8px #e4b660', flexShrink: 0 }} />
                            Explore the World
                        </motion.div>

                        {/* "Discover." heading */}
                        <h1
                            style={{
                                ...SERIF,
                                fontWeight: 300,
                                fontSize: 'clamp(64px, 8vw, 128px)',
                                lineHeight: 0.95,
                                letterSpacing: '-0.02em',
                                margin: '0 0 18px',
                                color: '#fff',
                            }}
                        >
                            {['D','i','s','c','o','v','e','r'].map((char, i) => (
                                <motion.span
                                    key={i}
                                    style={{ display: 'inline-block' }}
                                    initial={{ opacity: 0, filter: 'blur(14px)', y: 12 }}
                                    animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.07, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                            <motion.span
                                style={{ display: 'inline-block', fontStyle: 'italic', fontWeight: 400, color: '#f7d488' }}
                                initial={{ opacity: 0, filter: 'blur(14px)', y: 12 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{ delay: 0.25 + 8 * 0.07, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                .
                            </motion.span>
                        </h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                            style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(138,147,173,.9)', maxWidth: 420, marginBottom: 36, fontWeight: 300 }}
                        >
                            Beyond maps, there are stories waiting — eight living expeditions, each one a passage into the atmospheres of a place. Choose a waypoint.
                        </motion.p>

                        {/* Menu */}
                        <motion.ul
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                            style={{ listStyle: 'none', marginBottom: 40, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,.06)' }}
                        >
                            {PLACES.map((place, i) => {
                                const isActive = place.id === activePlaceId;
                                return (
                                    <li
                                        key={place.id}
                                        className="relative flex items-center gap-3"
                                        style={{
                                            padding: `9px 0 9px ${isActive ? 36 : 20}px`,
                                            fontSize: 11,
                                            letterSpacing: '0.28em',
                                            textTransform: 'uppercase',
                                            color: isActive ? '#fff' : 'rgba(90,99,128,.8)',
                                            cursor: 'none',
                                            transition: 'color .3s, padding-left .4s cubic-bezier(.2,.8,.2,1)',
                                        }}
                                        onMouseEnter={() => { activate(place.id); setIsHovering(true); }}
                                        onMouseLeave={() => setIsHovering(false)}
                                        onClick={handleEnter}
                                    >
                                        {/* Left border indicator */}
                                        <div
                                            className="absolute"
                                            style={{
                                                left: -1, top: '50%',
                                                width: isActive ? 24 : 0,
                                                height: 1,
                                                background: '#e4b660',
                                                transform: 'translateY(-50%)',
                                                transition: 'width .4s cubic-bezier(.2,.8,.2,1)',
                                            }}
                                        />
                                        <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'none', color: isActive ? '#e4b660' : 'rgba(90,99,128,.6)', transition: 'color .3s' }}>0{i + 1}</span>
                                        <span>{place.name.toUpperCase()}</span>
                                        <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'none', marginLeft: 'auto', opacity: isActive ? 0.8 : 0, color: '#e4b660', transition: 'opacity .3s' }}>
                                            {place.tag}
                                        </span>
                                    </li>
                                );
                            })}
                        </motion.ul>

                        {/* CTA row */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.75, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                            className="flex items-center gap-5 mb-7"
                        >
                            <button
                                onClick={handleEnter}
                                onMouseMove={(e) => {
                                    const r = e.currentTarget.getBoundingClientRect();
                                    setCtaMx(e.clientX - r.left);
                                    setCtaMy(e.clientY - r.top);
                                }}
                                onMouseEnter={() => { setCtaHovered(true); setIsHovering(true); }}
                                onMouseLeave={() => { setCtaHovered(false); setIsHovering(false); }}
                                className="group relative inline-flex items-center gap-3.5 overflow-hidden isolate"
                                style={{
                                    padding: '18px 34px',
                                    borderRadius: 99,
                                    background: 'linear-gradient(135deg, #e4b660, #c89345)',
                                    color: '#1a1405',
                                    fontWeight: 500,
                                    fontSize: 14,
                                    letterSpacing: '0.04em',
                                    border: 'none',
                                    cursor: 'none',
                                    boxShadow: '0 12px 40px rgba(228,182,96,.25), inset 0 1px 0 rgba(255,255,255,.35)',
                                }}
                            >
                                {/* Cursor-follow glow ring */}
                                <div
                                    className="absolute inset-[-3px] rounded-[99px] pointer-events-none transition-opacity duration-300"
                                    style={{
                                        padding: 3,
                                        background: `radial-gradient(120px circle at ${ctaMx}px ${ctaMy}px, rgba(247,212,136,.9), rgba(228,182,96,.15) 40%, transparent 70%)`,
                                        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                                        WebkitMaskComposite: 'xor',
                                        maskComposite: 'exclude',
                                        opacity: ctaHovered ? 1 : 0,
                                    }}
                                />
                                {/* Shimmer sweep */}
                                <motion.div
                                    className="absolute pointer-events-none"
                                    style={{
                                        inset: -2,
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.55) 50%, transparent 100%)',
                                        skewX: -18,
                                        zIndex: 1,
                                    }}
                                    initial={{ x: '-120%' }}
                                    animate={ctaHovered ? { x: '120%' } : { x: '-120%' }}
                                    transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                                />
                                <span className="relative" style={{ zIndex: 2 }}>Begin Your Journey</span>
                                <motion.span
                                    className="relative inline-block"
                                    style={{ zIndex: 2 }}
                                    animate={{ x: [0, 6, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.span>
                            </button>

                            {/* Sound toggle */}
                            <div
                                onMouseEnter={() => setIsHovering(true)}
                                onMouseLeave={() => setIsHovering(false)}
                            >
                                <SoundToggle />
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ═══ BOTTOM CHROME ═══ */}
                <div
                    className="absolute flex justify-between items-end pointer-events-none"
                    style={{ left: 72, right: 72, bottom: 24, zIndex: 5, ...MONO, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(90,99,128,.8)' }}
                >
                    <div className="flex flex-col gap-[3px]">
                        <span style={{ opacity: 0.5 }}>CURRENT WAYPOINT</span>
                        <span style={{ color: 'rgba(233,236,245,.9)', fontSize: 11 }}>
                            {activePlace.name.toUpperCase()} · {activePlace.sub}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-2" style={{ textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                        <span>Scroll</span>
                        <div className="relative" style={{ width: 20, height: 30, border: '1px solid rgba(255,255,255,.2)', borderRadius: 12 }}>
                            <div
                                className="absolute"
                                style={{
                                    top: 6, left: '50%',
                                    width: 2, height: 6,
                                    background: '#e4b660',
                                    borderRadius: 2,
                                    animation: 'hero-scroll-dot 1.8s ease-in-out infinite',
                                    transform: 'translateX(-50%)',
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-[3px] text-right">
                        <span style={{ opacity: 0.5 }}>SIGNAL</span>
                        <span style={{ color: 'rgba(233,236,245,.9)', fontSize: 11 }}>— transmitting · 482 ms</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default LandingExperience;
