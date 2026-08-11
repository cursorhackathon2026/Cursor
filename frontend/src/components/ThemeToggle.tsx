import { useTheme } from '../lib/store'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="btn-ghost !px-2.5 !py-2"
      title={theme === 'dark' ? 'Yorug‘ rejim' : 'Tungi rejim'}
      aria-label="Rejimni almashtirish"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
