import { useT, LANGS } from '../lib/i18n'

export function LangSwitcher() {
  const { lang, setLang } = useT()
  return (
    <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1.5 font-semibold transition-colors ${
            lang === l.code
              ? 'bg-brand text-white'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
