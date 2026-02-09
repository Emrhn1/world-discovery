import type { Transition, Variants } from 'framer-motion';
import { prefersReducedMotion } from './utils';

// Check for reduced motion preference
const shouldReduceMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return prefersReducedMotion();
};

// Base transition configurations
export const transitions: Record<string, Transition> = {
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    smooth: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    cinematic: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.8 },
    slow: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 1.2 },
    fast: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
};

// Fade variants
export const fadeVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    },
    exit: {
        opacity: 0,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Fade up variants (for content reveals)
export const fadeUpVariants: Variants = {
    hidden: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    },
    exit: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : -10,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Fade down variants
export const fadeDownVariants: Variants = {
    hidden: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : -20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    },
    exit: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : 10,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Scale variants (for buttons, cards)
export const scaleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: shouldReduceMotion() ? 1 : 0.95,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
        opacity: 0,
        scale: shouldReduceMotion() ? 1 : 0.95,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Stagger container for list animations
export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

// Stagger item for list animations
export const staggerItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : 15,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    },
    exit: {
        opacity: 0,
        y: shouldReduceMotion() ? 0 : -10,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Slide in from left
export const slideLeftVariants: Variants = {
    hidden: {
        opacity: 0,
        x: shouldReduceMotion() ? 0 : -50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.8 },
    },
    exit: {
        opacity: 0,
        x: shouldReduceMotion() ? 0 : -30,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Slide in from right
export const slideRightVariants: Variants = {
    hidden: {
        opacity: 0,
        x: shouldReduceMotion() ? 0 : 50,
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.8 },
    },
    exit: {
        opacity: 0,
        x: shouldReduceMotion() ? 0 : 30,
        transition: { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: 0.3 },
    },
};

// Overlay backdrop variants
export const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4 },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.3 },
    },
};

// Cinematic reveal (for dramatic intros)
export const cinematicRevealVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: shouldReduceMotion() ? 1 : 1.1,
        filter: 'blur(10px)',
    },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    exit: {
        opacity: 0,
        scale: shouldReduceMotion() ? 1 : 0.95,
        filter: 'blur(5px)',
        transition: {
            duration: 0.5,
        },
    },
};

// Globe rotation animation
export const globeRotationVariants: Variants = {
    hidden: { rotateY: 0 },
    visible: {
        rotateY: 360,
        transition: {
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

// Pulse glow animation (for markers)
export const pulseGlowVariants: Variants = {
    hidden: { scale: 1, opacity: 0.5 },
    visible: {
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
        },
    },
};

// Knowledge capsule animation (for learned button)
export const capsuleVariants: Variants = {
    idle: { scale: 1, rotate: 0 },
    collecting: {
        scale: [1, 1.2, 0.8, 1],
        rotate: [0, -10, 10, 0],
        transition: {
            duration: 0.5,
            ease: 'easeInOut',
        },
    },
    collected: {
        scale: [1, 1.5, 0],
        y: -50,
        opacity: [1, 1, 0],
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};
