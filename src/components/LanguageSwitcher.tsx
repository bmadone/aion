import { useState, useRef, useEffect, useCallback, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe2 } from 'lucide-react'

const LOCALES = [
  { code: 'en',    name: 'English' },
  { code: 'es',    name: 'Español' },
  { code: 'es-419', name: 'Español (Latinoamérica)' },
  { code: 'fr',    name: 'Français' },
  { code: 'de',    name: 'Deutsch' },
  { code: 'it',    name: 'Italiano' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'nl',    name: 'Nederlands' },
  { code: 'pl',    name: 'Polski' },
  { code: 'sv',    name: 'Svenska' },
  { code: 'no',    name: 'Norsk' },
  { code: 'da',    name: 'Dansk' },
  { code: 'fi',    name: 'Suomi' },
  { code: 'cs',    name: 'Čeština' },
  { code: 'sk',    name: 'Slovenčina' },
  { code: 'hu',    name: 'Magyar' },
  { code: 'ro',    name: 'Română' },
  { code: 'bg',    name: 'Български' },
  { code: 'el',    name: 'Ελληνικά' },
  { code: 'uk',    name: 'Українська' },
  { code: 'hr',    name: 'Hrvatski' },
  { code: 'ja',    name: '日本語' },
  { code: 'ko',    name: '한국어' },
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁體）' },
  { code: 'hi',    name: 'हिन्दी' },
  { code: 'th',    name: 'ภาษาไทย' },
  { code: 'vi',    name: 'Tiếng Việt' },
  { code: 'id',    name: 'Bahasa Indonesia' },
  { code: 'ar',    name: 'العربية' },
]

export function LanguageSwitcher(): JSX.Element {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentCode = i18n.language
  const current = LOCALES.find(l => l.code === currentCode) ?? { code: 'en', name: 'English' }

  const filtered = search.trim()
    ? LOCALES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    : LOCALES

  const handleSelect = useCallback((code: string) => {
    void i18n.changeLanguage(code)
    setOpen(false)
    setSearch('')
  }, [i18n])

  useEffect(() => {
    if (open) {searchRef.current?.focus()}
  }, [open])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') { setOpen(false); setSearch('') }
    }
    if (open) {
      document.addEventListener('mousedown', onOutsideClick)
      document.addEventListener('keydown', onKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', onOutsideClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="lang-switcher" ref={containerRef}>
      <button
        className="icon-btn"
        onClick={() => setOpen(o => !o)}
        aria-label={t('nav.languageSwitcher')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe2 size={18} aria-hidden="true" />
      </button>

      {open && (
        <div className="lang-dropdown" role="dialog" aria-label={t('nav.languageSwitcher')}>
          <input
            ref={searchRef}
            className="lang-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            aria-label="Search languages"
          />
          <ul className="lang-list" role="listbox" aria-label={t('nav.languageSwitcher')}>
            {filtered.map(locale => (
              <li key={locale.code} role="option" aria-selected={locale.code === current.code}>
                <button
                  className={`lang-option${locale.code === current.code ? ' lang-option--active' : ''}`}
                  onClick={() => handleSelect(locale.code)}
                  type="button"
                >
                  {locale.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
