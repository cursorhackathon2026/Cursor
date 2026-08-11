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

export type Role = 'hamshira' | 'mutaxassis' | 'oilaviy'

export const ROLE_LABEL: Record<Role, string> = {
  hamshira: 'Hamshira',
  mutaxassis: 'Mutaxassis / Shifokor',
  oilaviy: 'Oilaviy shifokor',
}

export const ROLE_HOME: Record<Role, string> = {
  hamshira: '/capture',
  mutaxassis: '/dashboard',
  oilaviy: '/followup',
}

export const getRole = () => localStorage.getItem('role') as Role | null
export const setRole = (r: Role) => localStorage.setItem('role', r)
export const clearRole = () => localStorage.removeItem('role')
