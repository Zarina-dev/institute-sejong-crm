import type { TranslationKey } from '../../app/preferences'
import { LEVEL_NONE } from './api'

/** `level` is free text ("TOPIK 3") except for the "no certificate" sentinel, which is translated. */
export function formatLevel(level: string | null | undefined, t: (key: TranslationKey) => string) {
  if (!level) {
    return '-'
  }

  return level === LEVEL_NONE ? t('students.levelNone') : level
}
