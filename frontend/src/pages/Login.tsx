import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { setSession, ROLE_HOME, type Role } from '../lib/store'
import { ThemeToggle } from '../components/ThemeToggle'

const LABELS: Record<string, string> = {
  hamshira: 'Hamshira', mutaxassis: 'Mutaxassis', oilaviy: 'Oilaviy shifokor', bemor: 'Bemor',
}

export default function Login() {
  const [phone, setPhone] = useState('')
  const [demo, setDemo] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  useEffect(() => { api.demoAccounts().then(setDemo).catch(() => {}) }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const r = await api.login(phone)
      setSession({ role: r.role as Role, name: r.name, patientId: r.patient_id })
      nav(ROLE_HOME[r.role as Role])
    } catch {
      setErr("Bu raqam ro‘yxatda yo‘q. Quyidagi demo raqamlardan birini bosing.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-brand/5 to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white text-xl font-bold">P</div>
          <h1 className="text-2xl font-extrabold">Perinatal Monitoring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Ona-bola salomatligi va Raqamli egizak platformasi</p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <label className="label">Telefon raqami</label>
          <input
            className="input"
            placeholder="+998 90 xxx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          {err && <p className="mt-2 text-sm text-zone-red">{err}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-4 w-full">
            {busy ? 'Kirish…' : 'Kirish'}
          </button>

          {Object.keys(demo).length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Demo raqamlar (bosing)</p>
              <div className="space-y-1.5">
                {Object.entries(demo).map(([role, num]) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setPhone(num.replace(/\s*\(.*\)/, ''))}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="font-medium">{LABELS[role] ?? role}</span>
                    <span className="text-slate-500 dark:text-slate-400">{num}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-center text-xs text-slate-400">Demo rejimi · sintetik ma'lumot · SMS-kod yo‘q</p>
        </form>
      </div>
    </div>
  )
}
