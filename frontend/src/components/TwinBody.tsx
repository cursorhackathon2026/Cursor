import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { Patient } from '../lib/types'
import { useT, type Lang } from '../lib/i18n'

const MODEL = '/twin.glb?v=real2'
useGLTF.preload(MODEL)

type Sev = 'red' | 'amber' | 'green'
const COL: Record<Sev, string> = { red: '#EF4444', amber: '#F59E0B', green: '#22C55E' }

// app region -> GLB node nomlari
const ORGAN_OF: Record<string, string[]> = {
  head: ['organ_brain'], eyes: ['organ_brain'],
  heart: ['organ_heart'],
  lungs: ['organ_lung_l', 'organ_lung_r'],
  belly: ['organ_stomach', 'organ_intestine'],
  kidney: ['organ_kidney_l', 'organ_kidney_r'],
}
const ORGAN_LABELS: Record<string, Record<Lang, string>> = {
  organ_brain: { uz: 'Miya', ru: 'Мозг', en: 'Brain' },
  organ_heart: { uz: 'Yurak', ru: 'Сердце', en: 'Heart' },
  organ_lung_l: { uz: "Chap o'pka", ru: 'Левое лёгкое', en: 'Left lung' },
  organ_lung_r: { uz: "O'ng o'pka", ru: 'Правое лёгкое', en: 'Right lung' },
  organ_liver: { uz: 'Jigar', ru: 'Печень', en: 'Liver' },
  organ_stomach: { uz: 'Oshqozon', ru: 'Желудок', en: 'Stomach' },
  organ_intestine: { uz: 'Ichak', ru: 'Кишечник', en: 'Intestine' },
  organ_kidney_l: { uz: 'Chap buyrak', ru: 'Левая почка', en: 'Left kidney' },
  organ_kidney_r: { uz: "O'ng buyrak", ru: 'Правая почка', en: 'Right kidney' },
  organ_vessels: { uz: 'Qon tomirlar', ru: 'Сосуды', en: 'Vessels' },
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

// ko'k X-ray Fresnel hologram material (yorqin chekka, additiv porlash)
function fresnelBody(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uCore: { value: new THREE.Color('#153a86') }, uEdge: { value: new THREE.Color('#67c8ff') } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.0);
        vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; uniform vec3 uCore; uniform vec3 uEdge;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
        vec3 col = mix(uCore, uEdge, f) * (0.5 + f*1.4);
        float a = f*0.85 + 0.10;
        gl_FragColor = vec4(col, a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  })
}
function skeletonMat(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color('#bfe6ff'), transparent: true, opacity: 0.5 })
  m.emissive = new THREE.Color('#7fd0ff'); m.emissiveIntensity = 1.0; m.depthWrite = false
  return m
}

type Focus = { center: THREE.Vector3; camPos: THREE.Vector3; name: string } | null

function TwinModel({ organState, onFocus, focused }:
  { organState: Map<string, Sev>; onFocus: (f: Focus) => void; focused: boolean }) {
  const { scene } = useGLTF(MODEL)
  const { camera, controls } = useThree() as any

  const { root, organs } = useMemo(() => {
    const obj = scene.clone(true)
    const organs: Mesh[] = []
    obj.traverse((c) => {
      const mesh = c as Mesh
      if (!mesh.isMesh) return
      if (mesh.name === 'body_skin') {
        mesh.material = fresnelBody()
        mesh.renderOrder = 4
        mesh.raycast = () => {}   // klik a'zolarga o'tsin
      } else if (mesh.name === 'skeleton') {
        mesh.material = skeletonMat()
        mesh.renderOrder = 3
        mesh.raycast = () => {}
      } else if (mesh.name.startsWith('organ_')) {
        const src = mesh.material as MeshStandardMaterial
        const base = (src.color?.clone()) ?? new THREE.Color('#cc8888')
        const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.35, metalness: 0.0 })
        m.emissive = base.clone(); m.emissiveIntensity = 0.5
        mesh.material = m; mesh.renderOrder = 1
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

  const active = useMemo(() => {
    const list: Mesh[] = []
    for (const o of organs) {
      const m = o.material as MeshStandardMaterial
      const sev = organState.get(o.name)
      if (sev) {
        const c = new THREE.Color(COL[sev])
        m.color = c.clone().multiplyScalar(0.6); m.emissive = c; m.emissiveIntensity = 1.7
        list.push(o)
      } else {
        m.emissiveIntensity = 0.5
      }
    }
    return list
  }, [organs, organState])

  const grp = useRef<Group>(null)
  useFrame(() => {
    if (grp.current && !focused) grp.current.rotation.y += 0.0045
    const t = 0.9 + Math.sin(performance.now() * 0.005) * 0.6
    for (const o of active) (o.material as MeshStandardMaterial).emissiveIntensity = t
  })

  const handleClick = (e: any) => {
    const mesh = e.object as Mesh
    if (!mesh || !mesh.name?.startsWith('organ_')) return
    e.stopPropagation()
    const box = new THREE.Box3().setFromObject(mesh)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const dist = Math.max(size.x, size.y, size.z) * 2.4 + 0.55
    const dir = camera.position.clone().sub(controls ? controls.target : new THREE.Vector3()).normalize()
    const camPos = center.clone().add(dir.multiplyScalar(dist))
    onFocus({ center, camPos, name: mesh.name })
  }

  return <group ref={grp}><primitive object={root} onClick={handleClick} /></group>
}

function CameraRig({ focus }: { focus: Focus }) {
  const { camera, controls } = useThree() as any
  const defPos = useMemo(() => new THREE.Vector3(0, 0, 3.4), [])
  const defTgt = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  useFrame(() => {
    camera.position.lerp(focus ? focus.camPos : defPos, 0.07)
    if (controls) { controls.target.lerp(focus ? focus.center : defTgt, 0.07); controls.update() }
  })
  return null
}

function Scene({ organState, focus, onFocus }:
  { organState: Map<string, Sev>; focus: Focus; onFocus: (f: Focus) => void }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={0.9} />
      <pointLight position={[-3, 1, 3]} intensity={0.6} color="#38bdf8" />
      <pointLight position={[0, -1, 3]} intensity={0.4} color="#B42475" />
      <TwinModel organState={organState} onFocus={onFocus} focused={!!focus} />
      <CameraRig focus={focus} />
      <OrbitControls makeDefault enablePan={false} enableZoom={false}
        minPolarAngle={Math.PI / 2.4} maxPolarAngle={Math.PI / 1.8} target={[0, 0, 0]} />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.15} intensity={1.4} radius={0.75} />
      </EffectComposer>
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
  const { t, td, sym, lang } = useT()
  const [focus, setFocus] = useState<Focus>(null)
  const L = {
    head: t('body.head'), eyes: t('body.eyes'), heart: t('body.heart'),
    lungs: t('body.lungs'), belly: t('body.belly'), abdomen: t('body.abdomen'),
    kidney: t('body.kidney'), hands: t('body.hands'),
  }
  const regions = useMemo(() => regionsFor(patient, { td, sym, L }), [patient, td, sym])

  const organState = useMemo(() => {
    const m = new Map<string, Sev>()
    for (const r of regions) {
      if (r.sev === 'green') continue
      for (const node of ORGAN_OF[r.key] ?? []) {
        const cur = m.get(node)
        if (!cur || rank(r.sev) > rank(cur)) m.set(node, r.sev)
      }
    }
    return m
  }, [regions])

  const affected = regions.filter((r) => r.sev !== 'green')
    .filter((r, i, arr) => arr.findIndex((x) => x.label === r.label) === i)
    .sort((a, b) => rank(b.sev) - rank(a.sev))

  const focusLabel = focus ? (ORGAN_LABELS[focus.name]?.[lang] ?? focus.name) : ''
  const tapHint = { uz: "a'zoga bosing", ru: 'нажмите на орган', en: 'tap an organ' }[lang]

  return (
    <div>
      <div className="relative h-[28rem] w-full overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_center,#08142e_0%,#040a18_55%,#000_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 text-center text-[11px] text-sky-300/70">
          {focus ? '' : `${t('body.hintDrag')} · ${tapHint}`}
        </div>
        {focus && (
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
            <button onClick={() => setFocus(null)}
              className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur hover:bg-white">
              ← {t('c.back')}
            </button>
            <span className="rounded-full bg-sky-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg">{focusLabel}</span>
          </div>
        )}
        <Canvas camera={{ position: [0, 0, 3.4], fov: 42 }} dpr={[1, 2]} onPointerMissed={() => setFocus(null)}>
          <Scene organState={organState} focus={focus} onFocus={setFocus} />
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
