import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { setSession, ROLE_HOME, type Role } from '../lib/store'
import { useT } from '../lib/i18n'
import { ThemeToggle } from '../components/ThemeToggle'
import { LangSwitcher } from '../components/LangSwitcher'

const COPY: Record<string, any> = {
  uz: {
    hero1: 'Ona va chaqaloq hayotini',
    hero2: 'AI bilan asraymiz',
    sub: 'Homilador ayollarni real vaqtda rang-zona bo‘yicha kuzatuvchi, xavfni oldindan ogohlantiruvchi va shifokorga raqamli egizak beruvchi platforma.',
    start: 'Boshlash',
    more: 'Qanday ishlaydi?',
    featuresTitle: 'Nima taklif qilamiz',
    features: [
      { icon: '🎯', title: 'Rang-zona xavf', desc: 'Qizil / Sariq / Yashil — tushuntirilgan sabab bilan', c: '#B42475' },
      { icon: '🧬', title: 'Raqamli egizak', desc: 'Dori xavfsizligini bemor tarixiga qarab tekshirish', c: '#117E96' },
      { icon: '🔔', title: 'Avto-ogohlantirish', desc: 'Xavf yomonlashsa — mutaxassisga darhol xabar', c: '#2563EB' },
      { icon: '💊', title: 'Bemor portali', desc: 'Dori eslatmalari, qabul, AI tavsiyalar', c: '#7C3AED' },
    ],
    stats: [['32M+', 'DMED bemor (mos)'], ['3', 'til: UZ/RU/EN'], ['4', 'rol'], ['Real-vaqt', 'AI monitoring']],
    howTitle: 'Bitta izchil zanjir',
    steps: [['Kiritish', 'Hamshira ko‘rsatkichni kiritadi'], ['Baholash', 'AI zona + sababni aniqlaydi'], ['Ogohlantirish', 'Mutaxassisga avto-xabar'], ['Kuzatuv', 'Oilaviy shifokor davom ettiradi']],
    preview: 'Mahsulotni ko‘ring',
  },
  ru: {
    hero1: 'Спасаем жизнь матери',
    hero2: 'и ребёнка с ИИ',
    sub: 'Платформа для мониторинга беременных по цветовым зонам в реальном времени, раннего оповещения и цифрового двойника для врача.',
    start: 'Начать',
    more: 'Как это работает?',
    featuresTitle: 'Что мы предлагаем',
    features: [
      { icon: '🎯', title: 'Цветовые зоны риска', desc: 'Красный / Жёлтый / Зелёный — с объяснением', c: '#B42475' },
      { icon: '🧬', title: 'Цифровой двойник', desc: 'Проверка безопасности препарата по истории', c: '#117E96' },
      { icon: '🔔', title: 'Авто-оповещение', desc: 'При ухудшении — сразу специалисту', c: '#2563EB' },
      { icon: '💊', title: 'Портал пациента', desc: 'Напоминания о лекарствах, запись, советы ИИ', c: '#7C3AED' },
    ],
    stats: [['32M+', 'пациентов DMED'], ['3', 'языка: UZ/RU/EN'], ['4', 'роли'], ['Онлайн', 'ИИ-мониторинг']],
    howTitle: 'Единая цепочка',
    steps: [['Ввод', 'Медсестра вводит показатели'], ['Оценка', 'ИИ определяет зону и причину'], ['Оповещение', 'Авто-сигнал специалисту'], ['Наблюдение', 'Семейный врач продолжает']],
    preview: 'Посмотрите продукт',
  },
  en: {
    hero1: 'Protecting mothers &',
    hero2: 'newborns with AI',
    sub: 'A platform that monitors pregnant women by real-time color zones, warns of risk early, and gives doctors a digital twin.',
    start: 'Get started',
    more: 'How it works',
    featuresTitle: 'What we offer',
    features: [
      { icon: '🎯', title: 'Color-zone risk', desc: 'Red / Yellow / Green — with explained cause', c: '#B42475' },
      { icon: '🧬', title: 'Digital Twin', desc: 'Drug-safety check against patient history', c: '#117E96' },
      { icon: '🔔', title: 'Auto-alerts', desc: 'Risk worsens → instant alert to specialist', c: '#2563EB' },
      { icon: '💊', title: 'Patient portal', desc: 'Med reminders, booking, AI tips', c: '#7C3AED' },
    ],
    stats: [['32M+', 'DMED patients'], ['3', 'langs: UZ/RU/EN'], ['4', 'roles'], ['Real-time', 'AI monitoring']],
    howTitle: 'One seamless chain',
    steps: [['Capture', 'Nurse enters vitals'], ['Assess', 'AI finds zone & cause'], ['Alert', 'Auto-signal to specialist'], ['Follow-up', 'Family doctor continues']],
    preview: 'See the product',
  },
}

export default function Login() {
  const [phone, setPhone] = useState('')
  const [demo, setDemo] = useState<Record<string, string>>({})
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const { t, role: roleT, lang } = useT()
  const L = COPY[lang] ?? COPY.uz

  useEffect(() => { api.demoAccounts().then(setDemo).catch(() => {}) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(false); setBusy(true)
    try {
      const r = await api.login(phone)
      setSession({ role: r.role as Role, name: r.name, patientId: r.patient_id })
      nav(ROLE_HOME[r.role as Role])
    } catch { setErr(true) } finally { setBusy(false) }
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-brand/5 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      {/* animatsiyali bloblar */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl animate-blob" />
        <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-teal/20 blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#2563EB]/15 blur-3xl animate-blob" style={{ animationDelay: '8s' }} />
      </div>
      <div className="pointer-events-none absolute inset-0 text-slate-300/40 dark:text-slate-700/30 bg-dots" />

      {/* NAV */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white font-extrabold shadow-lg shadow-brand/30">P</div>
          <span className="font-display text-lg font-extrabold">Perinatal</span>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />
          <button onClick={() => scrollTo('login')} className="btn-primary !py-2 text-sm">{t('c.signin')}</button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-16 lg:grid-cols-2">
        <div className="animate-fadeup">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            ✦ AI · DMED ustida qatlam · Navoiy AI Xakaton 2026
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
            {L.hero1}<br /><span className="gradient-text">{L.hero2}</span>
          </h1>
          <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-300">{L.sub}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => scrollTo('login')} className="btn-primary animate-pulsering">{L.start} →</button>
            <button onClick={() => scrollTo('how')} className="btn-ghost">{L.more}</button>
          </div>
          {/* stat strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {L.stats.map((s: string[], i: number) => (
              <div key={i} className="animate-fadeup" style={{ animationDelay: `${0.1 * i + 0.2}s` }}>
                <div className="gradient-text font-display text-2xl font-extrabold">{s[0]}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s[1]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LOGIN card + floating chips */}
        <div id="login" className="relative animate-fadeup" style={{ animationDelay: '0.15s' }}>
          {/* floating chips */}
          <div className="absolute -left-4 top-6 z-20 hidden rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur animate-floaty dark:border-slate-700 dark:bg-slate-800/90 sm:block">
            <span className="text-brand">✦</span> AI tahlil · 140 ball
          </div>
          <div className="absolute -right-3 bottom-24 z-20 hidden rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur animate-floaty2 dark:border-slate-700 dark:bg-slate-800/90 sm:flex sm:items-center sm:gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zone-red" /> Qizil zona · ogohlantirish
          </div>

          <form onSubmit={submit} className="card relative z-10 p-6 shadow-2xl shadow-brand/10">
            <div className="mb-4 text-center">
              <h2 className="font-display text-xl font-extrabold">Perinatal Monitoring</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
            </div>
            <label className="label">{t('login.phone')}</label>
            <input className="input" placeholder="+998 90 xxx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {err && <p className="mt-2 text-sm text-zone-red">{t('login.err')}</p>}
            <button type="submit" disabled={busy} className="btn-primary mt-4 w-full">{busy ? t('c.signing') : t('c.signin')}</button>
            {Object.keys(demo).length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{t('login.demo')}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(demo).map(([role, num]) => (
                    <button type="button" key={role} onClick={() => setPhone(num.replace(/\s*\(.*\)/, ''))}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                      <span className="block font-semibold">{roleT(role)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-center text-[11px] text-slate-400">{t('login.note')}</p>
          </form>
        </div>
      </section>

      {/* FEATURES — Twin uslubi rangli tiles */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-8 text-center font-display text-3xl font-extrabold">{L.featuresTitle}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {L.features.map((f: any, i: number) => (
            <div key={i} className="group animate-fadeup rounded-3xl p-6 text-white shadow-xl transition-transform hover:-translate-y-2"
              style={{ background: f.c, animationDelay: `${0.08 * i}s` }}>
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur">{f.icon}</div>
              <h3 className="font-display text-lg font-bold !text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/85">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW — DMED uslubi suzuvchi mockup */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-fadeup">
            <h2 className="font-display text-3xl font-extrabold">{L.preview}</h2>
            <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">{L.sub}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['UZ', 'RU', 'EN'].map((x) => <span key={x} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800">{x}</span>)}
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">Web + APK</span>
            </div>
          </div>
          {/* mock dashboard card */}
          <div className="relative animate-floaty">
            <div className="card overflow-hidden p-0 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2"><div className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">P</div><span className="text-sm font-bold">Bosh sahifa</span></div>
                <span className="text-[11px] text-slate-400">Navoiy · real-vaqt</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {[['16', 'Jami', 'text-slate-800 dark:text-slate-100'], ['4', 'Qizil', 'text-zone-red'], ['6', 'Sariq', 'text-zone-amber']].map((k, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className={`font-display text-xl font-extrabold ${k[2]}`}>{k[0]}</div>
                    <div className="text-[11px] text-slate-500">{k[1]}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 px-4 pb-4">
                {[['Nasiba K.', 'bg-zone-red', 'Qizil'], ['Malika Y.', 'bg-zone-amber', 'Sariq'], ['Gulnora T.', 'bg-zone-green', 'Yashil']].map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="text-sm font-medium">{r[0]}</span>
                    <span className="flex items-center gap-1.5 text-xs"><span className={`h-2 w-2 rounded-full ${r[1]}`} />{r[2]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-3 -top-3 rounded-2xl bg-brand px-3 py-2 text-xs font-bold text-white shadow-xl animate-floaty2">✦ AI</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — DMED tugun uslubi */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <h2 className="mb-8 text-center font-display text-3xl font-extrabold">{L.howTitle}</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {L.steps.map((s: string[], i: number) => (
            <div key={i} className="animate-fadeup card p-5 text-center" style={{ animationDelay: `${0.08 * i}s` }}>
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 font-display text-lg font-extrabold text-brand">{i + 1}</div>
              <h3 className="font-bold">{s[0]}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s[1]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <button onClick={() => scrollTo('login')} className="btn-primary mb-4">{L.start} →</button>
        <p>Perinatal Monitoring · #MilliyAIXakaton · #NavoiyAI · 2026</p>
      </footer>
    </div>
  )
}
