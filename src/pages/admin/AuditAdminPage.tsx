import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Input, Row, Select, Table, Tag, Tooltip, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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

/** The admin screen that manages each type of record. */
const SCREEN: Partial<Record<string, string>> = {
  courses: '/admin/courses',
  terms: '/admin/terms',
  news: '/admin/news',
  events: '/admin/events',
  competitions: '/admin/competitions',
  studies: '/admin/studies',
  graduates: '/admin/graduates',
  staff: '/admin/staff',
  textbooks: '/admin/textbooks',
  materials: '/admin/materials',
  meetings: '/admin/meetings',
  chronology: '/admin/chronology',
}

/**
 * Where an entry leads: the record's edit dialog (`?edit=<id>`, which the
 * screen opens); a deleted record waits in 최근 삭제된 항목; a reordering
 * leads to the list. A sign-in or a record removed for good has nowhere to go.
 */
function entryLink(entry: AuditEntry): string | null {
  if (entry.action === 'login' || entry.action === 'login_failed' || entry.action === 'purge' || !entry.entityType) return null
  if (entry.action === 'delete') return '/admin/trash'
  if (entry.entityType === 'content') {
    const slug = entry.entityId?.split('/')[0]
    return slug ? `/admin/content?block=${encodeURIComponent(slug)}` : null
  }
  const screen = SCREEN[entry.entityType]
  if (!screen) return null
  return entry.entityId ? `${screen}?edit=${encodeURIComponent(entry.entityId)}` : screen
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>()

/**
 * "10. 14. 18:34", 24-hour and numeric — short enough for the row's one
 * line. The year is shown ("25. 10. 14. 18:34") only for an earlier year.
 */
function formatDateTime(value: string, language: Language) {
  const date = new Date(value)
  const thisYear = date.getFullYear() === new Date().getFullYear()
  const key = `${language}:${thisYear}`
  let formatter = timeFormatters.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, {
      ...(thisYear ? {} : { year: '2-digit' as const }),
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    timeFormatters.set(key, formatter)
  }

  return formatter.format(date)
}

const regionNames = new Map<Language, Intl.DisplayNames | null>()

/** "Kyrgyzstan" / "Кыргызстан" / "키르기스스탄" — the code itself where the browser has no name for it. */
function countryName(code: string, language: Language) {
  if (!regionNames.has(language)) {
    try {
      regionNames.set(language, new Intl.DisplayNames([language, 'en'], { type: 'region' }))
    } catch {
      regionNames.set(language, null)
    }
  }

  return regionNames.get(language)?.of(code) ?? code
}

const isLoopback = (ip: string) => ip === '::1' || ip.startsWith('127.')
const isPrivate = (ip: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|f[cd]|fe[89ab])/i.test(ip)

/** One line per entry: every cell is cut with "…" and shows its whole text on hover. */
function Line({ text, children, className }: { text: string; children?: ReactNode; className?: string }) {
  return (
    <Tooltip title={text} placement="topLeft" mouseEnterDelay={0.4}>
      <span className={`audit-line${className ? ` ${className}` : ''}`}>{children ?? text}</span>
    </Tooltip>
  )
}

/**
 * 작업 기록 — who changed what in the admin panel, and when. Written by the
 * server for every change, sign-ins included; read-only here. Entries are
 * kept for a year.
 */
export function AuditAdminPage() {
  const { language, t } = usePreferences()
  const navigate = useNavigate()
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
    /** Where the request came from: a place for a public address, a plain word for a local one. */
    const place = (entry: AuditEntry) => {
      if (!entry.ip) return ''
      if (isLoopback(entry.ip)) return t('audit.location.thisComputer')
      if (isPrivate(entry.ip)) return t('audit.location.localNetwork')
      return [entry.city, entry.country ? countryName(entry.country, language) : null].filter(Boolean).join(', ')
    }

    return [
      {
        title: t('audit.table.at'),
        key: 'at',
        width: 150,
        render: (_, entry) => <Line text={formatDateTime(entry.at, language)} className="audit-line--muted" />,
      },
      {
        title: t('audit.table.actor'),
        key: 'actor',
        width: 135,
        render: (_, entry) =>
          entry.actor === 'system' ? (
            <Line text={t('audit.system')} className="audit-line--muted" />
          ) : (
            <Line text={entry.actor} className="audit-line--strong" />
          ),
      },
      {
        title: t('audit.table.action'),
        key: 'action',
        width: 135,
        render: (_, entry) => <Tag color={ACTION_COLOR[entry.action]}>{t(actionKey(entry.action))}</Tag>,
      },
      {
        title: t('audit.table.record'),
        key: 'record',
        render: (_, entry) => {
          const kind = isKnownType(entry.entityType) ? t(typeKey(entry.entityType)) : ''
          const changes = entry.changes.length > 0 ? t('audit.changedFields', { fields: entry.changes.join(', ') }) : ''
          const text = [kind, entry.label, changes].filter(Boolean).join(' · ')

          if (!text) return <Text type="secondary">—</Text>
          const line = (
            <Line text={text}>
              {kind ? <span className="audit-line__kind">{kind}</span> : null}
              {entry.label}
              {changes ? <span className="audit-line__muted"> · {changes}</span> : null}
            </Line>
          )
          const href = entryLink(entry)

          // The record itself is the link (keyboard and screen readers); the row is clickable too.
          return href ? (
            <Link to={href} className="audit-link" onClick={(event) => event.stopPropagation()}>
              {line}
              <ArrowRightOutlined className="audit-link__arrow" aria-hidden="true" />
            </Link>
          ) : (
            line
          )
        },
      },
      {
        title: t('audit.table.ip'),
        key: 'ip',
        width: 225,
        render: (_, entry) => {
          if (!entry.ip) return <Text type="secondary">—</Text>
          const where = place(entry)

          return (
            <Line text={[entry.ip, where].filter(Boolean).join(' · ')}>
              <span className="audit-line__ip">{entry.ip}</span>
              {where ? <span className="audit-line__muted"> · {where}</span> : null}
            </Line>
          )
        },
      },
      {
        title: t('audit.table.device'),
        key: 'device',
        width: 175,
        render: (_, entry) => (entry.device ? <Line text={entry.device} className="audit-line--muted" /> : <Text type="secondary">—</Text>),
      },
    ]
  }, [language, t])

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
          className="admin-table audit-table"
          rowClassName={(entry) => (entryLink(entry) ? 'is-linked' : '')}
          onRow={(entry) => {
            const href = entryLink(entry)
            return href ? { onClick: () => navigate(href) } : {}
          }}
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
          tableLayout="fixed"
          scroll={{ x: 1060 }}
          locale={{ emptyText: filtersActive ? t('audit.noMatches') : t('audit.empty') }}
        />
      </Card>
    </div>
  )
}
