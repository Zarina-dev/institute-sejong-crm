import { TranslationOutlined } from '@ant-design/icons'
import { Collapse, Form, Input, Tabs, Typography } from 'antd'
import type { ReactNode } from 'react'

import { usePreferences, type TranslationKey } from '../app/preferences'
import { RichTextEditor } from './RichTextEditor'
import { TRANSLATION_LANGUAGES, type TranslationLanguage, type Translations } from './translations'

const { Text } = Typography

/** Each language by its own name, as a reader would look for it. */
const LANGUAGE_NAME: Record<TranslationLanguage, string> = { en: 'English', ru: 'Русский', ky: 'Кыргызча' }

export type TranslationField = {
  name: string
  label: TranslationKey
  kind?: 'input' | 'textarea' | 'rich'
  maxLength?: number
}

type TranslationFieldsProps = {
  fields: TranslationField[]
  /** Extra rows per language, e.g. the winners of a contest. */
  extra?: (language: TranslationLanguage) => ReactNode
}

/** How many languages have at least one text — shown on the closed panel. */
const filledLanguages = (value?: Translations) =>
  TRANSLATION_LANGUAGES.filter((language) => Object.values(value?.[language] ?? {}).some((text) => typeof text === 'string' && text.trim()))

/**
 * The record's texts in English, Russian and Kyrgyz, one tab each. Korean is
 * the record itself (the fields above); anything left empty here shows the
 * Korean on the site, so a translation can be added a field at a time.
 */
export function TranslationFields({ fields, extra }: TranslationFieldsProps) {
  const { t } = usePreferences()
  const value = Form.useWatch<Translations | undefined>('translations', { preserve: true })
  const filled = filledLanguages(value)

  return (
    <Collapse
      className="translation-fields"
      size="small"
      items={[
        {
          key: 'translations',
          forceRender: true,
          label: (
            <span className="translation-fields__label">
              <TranslationOutlined /> {t('translations.title')}
              <Text type="secondary">
                {filled.length > 0 ? filled.map((language) => LANGUAGE_NAME[language]).join(' · ') : t('translations.none')}
              </Text>
            </span>
          ),
          children: (
            <>
              <Text type="secondary" className="translation-fields__hint">
                {t('translations.hint')}
              </Text>
              <Tabs
                size="small"
                items={TRANSLATION_LANGUAGES.map((language) => ({
                  key: language,
                  forceRender: true,
                  label: LANGUAGE_NAME[language],
                  children: (
                    <>
                      {fields.map((field) => (
                        <Form.Item key={field.name} name={['translations', language, field.name]} label={t(field.label)}>
                          {field.kind === 'rich' ? (
                            <RichTextEditor minHeight={160} />
                          ) : field.kind === 'textarea' ? (
                            <Input.TextArea rows={3} maxLength={field.maxLength} />
                          ) : (
                            <Input maxLength={field.maxLength} />
                          )}
                        </Form.Item>
                      ))}
                      {extra?.(language)}
                    </>
                  ),
                }))}
              />
            </>
          ),
        },
      ]}
    />
  )
}
