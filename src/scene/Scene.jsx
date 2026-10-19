import { useRef, useMemo, useState, useCallback, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
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

/* Light budget matters more than anything else here: every lit material
   evaluates every light in the scene per fragment. 27 lights (one rig per
   station) collapsed the frame rate, so the station rig is a SINGLE set of
   lights that travels to the active station instead of 5 static copies. */
function Lights({ station = 0 }) {
  const rig = useRef()
  useFrame((state, delta) => {
    if (!rig.current) return
    const i = Math.min(STATIONS.length - 1, Math.max(0, Math.floor(station)))
    const s = STATIONS[i]
    const k = Math.min(1, delta * 2.5)
    rig.current.position.x += (s.x * 0.5 - rig.current.position.x) * k
    rig.current.position.z += (s.z - rig.current.position.z) * k
  })
  return (
    <>
      <ambientLight intensity={0.95} color="#93a4cc" />
      <hemisphereLight args={['#9fb4e8', '#241c0c', 0.85]} />
      <directionalLight position={[6, 10, 6]} intensity={2.3} color="#fff6e0" />

      {/* the travelling station rig: 1 point + 1 fill = 2 lights, not 20 */}
      <group ref={rig}>
        <pointLight
          position={[0, 6, 6]}
          intensity={130}
          color={GOLD_LIGHT}
          distance={26}
          decay={1.4}
        />
        <pointLight position={[-6, 2, 5]} intensity={80} color={GOLD} distance={24} decay={1.4} />
      </group>
    </>
  )
}

/* The `fallback` prop of <Canvas> is rendered as DOM content INSIDE the
   <canvas> element — it must be plain HTML, not R3F elements. Passing a
   <mesh> here makes React try to create a <mesh> DOM tag, which errors. */
function SceneFallback() {
  return <span className="canvas-fallback" aria-hidden="true" />
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

  /* Adaptive resolution: when the device cannot hold a usable frame rate,
     drop the pixel ratio until it can, and climb back when it recovers.
     This is what makes the site smooth on a weak laptop GPU instead of a
     slideshow. */
  const maxDpr = Array.isArray(q.dpr) ? q.dpr[1] : q.dpr
  const [dpr, setDpr] = useState(q.dpr)
  const onDecline = useCallback(() => {
    setDpr((d) => Math.max(0.5, (Array.isArray(d) ? d[0] : d) - 0.25))
  }, [])
  const onIncline = useCallback(() => {
    setDpr((d) => Math.min(maxDpr, (Array.isArray(d) ? d[0] : d) + 0.25))
  }, [maxDpr])

  /* Only the current station is rendered. The other scenes are 34+ units
     away and invisible behind the fog, but they still cost draw calls and
     shader work every frame.

     IMPORTANT: mount conditionally, do NOT keep them mounted with
     visible={false}. A mounted project ring calls useTexture, which
     suspends; while that suspension is pending R3F's canvas root cannot
     finish configuring, so onCreated never fires and the canvas stays at
     the default 300x150. Remounting later is cheap because drei caches the
     textures by URL — the promise resolves from cache, no refetch. */
  const near = (z) => Math.abs(z - STATIONS[station].z) < 20

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        className="canvas"
        dpr={dpr}
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
        <PerformanceMonitor
          onDecline={onDecline}
          onIncline={onIncline}
          flipflops={4}
          onFallback={() => setDpr(0.5)}
        />
        <color attach="background" args={['#06070c']} />
        <fog attach="fog" args={['#06070c', 14, 46]} />
        {q.env && (
          <Environment resolution={32} frames={1}>
            <Lightformer form="rect" intensity={2.5} color="#ffffff" scale={[10, 10, 1]} position={[0, 8, 4]} rotation={[-Math.PI / 3, 0, 0]} />
            <Lightformer form="rect" intensity={1.4} color={GOLD} scale={[8, 4, 1]} position={[-6, 2, 3]} rotation={[0, Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={1.4} color="#e8cf94" scale={[8, 4, 1]} position={[6, 2, 3]} rotation={[0, -Math.PI / 2, 0]} />
            <Lightformer form="circle" intensity={1} color="#6d7fa8" scale={6} position={[0, -4, 2]} rotation={[Math.PI / 2, 0, 0]} />
          </Environment>
        )}
        <Lights station={station} />
        {q.sparkles > 0 && (
          <Sparkles count={q.sparkles} scale={[26, 14, 120]} size={1.8} speed={0.25} color="#d8c493" />
        )}

        {near(0) && (
          <>
            <Tower position={[2.9, 0, 0]} quality={q} />
            <Ground position={[2.9, 0, 0]} />
          </>
        )}

        {near(-34) && (
          <Suspense fallback={null}>
            <ProjectShowcase
              projects={projects}
              position={[0, 0.4, -34]}
              active={activeProject}
              onSelect={onSelectProject}
              quality={q}
            />
          </Suspense>
        )}

        {/* NOTE: the position goes on <Float> (the outer group), not on the
            child. Float rotates its INNER group, so a child placed at
            z=-68 inside it gets swung ~8 units off-axis by the rotation. */}
        {near(-68) && (
          <Float speed={1.2} floatIntensity={0.8} rotationIntensity={0.4} position={[0, 0.4, -68]}>
            <Monolith scale={2.6} />
          </Float>
        )}

        {near(-102) && <CityCluster position={[0, 0, -102]} scale={1.8} />}

        {near(-134) && (
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
        )}

        <CameraRig station={station} frac={frac} />
      </Canvas>
    </div>
  )
}
