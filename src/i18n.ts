import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../public/locales/en/translation.json'
import es from '../public/locales/es/translation.json'
import es419 from '../public/locales/es-419/translation.json'
import fr from '../public/locales/fr/translation.json'
import de from '../public/locales/de/translation.json'
import it from '../public/locales/it/translation.json'
import ptPT from '../public/locales/pt-PT/translation.json'
import ptBR from '../public/locales/pt-BR/translation.json'
import nl from '../public/locales/nl/translation.json'
import pl from '../public/locales/pl/translation.json'
import sv from '../public/locales/sv/translation.json'
import no from '../public/locales/no/translation.json'
import da from '../public/locales/da/translation.json'
import fi from '../public/locales/fi/translation.json'
import cs from '../public/locales/cs/translation.json'
import sk from '../public/locales/sk/translation.json'
import hu from '../public/locales/hu/translation.json'
import ro from '../public/locales/ro/translation.json'
import bg from '../public/locales/bg/translation.json'
import el from '../public/locales/el/translation.json'
import uk from '../public/locales/uk/translation.json'
import hr from '../public/locales/hr/translation.json'
import ja from '../public/locales/ja/translation.json'
import ko from '../public/locales/ko/translation.json'
import zhCN from '../public/locales/zh-CN/translation.json'
import zhTW from '../public/locales/zh-TW/translation.json'
import hi from '../public/locales/hi/translation.json'
import th from '../public/locales/th/translation.json'
import vi from '../public/locales/vi/translation.json'
import id from '../public/locales/id/translation.json'
import ar from '../public/locales/ar/translation.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en:     { translation: en },
      es:     { translation: es },
      'es-419': { translation: es419 },
      fr:     { translation: fr },
      de:     { translation: de },
      it:     { translation: it },
      'pt-PT': { translation: ptPT },
      'pt-BR': { translation: ptBR },
      nl:     { translation: nl },
      pl:     { translation: pl },
      sv:     { translation: sv },
      no:     { translation: no },
      da:     { translation: da },
      fi:     { translation: fi },
      cs:     { translation: cs },
      sk:     { translation: sk },
      hu:     { translation: hu },
      ro:     { translation: ro },
      bg:     { translation: bg },
      el:     { translation: el },
      uk:     { translation: uk },
      hr:     { translation: hr },
      ja:     { translation: ja },
      ko:     { translation: ko },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      hi:     { translation: hi },
      th:     { translation: th },
      vi:     { translation: vi },
      id:     { translation: id },
      ar:     { translation: ar },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'aion:locale',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
