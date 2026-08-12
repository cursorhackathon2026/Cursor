import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { Patient } from '../lib/types'
import { useT } from '../lib/i18n'

const MODEL = '/twin.glb?v=organs'
useGLTF.preload(MODEL)

type Sev = 'red' | 'amber' | 'green'
const COL: Record<Sev, string> = { red: '#DC2626', amber: '#D97706', green: '#16A34A' }

// app region kaliti -> GLB dagi a'zo node nomi
const ORGAN_OF: Record<string, string> = {
  head: 'organ_head', eyes: 'organ_head', heart: 'organ_heart', lungs: 'organ_lungs',
  belly: 'organ_belly', kidney: 'organ_kidney', handL: 'organ_hand_l', handR: 'organ_hand_r',
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

function TwinModel({ organState }: { organState: Map<string, Sev> }) {
  const { scene } = useGLTF(MODEL)
  const { root, organs } = useMemo(() => {
    const obj = scene.clone(true)
    const organs: Mesh[] = []
    obj.traverse((c) => {
      const mesh = c as Mesh
      if (!mesh.isMesh) return
      mesh.material = (mesh.material as THREE.Material).clone()
      if (mesh.name === 'geometry_0') {
        const m = mesh.material as MeshStandardMaterial
        m.transparent = true; m.opacity = 0.24; m.depthWrite = false
        m.emissive = new THREE.Color('#0e7490'); m.emissiveIntensity = 0.12
        m.side = THREE.FrontSide
        mesh.renderOrder = 2
      } else if (mesh.name.startsWith('organ_')) {
        mesh.renderOrder = 1
        organs.push(mesh)
      }
    })
    const box = new THREE.Box3().setFromObject(obj)
    const size = new THREE.Vector3(); box.getSize(size)
    const center = new THREE.Vector3(); box.getCenter(center)
    obj.position.set(-center.x, -center.y, -center.z)
    const wrap = new THREE.Group(); wrap.add(obj)
    wrap.scale.setScalar(2.4 / (size.y || 1))
    return { root: wrap, organs }
  }, [scene])

  // har render: kasal a'zolarни yoqib, sog'larни o'chiramiz
  const active = useMemo(() => {
    const list: Mesh[] = []
    for (const o of organs) {
      const sev = organState.get(o.name)
      const m = o.material as MeshStandardMaterial
      if (sev) {
        o.visible = true
        const c = new THREE.Color(COL[sev])
        m.color = c.clone().multiplyScalar(0.4)
        m.emissive = c; m.emissiveIntensity = 1.2
        m.transparent = false
        list.push(o)
      } else {
        o.visible = false
      }
    }
    return list
  }, [organs, organState])

  const grp = useRef<Group>(null)
  useFrame((_, dt) => {
    if (grp.current) grp.current.rotation.y += (dt || 0.016) * 0.3
    const t = 0.85 + Math.sin(performance.now() * 0.004) * 0.55
    for (const o of active) (o.material as MeshStandardMaterial).emissiveIntensity = t
  })
  return <group ref={grp}><primitive object={root} /></group>
}

function Scene({ organState }: { organState: Map<string, Sev> }) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[0, -1, 3]} intensity={0.5} color="#B42475" />
      <TwinModel organState={organState} />
    </>
  )
}

const SEV_STYLE: Record<Sev, { chip: string; dot: string; key: string }> = {
  red: { chip: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300', dot: 'bg-red-500', key: 'body.high' },
  amber: { chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', dot: 'bg-amber-500', key: 'body.watch' },
  green: { chip: '', dot: 'bg-green-500', key: 'body.ok' },
}
const rank = (s: Sev) => (s === 'red' ? 2 : s === 'amber' ? 1 : 0)

export function TwinBody({ patient }: { patient: Patient }) {
  const { t, td, sym } = useT()
  const L = {
    head: t('body.head'), eyes: t('body.eyes'), heart: t('body.heart'),
    lungs: t('body.lungs'), belly: t('body.belly'), abdomen: t('body.abdomen'),
    kidney: t('body.kidney'), hands: t('body.hands'),
  }
  const regions = useMemo(() => regionsFor(patient, { td, sym, L }), [patient, td, sym])

  // organ node -> eng yuqori jiddiylik
  const organState = useMemo(() => {
    const m = new Map<string, Sev>()
    for (const r of regions) {
      if (r.sev === 'green') continue
      const node = ORGAN_OF[r.key]
      if (!node) continue
      const cur = m.get(node)
      if (!cur || rank(r.sev) > rank(cur)) m.set(node, r.sev)
    }
    return m
  }, [regions])

  const affected = regions.filter((r) => r.sev !== 'green')
    .filter((r, i, arr) => arr.findIndex((x) => x.label === r.label) === i)
    .sort((a, b) => rank(b.sev) - rank(a.sev))

  return (
    <div>
      <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[11px] text-slate-400">
          {t('body.hintDrag')}
        </div>
        <Canvas camera={{ position: [0, 0, 3.4], fov: 42 }} dpr={[1, 2]}>
          <Scene organState={organState} />
          <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.4}
            maxPolarAngle={Math.PI / 1.8} target={[0, 0, 0]} />
        </Canvas>
      </div>

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
