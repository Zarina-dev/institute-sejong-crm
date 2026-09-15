import type { TranslationKey } from '../../i18n'
import type { ApplicationStatus } from './types'

/** Tag colour per status; the label comes from i18n via `statusLabelKey`. */
export const applicationStatusColor: Record<ApplicationStatus, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  enrolled: 'blue',
}

export const statusLabelKey = (status: ApplicationStatus): TranslationKey => `courses.appStatus.${status}`
