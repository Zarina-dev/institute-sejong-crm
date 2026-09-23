import { CheckCircleFilled, SaveOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Tabs, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { languages, usePreferences } from '../../app/preferences'
import { CONTENT_SLUGS, type ContentSlug } from '../../features/content/api'
import { useAllContent, useSaveContent } from '../../features/content/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { RichTextEditor } from '../../shared/RichTextEditor'

const { Text } = Typography

type ContentFormValues = { title: string; body: string }

/**
 * Editor for the fixed text of the public site. Two axes — block and
 * language — so the page is a slug list on the left and a language tab
 * strip on top; each combination is one row in `site_content`.
 */
export function ContentAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const rows = useAllContent()
  const saveContent = useSaveContent()

  const [slug, setSlug] = useState<ContentSlug>(CONTENT_SLUGS[0])
  const [locale, setLocale] = useState<string>(language)
  const [form] = Form.useForm<ContentFormValues>()

  const byKey = useMemo(() => new Map((rows.data ?? []).map((row) => [`${row.slug}:${row.locale}`, row])), [rows.data])
  const current = byKey.get(`${slug}:${locale}`)

  // Switching block or language reloads the editor with that row's text.
  useEffect(() => {
    form.setFieldsValue({ title: current?.title ?? '', body: current?.body ?? '' })
  }, [current, form, slug, locale])

  const submit = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    try {
      await saveContent.mutateAsync({ slug, locale, title: values.title ?? '', body: values.body ?? '' })
      message.success(t('content.saved'))
    } catch (err) {
      message.error(getErrorMessage(err, t('content.saveFailed')))
    }
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('content.adminTitle')} description={t('content.adminSubtitle')} />

      <ErrorAlert error={rows.error} fallback={t('content.loadFailed')} />

      <div className="content-admin">
        <Card className="surface-card content-admin__list">
          <nav aria-label={t('content.adminTitle')}>
            {CONTENT_SLUGS.map((value) => {
              const filledLocales = languages.filter(({ value: code }) => byKey.get(`${value}:${code}`)?.body).length

              return (
                <button key={value} type="button" className={value === slug ? 'is-active' : undefined} onClick={() => setSlug(value)}>
                  <span>{t(`content.slugs.${value}`)}</span>
                  <Tag color={filledLocales > 0 ? 'green' : 'default'}>
                    {filledLocales}/{languages.length}
                  </Tag>
                </button>
              )
            })}
          </nav>
        </Card>

        <Card className="surface-card content-admin__editor">
          <Tabs
            activeKey={locale}
            onChange={setLocale}
            items={languages.map(({ value, title }) => ({
              key: value,
              label: (
                <span>
                  {title} {byKey.get(`${slug}:${value}`)?.body ? <CheckCircleFilled className="content-admin__filled" /> : null}
                </span>
              ),
            }))}
          />

          <Form form={form} layout="vertical" disabled={saveContent.isPending}>
            <Form.Item name="title" label={t('content.titleLabel')}>
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item name="body" label={t('content.bodyLabel')}>
              <RichTextEditor minHeight={340} />
            </Form.Item>
          </Form>

          <div className="content-admin__actions">
            <Text type="secondary">{current?.body ? t('content.filled') : t('content.missing')}</Text>
            <Button type="primary" icon={<SaveOutlined />} loading={saveContent.isPending} onClick={submit}>
              {t('common.save')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
