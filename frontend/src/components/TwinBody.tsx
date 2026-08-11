import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import type { Mesh } from 'three'
import type { Patient } from '../lib/types'
import { useT } from '../lib/i18n'

type Sev = 'red' | 'amber' | 'green'
const COL: Record<Sev, string> = { red: '#DC2626', amber: '#D97706', green: '#16A34A' }

interface Region { key: string; pos: [number, number, number]; sev: Sev; label: string }

function regionsFor(p: Patient, L: Record<string, string>): Region[] {
  const last = p.encounters[p.encounters.length - 1]
  const syms = new Set(last?.symptoms ?? [])
  const factors = (last?.assessment.factors ?? []).map((f) => f.label)
  const conds = p.conditions
  const hasF = (kw: string) => factors.some((x) => x.toLowerCase().includes(kw))
  const hasC = (kw: string) => conds.some((x) => x.toLowerCase().includes(kw))

  const head: Sev = syms.has('bosh_ogrigi') ? 'red' : 'green'
  const eyes: Sev = syms.has('koz_parcha') ? 'red' : 'green'
  const heart: Sev = hasF("og'ir gipertenziya") ? 'red'
    : (hasF('gipertenziya') || hasC('gipertenziya') || hasF('anemiya')) ? 'amber' : 'green'
  const belly: Sev = (syms.has('harakat_kamaygan') || hasF('preeklampsiya')) ? 'red'
    : (syms.has('qorin_ogrigi') || hasF('glyukoza') || hasF('diabet') || hasC('diabet')) ? 'amber' : 'green'
  const hands: Sev = syms.has('shish') ? 'amber' : 'green'

  return [
    { key: 'head', pos: [0, 1.78, 0.28], sev: head, label: L.head },
    { key: 'eyes', pos: [0, 1.68, 0.31], sev: eyes, label: L.eyes },
    { key: 'heart', pos: [-0.08, 1.12, 0.34], sev: heart, label: L.heart },
    { key: 'belly', pos: [0, 0.72, 0.36], sev: belly, label: L.belly },
    { key: 'handL', pos: [-0.62, 0.62, 0.06], sev: hands, label: L.hands },
    { key: 'handR', pos: [0.62, 0.62, 0.06], sev: hands, label: L.hands },
  ]
}

function Marker({ r }: { r: Region }) {
  const ref = useRef<Mesh>(null)
  const affected = r.sev !== 'green'
  useFrame(({ clock }) => {
    if (ref.current && affected) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.18
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <group position={r.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[affected ? 0.075 : 0.045, 24, 24]} />
        <meshStandardMaterial color={COL[r.sev]} emissive={COL[r.sev]} emissiveIntensity={affected ? 1.1 : 0.4} />
      </mesh>
      {affected && r.key !== 'handR' && (
        <Html center distanceFactor={6} position={[0, 0.16, 0]}>
          <div style={{ whiteSpace: 'nowrap', background: COL[r.sev], color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
            {r.label}
          </div>
        </Html>
      )}
    </group>
  )
}

function Body() {
  const mat = <meshStandardMaterial color="#cbd5e1" roughness={0.7} metalness={0.05} transparent opacity={0.9} />
  return (
    <group position={[0, -0.4, 0]}>
      {/* head */}
      <mesh position={[0, 1.78, 0]}><sphereGeometry args={[0.28, 32, 32]} />{mat}</mesh>
      {/* neck */}
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.09, 0.11, 0.16, 24]} />{mat}</mesh>
      {/* torso */}
      <mesh position={[0, 1.05, 0]}><capsuleGeometry args={[0.33, 0.55, 8, 24]} />{mat}</mesh>
      {/* pelvis */}
      <mesh position={[0, 0.62, 0]}><sphereGeometry args={[0.3, 24, 24]} />{mat}</mesh>
      {/* arms */}
      <mesh position={[-0.45, 1.05, 0]} rotation={[0, 0, 0.18]}><capsuleGeometry args={[0.1, 0.7, 8, 16]} />{mat}</mesh>
      <mesh position={[0.45, 1.05, 0]} rotation={[0, 0, -0.18]}><capsuleGeometry args={[0.1, 0.7, 8, 16]} />{mat}</mesh>
      {/* legs */}
      <mesh position={[-0.16, 0.05, 0]}><capsuleGeometry args={[0.13, 0.8, 8, 16]} />{mat}</mesh>
      <mesh position={[0.16, 0.05, 0]}><capsuleGeometry args={[0.13, 0.8, 8, 16]} />{mat}</mesh>
    </group>
  )
}

export function TwinBody({ patient }: { patient: Patient }) {
  const { t } = useT()
  const L = { head: t('body.head'), eyes: t('body.eyes'), heart: t('body.heart'), belly: t('body.belly'), hands: t('body.hands') }
  const regions = regionsFor(patient, L)
  return (
    <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <Canvas camera={{ position: [0, 0.8, 3.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <pointLight position={[-3, 2, 2]} intensity={0.4} />
        <group position={[0, -0.2, 0]}>
          <Body />
          {regions.map((r) => <Marker key={r.key} r={r} />)}
        </group>
        <OrbitControls enablePan={false} enableZoom autoRotate autoRotateSpeed={0.9} minDistance={2.2} maxDistance={5} target={[0, 0.4, 0]} />
      </Canvas>
    </div>
  )
}
