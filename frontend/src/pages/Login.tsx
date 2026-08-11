import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { setSession, ROLE_HOME, type Role } from '../lib/store'
import { useT } from '../lib/i18n'
import { ThemeToggle } from '../components/ThemeToggle'
import { LangSwitcher } from '../components/LangSwitcher'

const COPY: Record<string, any> = {
  uz: {
    hero1: 'Har bemorning kelajagini',
    hero2: 'AI bilan bashorat qilamiz',
    sub: 'Bemorlarni rang-zona bo‘yicha kuzatadigan, 5 yillik xavfni bashorat qiladigan va shifokorga izohli optimal davolash rejasi taklif qiladigan AI raqamli egizak platformasi.',
    start: 'Boshlash',
    more: 'Qanday ishlaydi?',
    featuresTitle: 'Nima taklif qilamiz',
    features: [
      { icon: '🧍', title: '3D Raqamli egizak', desc: 'Har bemorning ta’sirlangan a’zolari jonli 3D tanada', c: '#B42475' },
      { icon: '🔮', title: 'AI 5-yillik prognoz', desc: 'Kelajakdagi asoratlarni oldindan bashorat qiladi', c: '#117E96' },
      { icon: '✚', title: 'AI optimal davolash', desc: 'Dori/ukol/osma — izohi bilan, shifokor tasdiqlaydi', c: '#7C3AED' },
      { icon: '🎯', title: 'Rang-zona xavf', desc: 'Qizil / Sariq / Yashil — tushuntirilgan sabab bilan', c: '#2563EB' },
    ],
    stats: [['3D', 'Raqamli egizak'], ['5 yil', 'AI prognoz'], ['AI', 'optimal davolash'], ['3', 'til: UZ/RU/EN']],
    howTitle: 'Bitta izchil zanjir',
    steps: [['Kiritish', 'Hamshira ko‘rsatkichlarni kiritadi'], ['AI baholash', 'Zona + 5-yillik prognoz'], ['Optimal reja', 'AI taklif → shifokor tasdiqlaydi'], ['Kuzatuv', 'Bemorga eslatma va nazorat']],
    preview: 'Mahsulotni ko‘ring',
  },
  ru: {
    hero1: 'Предсказываем будущее',
    hero2: 'пациента с ИИ',
    sub: 'ИИ-платформа цифрового двойника: наблюдает пациентов по цветовым зонам, прогнозирует риски на 5 лет и предлагает врачу оптимальный план лечения с пояснениями.',
    start: 'Начать',
    more: 'Как это работает?',
    featuresTitle: 'Что мы предлагаем',
    features: [
      { icon: '🧍', title: '3D цифровой двойник', desc: 'Затронутые органы пациента на живом 3D-теле', c: '#B42475' },
      { icon: '🔮', title: 'ИИ-прогноз на 5 лет', desc: 'Заранее предсказывает будущие осложнения', c: '#117E96' },
      { icon: '✚', title: 'ИИ оптимальное лечение', desc: 'Препараты/уколы/капельницы с пояснением, врач подтверждает', c: '#7C3AED' },
      { icon: '🎯', title: 'Цветовые зоны риска', desc: 'Красный / Жёлтый / Зелёный — с объяснением', c: '#2563EB' },
    ],
    stats: [['3D', 'Цифровой двойник'], ['5 лет', 'ИИ-прогноз'], ['ИИ', 'оптим. лечение'], ['3', 'языка']],
    howTitle: 'Единая цепочка',
    steps: [['Ввод', 'Медсестра вводит показатели'], ['ИИ-оценка', 'Зона + прогноз на 5 лет'], ['Опт. план', 'ИИ предлагает → врач подтверждает'], ['Наблюдение', 'Напоминания и контроль пациента']],
    preview: 'Посмотрите продукт',
  },
  en: {
    hero1: 'We forecast each',
    hero2: 'patient’s future with AI',
    sub: 'An AI digital-twin platform that monitors patients by color zones, forecasts 5-year risks, and proposes the optimal treatment plan — with rationale — for the doctor.',
    start: 'Get started',
    more: 'How it works',
    featuresTitle: 'What we offer',
    features: [
      { icon: '🧍', title: '3D Digital Twin', desc: 'Each patient’s affected organs on a live 3D body', c: '#B42475' },
      { icon: '🔮', title: 'AI 5-year prognosis', desc: 'Forecasts future complications in advance', c: '#117E96' },
      { icon: '✚', title: 'AI optimal treatment', desc: 'Drugs/injections/IV with rationale, doctor confirms', c: '#7C3AED' },
      { icon: '🎯', title: 'Color-zone risk', desc: 'Red / Yellow / Green — with explained cause', c: '#2563EB' },
    ],
    stats: [['3D', 'Digital Twin'], ['5-yr', 'AI prognosis'], ['AI', 'optimal care'], ['3', 'langs']],
    howTitle: 'One seamless chain',
    steps: [['Capture', 'Nurse enters vitals'], ['AI assess', 'Zone + 5-year prognosis'], ['Optimal plan', 'AI proposes → doctor confirms'], ['Follow-up', 'Patient reminders & monitoring']],
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
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white font-extrabold shadow-lg shadow-brand/30">S</div>
          <span className="font-display text-lg font-extrabold">Salomat AI</span>
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
            ✦ AI Raqamli egizak · Navoiy AI Xakaton 2026
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
              <h2 className="font-display text-xl font-extrabold">Salomat AI</h2>
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
            <div key={i} className="group relative animate-fadeup overflow-hidden rounded-3xl p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: f.c, animationDelay: `${0.08 * i}s` }}>
              <span className="shine-el pointer-events-none absolute -top-10 left-0 h-40 w-16 bg-white/25 blur-md" style={{ transform: 'translateX(-130%) rotate(12deg)' }} />
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl backdrop-blur animate-floaty transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{ animationDelay: `${0.5 * i}s` }}>{f.icon}</div>
              <h3 className="font-display text-lg font-bold !text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-white/85">{f.desc}</p>
              <span className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                <div className="flex items-center gap-2"><div className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">S</div><span className="text-sm font-bold">Bosh sahifa</span></div>
                <span className="text-[11px] text-slate-400">Navoiy · real-vaqt</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4">
                {[['16', 'Jami', 'text-slate-800 dark:text-slate-100'], ['5', 'Qizil', 'text-zone-red'], ['6', 'Sariq', 'text-zone-amber']].map((k, i) => (
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
        <div className="relative">
          {/* oquvchi ulagich chiziq (DMED uslubi) */}
          <div className="pointer-events-none absolute left-[12%] right-[12%] top-[4.6rem] hidden md:block">
            <div className="relative h-0.5 w-full rounded-full bg-gradient-to-r from-brand/40 via-teal/50 to-[#2563EB]/40">
              <span className="absolute -top-[3px] h-2 w-2 rounded-full bg-brand shadow-lg shadow-brand/40 animate-travel" />
            </div>
          </div>
          <div className="relative z-10 grid gap-4 md:grid-cols-4">
            {L.steps.map((s: string[], i: number) => (
              <div key={i} className="group animate-fadeup card p-5 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl" style={{ animationDelay: `${0.08 * i}s` }}>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 font-display text-lg font-extrabold text-brand animate-softpulse transition-transform duration-300 group-hover:scale-110"
                  style={{ animationDelay: `${0.4 * i}s` }}>{i + 1}</div>
                <h3 className="font-bold">{s[0]}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <button onClick={() => scrollTo('login')} className="btn-primary mb-4">{L.start} →</button>
        <p>Salomat AI · #MilliyAIXakaton · #NavoiyAI · 2026</p>
      </footer>
    </div>
  )
}
