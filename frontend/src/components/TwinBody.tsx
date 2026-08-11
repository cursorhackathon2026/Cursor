import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { Mesh, Group } from 'three'
import type { Patient } from '../lib/types'
import { useT } from '../lib/i18n'

type Sev = 'red' | 'amber' | 'green'
const COL: Record<Sev, string> = { red: '#DC2626', amber: '#D97706', green: '#16A34A' }

interface Region {
  key: string
  pos: [number, number, number]
  sev: Sev
  label: string
  reason: string
}

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

  // head
  let head: Sev = 'green'; let headR = ''
  if (syms.has('bosh_ogrigi')) { head = 'red'; headR = sym('bosh_ogrigi') }
  else if (hasF('kriz')) { head = 'red'; headR = td('Gipertonik kriz') }
  else if (hasF('yuqori isitma')) { head = 'red'; headR = td('Yuqori isitma') }
  else if (syms.has('bosh_aylanishi')) { head = 'amber'; headR = sym('bosh_aylanishi') }
  else if (hasF('isitma')) { head = 'amber'; headR = td('Isitma') }

  // eyes
  const eyes: Sev = syms.has('koz_parcha') ? 'red' : 'green'
  const eyesR = syms.has('koz_parcha') ? sym('koz_parcha') : ''

  // heart
  let heart: Sev = 'green'; let heartR = ''
  if (syms.has('kokrak_ogrigi')) { heart = 'red'; heartR = sym('kokrak_ogrigi') }
  else if (hasF('kriz')) { heart = 'red'; heartR = td('Gipertonik kriz') }
  else if (hasF("og'ir gipertenziya")) { heart = 'red'; heartR = td("Og'ir gipertenziya") }
  else if (hasC('yurak')) { heart = 'amber'; heartR = condLabel('yurak') }
  else if (hasC('gipertenziya') || hasF('gipertenziya')) { heart = 'amber'; heartR = condLabel('gipertenziya') || td('Gipertenziya') }
  else if (hasF('taxikardiya')) { heart = 'amber'; heartR = td('Taxikardiya') }
  else if (hasC('anemiya') || hasF('anemiya')) { heart = 'amber'; heartR = condLabel('anemiya') || td("O'rtacha anemiya") }

  // lungs
  let lungs: Sev = 'green'; let lungsR = ''
  if (hasF('kislorod tanqisligi')) { lungs = 'red'; lungsR = td('Kislorod tanqisligi') }
  else if (syms.has('nafas_qisilishi') && spo2 < 94) { lungs = 'red'; lungsR = sym('nafas_qisilishi') }
  else if (hasC('astma')) { lungs = 'amber'; lungsR = condLabel('astma') }
  else if (hasC("o'pka") || hasC('opka')) { lungs = 'amber'; lungsR = condLabel("o'pka") || condLabel('opka') }
  else if (hasF('kislorod pasaygan')) { lungs = 'amber'; lungsR = td('Kislorod pasaygan') }
  else if (syms.has('nafas_qisilishi')) { lungs = 'amber'; lungsR = sym('nafas_qisilishi') }

  // belly / abdomen
  let belly: Sev = 'green'; let bellyR = ''
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

  // kidney
  const kidney: Sev = hasC('buyrak') ? 'amber' : 'green'
  const kidneyR = hasC('buyrak') ? condLabel('buyrak') : ''

  // hands
  const hands: Sev = syms.has('shish') ? 'amber' : 'green'
  const handsR = syms.has('shish') ? sym('shish') : ''

  return [
    { key: 'head', pos: [0, 1.72, 0.26], sev: head, label: L.head, reason: headR },
    { key: 'eyes', pos: [0, 1.63, 0.29], sev: eyes, label: L.eyes, reason: eyesR },
    { key: 'heart', pos: [-0.12, 1.12, 0.32], sev: heart, label: L.heart, reason: heartR },
    { key: 'lungs', pos: [0.14, 1.2, 0.3], sev: lungs, label: L.lungs, reason: lungsR },
    { key: 'belly', pos: [0, 0.74, 0.34], sev: belly, label: pregnant ? L.belly : L.abdomen, reason: bellyR },
    { key: 'kidney', pos: [-0.2, 0.66, 0.12], sev: kidney, label: L.kidney, reason: kidneyR },
    { key: 'hands', pos: [-0.6, 0.6, 0.06], sev: hands, label: L.hands, reason: handsR },
    { key: 'handR', pos: [0.6, 0.6, 0.06], sev: hands, label: L.hands, reason: handsR },
  ]
}

function HoloMat() {
  return <meshStandardMaterial color="#5eead4" emissive="#0e7490" emissiveIntensity={0.35}
    transparent opacity={0.55} roughness={0.35} metalness={0.2} />
}

function Marker({ r }: { r: Region }) {
  const ref = useRef<Mesh>(null)
  const halo = useRef<Mesh>(null)
  const affected = r.sev !== 'green'
  useFrame(({ clock }) => {
    if (affected && ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.16
      ref.current.scale.setScalar(s)
    }
    if (affected && halo.current) {
      const t = (clock.elapsedTime % 1.6) / 1.6
      halo.current.scale.setScalar(1 + t * 2.2)
      ;(halo.current.material as any).opacity = 0.5 * (1 - t)
    }
  })
  return (
    <group position={r.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[affected ? 0.07 : 0.035, 24, 24]} />
        <meshStandardMaterial color={COL[r.sev]} emissive={COL[r.sev]} emissiveIntensity={affected ? 1.3 : 0.4} />
      </mesh>
      {affected && (
        <mesh ref={halo}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshBasicMaterial color={COL[r.sev]} transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function Body() {
  return (
    <group position={[0, -0.35, 0]}>
      {/* head */}
      <mesh position={[0, 1.72, 0]}><sphereGeometry args={[0.26, 40, 40]} /><HoloMat /></mesh>
      {/* neck */}
      <mesh position={[0, 1.45, 0]}><cylinderGeometry args={[0.085, 0.1, 0.16, 24]} /><HoloMat /></mesh>
      {/* shoulders */}
      <mesh position={[0, 1.28, 0]}><sphereGeometry args={[0.26, 28, 28]} /><HoloMat /></mesh>
      {/* chest/torso */}
      <mesh position={[0, 1.02, 0]}><capsuleGeometry args={[0.3, 0.5, 10, 28]} /><HoloMat /></mesh>
      {/* waist */}
      <mesh position={[0, 0.68, 0]}><sphereGeometry args={[0.27, 28, 28]} /><HoloMat /></mesh>
      {/* arms */}
      <mesh position={[-0.44, 1.02, 0]} rotation={[0, 0, 0.2]}><capsuleGeometry args={[0.09, 0.72, 8, 18]} /><HoloMat /></mesh>
      <mesh position={[0.44, 1.02, 0]} rotation={[0, 0, -0.2]}><capsuleGeometry args={[0.09, 0.72, 8, 18]} /><HoloMat /></mesh>
      {/* legs */}
      <mesh position={[-0.15, 0.02, 0]}><capsuleGeometry args={[0.12, 0.82, 8, 18]} /><HoloMat /></mesh>
      <mesh position={[0.15, 0.02, 0]}><capsuleGeometry args={[0.12, 0.82, 8, 18]} /><HoloMat /></mesh>
      {/* glowing base ring (platform) */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.02, 16, 64]} />
        <meshStandardMaterial color="#B42475" emissive="#B42475" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

function Scene({ regions }: { regions: Region[] }) {
  const grp = useRef<Group>(null)
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.35 })
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <pointLight position={[-3, 1, 2]} intensity={0.6} color="#22d3ee" />
      <pointLight position={[0, -1, 2]} intensity={0.5} color="#B42475" />
      <group ref={grp} position={[0, -0.2, 0]}>
        <Body />
        {regions.map((r) => <Marker key={r.key} r={r} />)}
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
  // tahlil ro'yxati: faqat ta'sirlangan (bir a'zoni takrorlamaymiz — qo'llar 2 marker)
  const affected = regions.filter((r) => r.sev !== 'green')
    .filter((r, i, arr) => arr.findIndex((x) => x.label === r.label) === i)
    .sort((a, b) => (a.sev === 'red' ? 0 : 1) - (b.sev === 'red' ? 0 : 1))

  return (
    <div>
      <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[11px] text-slate-400">
          {t('body.hintDrag')}
        </div>
        <Canvas camera={{ position: [0, 0.75, 3.3], fov: 45 }} dpr={[1, 2]}>
          <Scene regions={regions} />
          {/* enableZoom=false → sahifa scroll'iga xalaqit bermaydi; faqat sudrab aylantirish */}
          <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.7} target={[0, 0.35, 0]} />
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
