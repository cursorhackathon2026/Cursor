import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setRole, ROLE_HOME, type Role } from '../lib/store'
import { ThemeToggle } from '../components/ThemeToggle'

const ROLES: { id: Role; title: string; sub: string; icon: string }[] = [
  { id: 'hamshira', title: 'Hamshira', sub: "Ma'lumot kiritish va kuzatuv", icon: '🩺' },
  { id: 'mutaxassis', title: 'Mutaxassis / Shifokor', sub: 'Monitoring va tahlil paneli', icon: '📊' },
  { id: 'oilaviy', title: 'Oilaviy shifokor', sub: 'Kuzatuv va chaqiruv topshiriqlari', icon: '🏠' },
]

export default function Login() {
  const [role, setSel] = useState<Role>('mutaxassis')
  const nav = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setRole(role)
    nav(ROLE_HOME[role])
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-brand/5 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white text-xl font-bold">P</div>
          <h1 className="text-2xl font-extrabold">Perinatal Monitoring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ona va chaqaloq sog‘ligini kuzatish tizimi</p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Rolni tanlang</p>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setSel(r.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  role === r.id
                    ? 'border-brand bg-brand/5 ring-1 ring-brand'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-lg">{r.icon}</span>
                <span className="flex-1">
                  <span className={`block text-sm font-semibold ${role === r.id ? 'text-brand' : ''}`}>{r.title}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{r.sub}</span>
                </span>
                <span className={`h-4 w-4 rounded-full border-2 ${role === r.id ? 'border-brand bg-brand' : 'border-slate-300'}`} />
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <label className="label">Foydalanuvchi nomi</label>
              <input className="input" defaultValue="login@shifoxona.uz" />
            </div>
            <div>
              <label className="label">Parol</label>
              <input className="input" type="password" defaultValue="demo1234" />
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full">Kirish</button>
          <p className="mt-3 text-center text-xs text-slate-400">Demo rejimi · sintetik ma'lumot</p>
        </form>
      </div>
    </div>
  )
}
