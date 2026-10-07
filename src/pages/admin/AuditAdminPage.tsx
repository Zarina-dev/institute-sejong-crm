import { SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Grid, Input, Row, Select, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { usePreferences, type TranslationKey } from '../../app/preferences'
import { AUDIT_ACTIONS, AUDIT_PAGE_SIZE, AUDIT_TYPES, type AuditAction, type AuditEntry, type AuditType } from '../../features/audit/api'
import { useAudit } from '../../features/audit/queries'
import { TRASH_TYPES } from '../../features/trash/api'
import type { Language } from '../../i18n'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { PageHeader } from '../../shared/PageHeader'

const { Text } = Typography

/** Typing pauses this long before the search goes to the server. */
const SEARCH_DELAY = 300

/** Each action's colour: additions green, removals red, the rest calm. */
const ACTION_COLOR: Record<AuditAction, string | undefined> = {
  create: 'green',
  update: 'blue',
  publish: 'cyan',
  unpublish: 'default',
  reorder: 'default',
  delete: 'orange',
  restore: 'geekblue',
  purge: 'red',
  login: 'default',
  login_failed: 'red',
}

const actionKey = (action: AuditAction) => `audit.actions.${action}` as TranslationKey

/** The trash already names most types; the journal adds the two that are edited but never deleted. */
const typeKey = (type: string) =>
  ((TRASH_TYPES as readonly string[]).includes(type) ? `trash.types.${type}` : `audit.types.${type}`) as TranslationKey
const isKnownType = (type: string | null): type is AuditType => !!type && (AUDIT_TYPES as readonly string[]).includes(type)

const timeFormatters = new Map<Language, Intl.DateTimeFormat>()

/** "2026. 10. 7. 오후 12:14" — the journal needs the time, not only the day. */
function formatDateTime(value: string, language: Language) {
  let formatter = timeFormatters.get(language)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' })
    timeFormatters.set(language, formatter)
  }

  return formatter.format(new Date(value))
}

/**
 * 작업 기록 — who changed what in the admin panel, and when. Written by the
 * server for every change, sign-ins included; read-only here. Entries are
 * kept for a year.
 */
export function AuditAdminPage() {
  const { language, t } = usePreferences()
  // A phone has no room for columns side by side: each entry reads top to bottom instead.
  const stacked = !Grid.useBreakpoint().md
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<AuditAction>()
  const [type, setType] = useState<AuditType>()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, SEARCH_DELAY)

    return () => clearTimeout(timer)
  }, [search])

  const audit = useAudit({ page, action, type, q: query || undefined })
  const filtersActive = !!(action || type || search)

  const actionOptions = useMemo(() => AUDIT_ACTIONS.map((value) => ({ value, label: t(actionKey(value)) })), [t])
  const typeOptions = useMemo(() => AUDIT_TYPES.map((value) => ({ value, label: t(typeKey(value)) })), [t])

  const resetFilters = () => {
    setAction(undefined)
    setType(undefined)
    setSearch('')
    setQuery('')
    setPage(1)
  }

  const columns = useMemo<NonNullable<TableProps<AuditEntry>['columns']>>(() => {
    const when = (entry: AuditEntry) => (
      <div className="audit-when">
        <Text>{formatDateTime(entry.at, language)}</Text>
        {entry.actor === 'system' ? <Text type="secondary">{t('audit.system')}</Text> : <Text strong>{entry.actor}</Text>}
        {entry.ip ? <Text type="secondary" className="audit-when__ip">{`IP ${entry.ip.replace(/^::ffff:/, '')}`}</Text> : null}
      </div>
    )
    const action = (entry: AuditEntry) => <Tag color={ACTION_COLOR[entry.action]}>{t(actionKey(entry.action))}</Tag>
    const record = (entry: AuditEntry) => (
      <div className="audit-record">
        {isKnownType(entry.entityType) ? <Text type="secondary">{t(typeKey(entry.entityType))}</Text> : null}
        {entry.label ? <Text>{entry.label}</Text> : null}
        {entry.changes.length > 0 ? (
          <Text type="secondary" className="audit-record__changes">
            {t('audit.changedFields', { fields: entry.changes.join(', ') })}
          </Text>
        ) : null}
      </div>
    )

    if (stacked) {
      return [
        {
          title: t('audit.title'),
          key: 'entry',
          render: (_, entry) => (
            <div className="audit-stacked">
              <div className="audit-stacked__head">
                {action(entry)}
                <Text type="secondary">{formatDateTime(entry.at, language)}</Text>
              </div>
              {record(entry)}
              <Text type="secondary" className="audit-when__ip">
                {[entry.actor === 'system' ? t('audit.system') : entry.actor, entry.ip?.replace(/^::ffff:/, '')].filter(Boolean).join(' · ')}
              </Text>
            </div>
          ),
        },
      ]
    }

    return [
      {
        // When, who and from where share a cell: together they say whose change it was.
        title: t('audit.table.at'),
        key: 'at',
        width: 200,
        render: (_, entry) => when(entry),
      },
      {
        title: t('audit.table.action'),
        key: 'action',
        width: 140,
        render: (_, entry) => action(entry),
      },
      {
        title: t('audit.table.record'),
        key: 'record',
        render: (_, entry) => record(entry),
      },
    ]
  }, [language, stacked, t])

  return (
    <div className="page-layout">
      <PageHeader kicker={t('session.adminPanel')} title={t('audit.title')} description={t('audit.subtitle')} />

      <Alert type="info" showIcon message={t('audit.policy')} />

      <Card className="surface-card filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Text>{t('common.search')}</Text>
            <Input
              allowClear
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('audit.searchPlaceholder')}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('audit.table.action')}</Text>
            <Select
              allowClear
              placeholder={t('trash.all')}
              value={action}
              onChange={(value?: AuditAction) => {
                setAction(value)
                setPage(1)
              }}
              options={actionOptions}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text>{t('trash.table.type')}</Text>
            <Select
              allowClear
              placeholder={t('trash.all')}
              value={type}
              onChange={(value?: AuditType) => {
                setType(value)
                setPage(1)
              }}
              options={typeOptions}
            />
          </Col>
        </Row>

        <div className="filter-footer">
          <Text>{audit.data ? t('audit.count', { count: audit.data.total }) : ' '}</Text>
          {filtersActive ? (
            <Button size="small" onClick={resetFilters}>
              {t('audit.resetFilters')}
            </Button>
          ) : null}
        </div>
      </Card>

      <ErrorAlert error={audit.error} fallback={t('audit.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={audit.data?.items}
          rowKey="id"
          loading={audit.isFetching}
          pagination={{
            current: page,
            pageSize: AUDIT_PAGE_SIZE,
            total: audit.data?.total ?? 0,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: setPage,
          }}
          scroll={stacked ? undefined : { x: 720 }}
          locale={{ emptyText: filtersActive ? t('audit.noMatches') : t('audit.empty') }}
        />
      </Card>
    </div>
  )
}
