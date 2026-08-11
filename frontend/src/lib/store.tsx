import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'light'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)

export type Role = 'hamshira' | 'mutaxassis' | 'oilaviy' | 'bemor'

export const ROLE_LABEL: Record<Role, string> = {
  hamshira: 'Hamshira',
  mutaxassis: 'Mutaxassis / Shifokor',
  oilaviy: 'Oilaviy shifokor',
  bemor: 'Bemor',
}

export const ROLE_HOME: Record<Role, string> = {
  hamshira: '/capture',
  mutaxassis: '/dashboard',
  oilaviy: '/followup',
  bemor: '/patient',
}

export interface Session {
  role: Role
  name: string
  patientId: string | null
}

export const getSession = (): Session | null => {
  const s = localStorage.getItem('session')
  return s ? (JSON.parse(s) as Session) : null
}
export const setSession = (s: Session) => localStorage.setItem('session', JSON.stringify(s))
export const clearSession = () => localStorage.removeItem('session')

// Orqaga moslik uchun
export const getRole = (): Role | null => getSession()?.role ?? null
