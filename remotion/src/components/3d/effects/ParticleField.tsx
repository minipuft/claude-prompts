/**
 * ParticleField - 3D Particle System for Liquescent Atmosphere
 *
 * Frame-synced particle field using Three.js Points.
 * Particles drift organically using Perlin-based motion hooks.
 *
 * Features:
 * - Deterministic rendering (same frame = same output)
 * - State-aware coloring (dormant/awakening/liquescent)
 * - Depth-based size attenuation
 * - Organic drift animation
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  useFrameSync,
  useStateColors,
  useParticlePositions,
  useAnimatedParticles,
  useBreathing,
} from '../hooks';
import type { LiquescentState } from '../../../design-system/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ParticleFieldProps {
  /** Number of particles */
  count?: number;
  /** Spread distance from center */
  spread?: number;
  /** Particle base size */
  size?: number;
  /** Current liquescent state */
  state?: LiquescentState;
  /** Drift animation speed */
  driftSpeed?: number;
  /** Depth progress (0-1) for viscosity effects */
  depthProgress?: number;
  /** Random seed for determinism */
  seed?: number;
  /** Opacity multiplier */
  opacity?: number;
  /** Z position offset (for layering) */
  zOffset?: number;
}

// =============================================================================
// PARTICLE FIELD COMPONENT
// =============================================================================

/**
 * ParticleField - Organic drifting particle system
 *
 * Usage:
 * ```tsx
 * <ParticleField
 *   count={100}
 *   spread={20}
 *   state="awakening"
 *   driftSpeed={0.15}
 * />
 * ```
 */
export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 100,
  spread = 15,
  size = 0.08,
  state = 'dormant',
  driftSpeed = 0.1,
  depthProgress = 0,
  seed = 12345,
  opacity = 0.6,
  zOffset = -5,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const colors = useStateColors(state);
  const { glowIntensity } = useBreathing(seed);
  useFrameSync(); // Required for Remotion frame context

  // Generate base positions (deterministic)
  const basePositions = useParticlePositions(count, spread, seed);

  // Animate positions with organic drift
  const animatedPositions = useAnimatedParticles(basePositions, driftSpeed, seed);

  // Depth affects particle appearance - deeper = dimmer, slower
  const depthDimming = 1 - depthProgress * 0.3;

  // Create particle colors array
  const colorArray = useMemo(() => {
    const colorArr = new Float32Array(count * 3);
    const baseColor = colors.primary;

    for (let i = 0; i < count; i++) {
      // Vary colors slightly per particle
      const hueVariation = Math.sin(seed + i * 0.1) * 0.05;
      const particleColor = baseColor.clone();
      particleColor.offsetHSL(hueVariation, 0, 0);

      // Apply depth dimming
      colorArr[i * 3] = particleColor.r * depthDimming;
      colorArr[i * 3 + 1] = particleColor.g * depthDimming;
      colorArr[i * 3 + 2] = particleColor.b * depthDimming;
    }

    return colorArr;
  }, [count, colors.primary, seed, depthDimming]);

  // Update positions every frame
  useFrame(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const positionAttr = geometry.getAttribute('position');

      for (let i = 0; i < count; i++) {
        positionAttr.setXYZ(
          i,
          animatedPositions[i * 3],
          animatedPositions[i * 3 + 1],
          animatedPositions[i * 3 + 2] + zOffset
        );
      }
      positionAttr.needsUpdate = true;

      // Update material opacity with breathing
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = opacity * glowIntensity;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[animatedPositions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// =============================================================================
// LAYERED PARTICLE SYSTEM
// =============================================================================

export interface LayeredParticlesProps {
  /** Current liquescent state */
  state?: LiquescentState;
  /** Depth progress (0-1) */
  depthProgress?: number;
  /** Overall intensity multiplier */
  intensity?: number;
}

/**
 * LayeredParticles - Multiple particle layers at different depths
 *
 * Creates parallax depth illusion with three layers:
 * - Foreground: Larger, faster, brighter
 * - Midground: Medium size and speed
 * - Background: Smaller, slower, dimmer
 */
export const LayeredParticles: React.FC<LayeredParticlesProps> = ({
  state = 'dormant',
  depthProgress = 0,
  intensity = 1,
}) => {
  // Viscosity reduces drift speed at deeper levels
  const viscosityFactor = 1 - depthProgress * 0.6;

  return (
    <group>
      {/* Background layer - small, slow, dim */}
      <ParticleField
        count={60}
        spread={25}
        size={0.04}
        state={state}
        driftSpeed={0.05 * viscosityFactor}
        depthProgress={depthProgress}
        seed={11111}
        opacity={0.3 * intensity}
        zOffset={-15}
      />

      {/* Midground layer - medium */}
      <ParticleField
        count={80}
        spread={18}
        size={0.06}
        state={state}
        driftSpeed={0.1 * viscosityFactor}
        depthProgress={depthProgress}
        seed={22222}
        opacity={0.5 * intensity}
        zOffset={-8}
      />

      {/* Foreground layer - large, fast, bright */}
      <ParticleField
        count={40}
        spread={12}
        size={0.1}
        state={state}
        driftSpeed={0.15 * viscosityFactor}
        depthProgress={depthProgress}
        seed={33333}
        opacity={0.7 * intensity}
        zOffset={-2}
      />
    </group>
  );
};

export default ParticleField;
