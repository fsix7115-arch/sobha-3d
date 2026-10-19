import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GOLD = '#b79a4d'
const GOLD_LIGHT = '#e8cf94'
const GLASS = '#0e1118'

/* ------------------------------------------------------------------ *
 * Procedural luxury tower — the SOBHA skyscraper
 * ------------------------------------------------------------------ */
function Tower({ position = [0, 0, 0], quality }) {
  const group = useRef()
  const light = quality?.clearcoat !== false

  const floors = quality?.antialias === false ? 14 : 18
  const floorH = 0.34
  const baseW = 2.5
  const perFace = quality?.antialias === false ? 4 : 6

  const windows = useMemo(() => {
    const list = []
    for (let f = 0; f < floors; f++) {
      const t = f / (floors - 1)
      const w = baseW * (1 - t * 0.22)
      for (let face = 0; face < 4; face++) {
        for (let i = 0; i < perFace; i++) {
          const u = (i / (perFace - 1) - 0.5) * w * 0.82
          const y = f * floorH
          const lit = (f * 7 + i * 3 + face * 11) % 5 !== 0
          let pos
          if (face === 0) pos = [u, y, w / 2]
          else if (face === 1) pos = [w / 2, y, -u]
          else if (face === 2) pos = [-u, y, -w / 2]
          else pos = [-w / 2, y, u]
          list.push({ pos, rot: face * Math.PI * 0.5, lit })
        }
      }
    }
    return list
  }, [floors, perFace])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  const applyWindows = (mesh) => {
    if (!mesh) return
    windows.forEach((w, i) => {
      dummy.position.set(...w.pos)
      dummy.rotation.set(0, w.rot, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, new THREE.Color(w.lit ? GOLD_LIGHT : '#2a2f3d'))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = Math.sin(t * 0.12) * 0.18
    group.current.position.y = Math.sin(t * 0.5) * 0.08
  })

  const towerH = floors * floorH
  const bands = Math.floor(floors / 4)

  return (
    <group ref={group} position={position}>
      {/* podium */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[3.4, 0.5, 3.4]} />
        <meshStandardMaterial color="#16181f" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[3.7, 0.08, 3.7]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>

      {/* main shaft */}
      <mesh position={[0, towerH / 2 + 0.4, 0]}>
        <boxGeometry args={[baseW, towerH, baseW]} />
        {light ? (
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.55}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.6}
          />
        ) : (
          <meshStandardMaterial
            color="#39415a"
            metalness={0.35}
            roughness={0.42}
            emissive="#0e1220"
            emissiveIntensity={1}
          />
        )}
      </mesh>

      {/* vertical gold corner pilasters — catch light and define the silhouette */}
      {[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * baseW * 0.5, towerH / 2 + 0.4, sz * baseW * 0.5]}>
          <boxGeometry args={[0.09, towerH, 0.09]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={1}
            roughness={0.3}
            emissive={GOLD}
            emissiveIntensity={0.55}
          />
        </mesh>
      ))}

      {/* horizontal floor plates — make the storey rhythm readable */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={`f${i}`} position={[0, 0.4 + i * floorH, 0]}>
          <boxGeometry args={[baseW * 1.035, 0.055, baseW * 1.035]} />
          <meshStandardMaterial
            color="#c8b389"
            metalness={0.7}
            roughness={0.4}
            emissive="#5a4a22"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}

      {/* gold banding every 4 floors */}
      {Array.from({ length: bands }).map((_, i) => (
        <mesh key={i} position={[0, 0.4 + i * floorH * 4, 0]}>
          <boxGeometry args={[baseW * 1.06, 0.08, baseW * 1.06]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={1}
            roughness={0.25}
            emissive={GOLD}
            emissiveIntensity={0.45}
          />
        </mesh>
      ))}

      {/* illuminated windows */}
      <instancedMesh
        ref={applyWindows}
        args={[null, null, windows.length]}
        position={[0, 0.62, 0]}
      >
        <planeGeometry args={[0.2, 0.24]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* crown */}
      <mesh position={[0, towerH + 0.75, 0]}>
        <cylinderGeometry args={[0.14, baseW * 0.42, 0.7, 4]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, towerH + 1.35, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial color={GOLD_LIGHT} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Ground disc with glowing rings
 * ------------------------------------------------------------------ */
function Ground({ position = [0, 0, 0] }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.02
  })
  return (
    <group position={[position[0], -0.16, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#141a28" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.2, 5.28, 64]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[8.4, 8.44, 64]} />
        <meshBasicMaterial color="#4a5878" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Floating gold monolith (philosophy scene)
 * ------------------------------------------------------------------ */
function Monolith({ scale = 1 }) {
  const ref = useRef()
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.35
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12
  })
  return (
    <mesh ref={ref} scale={scale}>
      <octahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial
        color={GOLD}
        metalness={1}
        roughness={0.18}
        emissive={GOLD}
        emissiveIntensity={0.35}
        flatShading
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ *
 * City cluster (locations scene)
 * ------------------------------------------------------------------ */
function CityCluster({ position, scale = 1 }) {
  const ref = useRef()
  const towers = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => {
        const a = (i / 22) * Math.PI * 2
        const r = 1.8 + (i % 5) * 0.9
        const h = 0.8 + ((i * 37) % 11) * 0.28
        return {
          pos: [Math.cos(a) * r, h / 2, Math.sin(a) * r],
          h,
          w: 0.42 + ((i * 13) % 5) * 0.09,
          gold: i % 4 === 0,
        }
      }),
    [],
  )
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.07
  })
  return (
    <group ref={ref} position={position} scale={scale}>
      {towers.map((t, i) => (
        <mesh key={i} position={t.pos}>
          <boxGeometry args={[t.w, t.h, t.w]} />
          <meshStandardMaterial
            color={t.gold ? '#4a3f22' : '#141821'}
            metalness={0.85}
            roughness={0.3}
            emissive={t.gold ? GOLD : '#0a0d14'}
            emissiveIntensity={t.gold ? 0.5 : 1}
          />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[7, 40]} />
        <meshStandardMaterial color="#080a0f" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  )
}

export { Tower, Ground, Monolith, CityCluster, GOLD, GOLD_LIGHT }
