import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'
import type { Patient } from '../lib/types'
import { useT } from '../lib/i18n'

useGLTF.preload('/twin.glb')

type Sev = 'red' | 'amber' | 'green'
const COL: Record<Sev, string> = { red: '#DC2626', amber: '#D97706', green: '#16A34A' }

// modeldagi a'zo joylashuvi (markazlangan, balandlik ~2.4 birlik: y ∈ [-1.2, 1.2])
const MPOS: Record<string, [number, number, number]> = {
  head: [0, 0.95, 0.30],
  eyes: [0, 0.88, 0.33],
  heart: [-0.16, 0.34, 0.42],
  lungs: [0.16, 0.42, 0.42],
  belly: [0, -0.12, 0.45],
  kidney: [-0.18, -0.30, 0.30],
  handL: [-0.5, -0.35, 0.15],
  handR: [0.5, -0.35, 0.15],
}

interface Region { key: string; sev: Sev; label: string; reason: string }
type Tr = { td: (s: string) => string; sym: (s: string) => string; L: Record<string, string> }

function regionsFor(p: Patient, { td, sym, L }: Tr): Region[] {
  const last = p.encounters[p.encounters.length - 1]
  const syms = new Set(last?.symptoms ?? [])
  const factors = (last?.assessment.factors ?? []).map((f) => f.label)
  const conds = p.conditions
  const spo2 = last?.vitals?.spo2 ?? 100
  const pregnant = !!p.gestational_week
  const hasF = (kw: string) => factors.some((x) => x.toLowerCase().includes(kw))
  const hasC = (kw: string) => conds.some((x) => x.toLowerCase().includes(kw))
  const condLabel = (kw: string) => { const c = conds.find((x) => x.toLowerCase().includes(kw)); return c ? td(c) : '' }

  let head: Sev = 'green', headR = ''
  if (syms.has('bosh_ogrigi')) { head = 'red'; headR = sym('bosh_ogrigi') }
  else if (hasF('kriz')) { head = 'red'; headR = td('Gipertonik kriz') }
  else if (hasF('yuqori isitma')) { head = 'red'; headR = td('Yuqori isitma') }
  else if (syms.has('bosh_aylanishi')) { head = 'amber'; headR = sym('bosh_aylanishi') }
  else if (hasF('isitma')) { head = 'amber'; headR = td('Isitma') }

  const eyes: Sev = syms.has('koz_parcha') ? 'red' : 'green'
  const eyesR = syms.has('koz_parcha') ? sym('koz_parcha') : ''

  let heart: Sev = 'green', heartR = ''
  if (syms.has('kokrak_ogrigi')) { heart = 'red'; heartR = sym('kokrak_ogrigi') }
  else if (hasF('kriz')) { heart = 'red'; heartR = td('Gipertonik kriz') }
  else if (hasF("og'ir gipertenziya")) { heart = 'red'; heartR = td("Og'ir gipertenziya") }
  else if (hasC('yurak')) { heart = 'amber'; heartR = condLabel('yurak') }
  else if (hasC('gipertenziya') || hasF('gipertenziya')) { heart = 'amber'; heartR = condLabel('gipertenziya') || td('Gipertenziya') }
  else if (hasF('taxikardiya')) { heart = 'amber'; heartR = td('Taxikardiya') }
  else if (hasC('anemiya') || hasF('anemiya')) { heart = 'amber'; heartR = condLabel('anemiya') || td("O'rtacha anemiya") }

  let lungs: Sev = 'green', lungsR = ''
  if (hasF('kislorod tanqisligi')) { lungs = 'red'; lungsR = td('Kislorod tanqisligi') }
  else if (syms.has('nafas_qisilishi') && spo2 < 94) { lungs = 'red'; lungsR = sym('nafas_qisilishi') }
  else if (hasC('astma')) { lungs = 'amber'; lungsR = condLabel('astma') }
  else if (hasC("o'pka") || hasC('opka')) { lungs = 'amber'; lungsR = condLabel("o'pka") || condLabel('opka') }
  else if (hasF('kislorod pasaygan')) { lungs = 'amber'; lungsR = td('Kislorod pasaygan') }
  else if (syms.has('nafas_qisilishi')) { lungs = 'amber'; lungsR = sym('nafas_qisilishi') }

  let belly: Sev = 'green', bellyR = ''
  if (pregnant) {
    if (hasF('preeklampsiya')) { belly = 'red'; bellyR = td('Preeklampsiya belgilari') }
    else if (syms.has('harakat_kamaygan')) { belly = 'red'; bellyR = sym('harakat_kamaygan') }
    else if (syms.has('qorin_ogrigi')) { belly = 'amber'; bellyR = sym('qorin_ogrigi') }
  } else {
    if (hasC('diabet')) { belly = 'amber'; bellyR = condLabel('diabet') }
    else if (hasF('qand')) { belly = 'amber'; bellyR = td('Yuqori qand') }
    else if (hasC('gerd')) { belly = 'amber'; bellyR = condLabel('gerd') }
    else if (syms.has('qorin_ogrigi')) { belly = 'amber'; bellyR = sym('qorin_ogrigi') }
  }

  const kidney: Sev = hasC('buyrak') ? 'amber' : 'green'
  const kidneyR = hasC('buyrak') ? condLabel('buyrak') : ''
  const hands: Sev = syms.has('shish') ? 'amber' : 'green'
  const handsR = syms.has('shish') ? sym('shish') : ''

  return [
    { key: 'head', sev: head, label: L.head, reason: headR },
    { key: 'eyes', sev: eyes, label: L.eyes, reason: eyesR },
    { key: 'heart', sev: heart, label: L.heart, reason: heartR },
    { key: 'lungs', sev: lungs, label: L.lungs, reason: lungsR },
    { key: 'belly', sev: belly, label: pregnant ? L.belly : L.abdomen, reason: bellyR },
    { key: 'kidney', sev: kidney, label: L.kidney, reason: kidneyR },
    { key: 'handL', sev: hands, label: L.hands, reason: handsR },
    { key: 'handR', sev: hands, label: L.hands, reason: handsR },
  ]
}

function AnatomyModel() {
  const { scene } = useGLTF('/twin.glb')
  const model = useMemo(() => {
    const obj = scene.clone(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = new THREE.Vector3(); box.getSize(size)
    const center = new THREE.Vector3(); box.getCenter(center)
    obj.position.set(-center.x, -center.y, -center.z)
    const wrap = new THREE.Group()
    wrap.add(obj)
    wrap.scale.setScalar(2.4 / (size.y || 1))
    return wrap
  }, [scene])
  return <primitive object={model} />
}

function Marker({ r }: { r: Region }) {
  const ref = useRef<Mesh>(null)
  const pos = MPOS[r.key] ?? [0, 0, 0]
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.22)
  })
  return (
    <group position={pos}>
      <mesh ref={ref} renderOrder={999}>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshBasicMaterial color={COL[r.sev]} transparent opacity={0.95} depthTest={false} />
      </mesh>
      <mesh renderOrder={998}>
        <ringGeometry args={[0.08, 0.11, 24]} />
        <meshBasicMaterial color={COL[r.sev]} transparent opacity={0.5} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Scene({ markers }: { markers: Region[] }) {
  const grp = useRef<Group>(null)
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.3 })
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[0, -1, 3]} intensity={0.6} color="#B42475" />
      <group ref={grp}>
        <AnatomyModel />
        {markers.map((r) => <Marker key={r.key} r={r} />)}
      </group>
    </>
  )
}

const SEV_STYLE: Record<Sev, { chip: string; dot: string; key: string }> = {
  red: { chip: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300', dot: 'bg-red-500', key: 'body.high' },
  amber: { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', dot: 'bg-amber-500', key: 'body.watch' },
  green: { chip: '', dot: 'bg-green-500', key: 'body.ok' },
}

export function TwinBody({ patient }: { patient: Patient }) {
  const { t, td, sym } = useT()
  const L = {
    head: t('body.head'), eyes: t('body.eyes'), heart: t('body.heart'),
    lungs: t('body.lungs'), belly: t('body.belly'), abdomen: t('body.abdomen'),
    kidney: t('body.kidney'), hands: t('body.hands'),
  }
  const regions = regionsFor(patient, { td, sym, L })
  const markers = regions.filter((r) => r.sev !== 'green')
  const affected = markers.filter((r, i, arr) => arr.findIndex((x) => x.label === r.label) === i)
    .sort((a, b) => (a.sev === 'red' ? 0 : 1) - (b.sev === 'red' ? 0 : 1))

  return (
    <div>
      <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[11px] text-slate-400">
          {t('body.hintDrag')}
        </div>
        <Canvas camera={{ position: [0, 0, 3.6], fov: 42 }} dpr={[1, 2]}>
          <Scene markers={markers} />
          <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.4}
            maxPolarAngle={Math.PI / 1.8} target={[0, 0, 0]} />
        </Canvas>
      </div>

      {/* AI tahlillari — modeldan tashqarida, pastda */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('body.analysis')}</p>
        {affected.length === 0 ? (
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
            ✓ {t('body.normal')}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {affected.map((r) => {
              const st = SEV_STYLE[r.sev]
              return (
                <div key={r.key} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{r.label}</p>
                    {r.reason && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{r.reason}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>{t(st.key)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
