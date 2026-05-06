import { useState, useRef, useEffect, useCallback, type JSX, type CSSProperties } from 'react'
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

const DROPDOWN_WIDTH = 220
const DROPDOWN_GAP = 6
const SCREEN_MARGIN = 8

interface DropdownProperties {
  readonly filtered: typeof LOCALES
  readonly currentCode: string
  readonly searchRef: React.RefObject<HTMLInputElement | null>
  readonly search: string
  readonly label: string
  readonly style: CSSProperties
  readonly onSearch: (value: string) => void
  readonly onSelect: (code: string) => void
}

function LanguageDropdown({ filtered, currentCode, searchRef, search, label, style, onSearch, onSelect }: DropdownProperties): JSX.Element {
  return (
    <div className="lang-dropdown" role="dialog" aria-label={label} style={style}>
      <input ref={searchRef} className="lang-search" type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search…" aria-label="Search languages" />
      <ul className="lang-list" role="listbox" aria-label={label}>
        {filtered.map(locale => (
          <li key={locale.code} role="option" aria-selected={locale.code === currentCode}>
            <button className={`lang-option${locale.code === currentCode ? ' lang-option--active' : ''}`} onClick={() => onSelect(locale.code)} type="button">
              {locale.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function computeDropdownStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Horizontal: align right edge with button right; clamp to viewport
  let left = rect.right - DROPDOWN_WIDTH
  left = Math.max(SCREEN_MARGIN, Math.min(left, vw - DROPDOWN_WIDTH - SCREEN_MARGIN))

  // Vertical: prefer below, flip above if not enough space
  const spaceBelow = vh - rect.bottom - DROPDOWN_GAP - SCREEN_MARGIN
  const spaceAbove = rect.top - DROPDOWN_GAP - SCREEN_MARGIN
  const openBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove

  if (openBelow) {
    const maxHeight = Math.min(320, spaceBelow)
    return { top: rect.bottom + DROPDOWN_GAP, left, maxHeight }
  }
  const maxHeight = Math.min(320, spaceAbove)
  return { top: rect.top - DROPDOWN_GAP - maxHeight, left, maxHeight }
}

export function LanguageSwitcher(): JSX.Element {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentCode = i18n.language
  const filtered = search.trim()
    ? LOCALES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    : LOCALES

  const handleSelect = useCallback((code: string) => {
    void i18n.changeLanguage(code)
    setOpen(false)
    setSearch('')
  }, [i18n])

  const handleToggle = useCallback(() => {
    setOpen(o => {
      if (!o && triggerRef.current) {
        setDropdownStyle(computeDropdownStyle(triggerRef.current))
      }
      return !o
    })
  }, [])

  useEffect(() => {
    if (open) {searchRef.current?.focus()}
  }, [open])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
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
      <button ref={triggerRef} className="icon-btn" onClick={handleToggle} aria-label={t('nav.languageSwitcher')} aria-expanded={open} aria-haspopup="listbox">
        <Globe2 size={18} aria-hidden="true" />
      </button>
      {open && <LanguageDropdown filtered={filtered} currentCode={currentCode} searchRef={searchRef} search={search} label={t('nav.languageSwitcher')} style={dropdownStyle} onSearch={setSearch} onSelect={handleSelect} />}
    </div>
  )
}
