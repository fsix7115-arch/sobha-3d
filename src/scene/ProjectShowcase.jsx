import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GOLD } from './Objects.jsx'

/* ------------------------------------------------------------------ *
 * Carousel of project facades arranged on a ring, 3D-angled
 * ------------------------------------------------------------------ */
export default function ProjectShowcase({
  projects,
  position = [0, 0, 0],
  active = 0,
  onSelect,
  quality,
}) {
  const group = useRef()
  const cards = useRef([])
  // The texture list must keep a STABLE length across renders, otherwise
  // useTexture re-suspends and reallocates. Pick the subset once, per tier.
  const low = quality?.antialias === false
  const list = useMemo(
    () => (low ? projects.slice(0, 6) : projects),
    [low, projects],
  )
  const textures = useTexture(list.map((p) => p.img))
  const targetRotation = useRef(0)

  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    })
  }, [textures])

  const radius = 5.2
  const count = list.length
  const angleFor = (i) => (i / count) * Math.PI * 2

  useFrame((state, delta) => {
    if (!group.current) return
    // rotate ring so the active card faces the camera
    const desired = -angleFor(active)
    targetRotation.current += (desired - targetRotation.current) * Math.min(1, delta * 2.2)
    group.current.rotation.y +=
      (targetRotation.current - group.current.rotation.y) * Math.min(1, delta * 2.2)
    group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.1

    cards.current.forEach((c, i) => {
      if (!c) return
      c.position.y = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.06
    })
  })

  return (
    <group ref={group} position={position}>
      {list.map((p, i) => {
        const a = angleFor(i)
        const x = Math.sin(a) * radius
        const z = Math.cos(a) * radius
        const isActive = i === active
        return (
          <group key={p.slug} position={[x, 0, z]} rotation={[0, a, 0]}>
            <group
              ref={(el) => (cards.current[i] = el)}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(i)
              }}
              scale={isActive ? 1.12 : 0.9}
            >
              <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[2.7, 1.62]} />
                <meshBasicMaterial map={textures[i]} toneMapped={false} transparent />
              </mesh>
              {/* frame */}
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.86, 1.78]} />
                <meshStandardMaterial
                  color={isActive ? GOLD : '#2a3040'}
                  metalness={1}
                  roughness={0.25}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* backing plate */}
              <mesh position={[0, 0, -0.03]}>
                <planeGeometry args={[2.86, 1.78]} />
                <meshStandardMaterial
                  color="#0a0c12"
                  metalness={0.4}
                  roughness={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* pedestal */}
              <mesh position={[0, -1.15, 0]}>
                <boxGeometry args={[1.9, 0.1, 0.7]} />
                <meshStandardMaterial
                  color={isActive ? GOLD : '#1b1f2a'}
                  metalness={1}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, -0.9, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color={GOLD} metalness={1} roughness={0.3} />
              </mesh>
            </group>
          </group>
        )
      })}
      {/* floor ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <ringGeometry args={[radius - 0.55, radius - 0.5, 64]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.36, 0]}>
        <circleGeometry args={[radius + 1.4, 40]} />
        <meshStandardMaterial color="#080a0f" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  )
}
