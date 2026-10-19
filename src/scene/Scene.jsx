import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Tower, Ground, Monolith, CityCluster, GOLD, GOLD_LIGHT } from './Objects.jsx'
import ProjectShowcase from './ProjectShowcase.jsx'
import { QUALITY } from './quality.js'

/* Station positions along -Z. One per HTML section.
   `z` is where the CONTENT sits; the camera stands CAM_OFFSET in front of it.
   `x` shifts the camera sideways so the 3D subject sits opposite its panel
   (panels alternate left/right down the page). */
const CAM_OFFSET = 13

const STATIONS = [
  { z: 0, y: 1.4, look: 2.4, x: 1.5 },
  { z: -34, y: 0.6, look: 0.4, x: -2.4 },
  { z: -68, y: 0.4, look: 0, x: 2.4 },
  { z: -102, y: 1.6, look: 0.6, x: -2.4 },
  { z: -134, y: 0.8, look: 0.2, x: 2.4 },
]

function CameraRig({ station, frac }) {
  useFrame((state, delta) => {
    const camera = state.camera
    const i = Math.min(STATIONS.length - 1, Math.max(0, Math.floor(station)))
    const next = Math.min(STATIONS.length - 1, i + 1)
    const t = THREE.MathUtils.clamp(frac, 0, 1)
    const a = STATIONS[i]
    const b = STATIONS[next]
    const ease = t * t * (3 - 2 * t)

    const sceneZ = THREE.MathUtils.lerp(a.z, b.z, ease)
    const targetZ = sceneZ + CAM_OFFSET
    const targetY = THREE.MathUtils.lerp(a.y, b.y, ease)
    const lookY = THREE.MathUtils.lerp(a.look, b.look, ease)
    const lookX = THREE.MathUtils.lerp(a.x, b.x, ease)

    const { pointer } = state
    const k = Math.min(1, delta * 3)
    camera.position.z += (targetZ + pointer.x * 1.2 - camera.position.z) * k
    camera.position.y += (targetY + pointer.y * 0.8 - camera.position.y) * k
    camera.position.x += (lookX + pointer.x * 0.6 - camera.position.x) * k
    camera.lookAt(lookX, lookY, sceneZ)
  })
  return null
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.9} color="#8fa0c8" />
      <hemisphereLight args={['#9fb4e8', '#1a1408', 0.7]} />
      <directionalLight position={[6, 10, 6]} intensity={2.4} color="#fff6e0" />
      <directionalLight position={[-7, 4, -5]} intensity={1.1} color="#6f8fd6" />
      <pointLight position={[-6, 3, 4]} intensity={90} color={GOLD} distance={26} decay={1.6} />
      <pointLight position={[6, 2, 2]} intensity={60} color="#6f8fd6" distance={24} decay={1.6} />
      <pointLight position={[0, 12, 0]} intensity={70} color={GOLD_LIGHT} distance={20} decay={1.5} />

      {/* one local light rig per station — the global lights fall off long
          before reaching the scenes at z = -34, -68, -102, -134 */}
      {STATIONS.map((s, i) => (
        <group key={i} position={[s.x * 0.5, 0, s.z]}>
          <pointLight
            position={[0, 6, 6]}
            intensity={110}
            color={GOLD_LIGHT}
            distance={22}
            decay={1.4}
          />
          <pointLight position={[-6, 2, 5]} intensity={70} color={GOLD} distance={20} decay={1.4} />
          <pointLight position={[6, 1, 4]} intensity={55} color="#7d9de0" distance={20} decay={1.4} />
          <directionalLight position={[4, 7, 6]} intensity={1.6} color="#fff3dd" />
        </group>
      ))}
    </>
  )
}

/* Rendered when WebGL is unavailable, so the page never shows an empty box. */
function SceneFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshBasicMaterial color={GOLD} />
    </mesh>
  )
}

export default function Scene({
  station = 0,
  frac = 0,
  projects = [],
  quality = 'high',
  activeProject = 0,
  onSelectProject,
}) {
  const q = QUALITY[quality] || QUALITY.high

  // NOTE: the gl object identity must stay stable, otherwise R3F tears down
  // and rebuilds the WebGL renderer on every render.
  const gl = useMemo(
    () => ({ antialias: q.antialias, alpha: false, powerPreference: 'high-performance' }),
    [q.antialias],
  )
  const camera = useMemo(() => ({ position: [1.5, 1.4, 13], fov: 48 }), [])

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        className="canvas"
        dpr={q.dpr}
        gl={gl}
        camera={camera}
        frameloop="always"
        fallback={<SceneFallback />}
        onCreated={(state) => {
          state.gl.setClearColor('#06070c', 1)
          window.__r3fCreated = true
          window.__r3f = state
        }}
        onError={(e) => {
          window.__r3fError = String(e && (e.stack || e.message || e))
        }}
      >
        <color attach="background" args={['#06070c']} />
        <fog attach="fog" args={['#06070c', 14, 46]} />
        {q.env && (
          <Environment resolution={64} frames={1}>
            <Lightformer form="rect" intensity={2.5} color="#ffffff" scale={[10, 10, 1]} position={[0, 8, 4]} rotation={[-Math.PI / 3, 0, 0]} />
            <Lightformer form="rect" intensity={1.4} color={GOLD} scale={[8, 4, 1]} position={[-6, 2, 3]} rotation={[0, Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={1.4} color="#e8cf94" scale={[8, 4, 1]} position={[6, 2, 3]} rotation={[0, -Math.PI / 2, 0]} />
            <Lightformer form="circle" intensity={1} color="#6d7fa8" scale={6} position={[0, -4, 2]} rotation={[Math.PI / 2, 0, 0]} />
          </Environment>
        )}
        <Lights />
        {q.sparkles > 0 && (
          <Sparkles count={q.sparkles} scale={[26, 14, 120]} size={1.8} speed={0.25} color="#d8c493" />
        )}

        <Tower position={[2.9, 0, 0]} quality={q} />
        <Ground position={[2.9, 0, 0]} />

        <Suspense fallback={null}>
          <ProjectShowcase
            projects={projects}
            position={[0, 0.4, -34]}
            active={activeProject}
            onSelect={onSelectProject}
            quality={q}
          />
        </Suspense>

        {/* NOTE: the position goes on <Float> (the outer group), not on the
            child. Float rotates its INNER group, so a child placed at
            z=-68 inside it gets swung ~8 units off-axis by the rotation. */}
        <Float speed={1.2} floatIntensity={0.8} rotationIntensity={0.4} position={[0, 0.4, -68]}>
          <Monolith scale={2.6} />
        </Float>

        <CityCluster position={[0, 0, -102]} scale={1.8} />

        <Float speed={1.6} floatIntensity={1.2} rotationIntensity={0.5} position={[0, 0.6, -134]}>
          <mesh scale={2.6}>
            <icosahedronGeometry args={[1.5, 1]} />
            <meshStandardMaterial
              color="#2a3348"
              metalness={0.9}
              roughness={0.2}
              emissive="#0d1120"
              emissiveIntensity={1}
            />
          </mesh>
        </Float>

        <CameraRig station={station} frac={frac} />
      </Canvas>
    </div>
  )
}
