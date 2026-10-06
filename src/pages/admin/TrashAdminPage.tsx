import { DeleteOutlined, RollbackOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Segmented, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences, type TranslationKey } from '../../app/preferences'
import { TRASH_TYPES, type TrashItem, type TrashType } from '../../features/trash/api'
import { usePurgeTrashItem, useRestoreTrashItem, useTrash } from '../../features/trash/queries'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

const DAY = 24 * 60 * 60 * 1000
/** Under this many days left, the countdown turns to a warning. */
const SOON = 7

const NO_ITEMS: TrashItem[] = []

const typeKey = (type: TrashType) => `trash.types.${type}` as TranslationKey

/** Days until the record goes for good, counting today — 30 right after deleting. 0 once it is due. */
const daysLeft = (purgeAt: string) => Math.max(0, Math.ceil((new Date(purgeAt).getTime() - Date.now()) / DAY))

/**
 * 최근 삭제된 항목 — whatever the admin deletes, anywhere in the panel,
 * waits here for 30 days before it is removed for good. Restoring puts the
 * record back exactly as it was, files and all.
 */
export function TrashAdminPage() {
  const { language, t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()
  const trash = useTrash()
  const restore = useRestoreTrashItem()
  const purge = usePurgeTrashItem()
  const [type, setType] = useState<TrashType | 'all'>('all')

  const items = trash.data ?? NO_ITEMS

  // Only the kinds actually in the trash are offered as filters.
  const typeOptions = useMemo(() => {
    const counts = new Map<TrashType, number>()

    for (const item of items) {
      counts.set(item.type, (counts.get(item.type) ?? 0) + 1)
    }

    return [
      { value: 'all' as const, label: `${t('trash.all')} ${items.length}` },
      ...TRASH_TYPES.filter((value) => counts.has(value)).map((value) => ({ value, label: `${t(typeKey(value))} ${counts.get(value)}` })),
    ]
  }, [items, t])

  // A filter whose last item was just restored falls back to everything.
  const activeType = typeOptions.some((option) => option.value === type) ? type : 'all'
  const rows = useMemo(() => (activeType === 'all' ? items : items.filter((item) => item.type === activeType)), [activeType, items])

  const handleRestore = useCallback(
    (item: TrashItem) =>
      restore.mutate(item, {
        onSuccess: () => message.success(t('trash.restored', { name: item.label })),
        onError: (err) => message.error(getErrorMessage(err, t('trash.restoreFailed'))),
      }),
    [message, restore, t],
  )

  const handlePurge = useCallback(
    (item: TrashItem) =>
      confirmDelete({
        target: item.label,
        permanent: true,
        onConfirm: () =>
          purge.mutateAsync(item).then(
            () => message.success(t('trash.purged')),
            (err) => message.error(getErrorMessage(err, t('trash.purgeFailed'))),
          ),
      }),
    [confirmDelete, message, purge, t],
  )

  const restoringId = restore.isPending ? restore.variables?.id : undefined

  const columns = useMemo<NonNullable<TableProps<TrashItem>['columns']>>(
    () => [
      {
        title: t('trash.table.type'),
        key: 'type',
        width: 150,
        render: (_, item) => <Tag>{t(typeKey(item.type))}</Tag>,
      },
      {
        title: t('trash.table.name'),
        key: 'name',
        render: (_, item) => (
          <div className="trash-name">
            <Text strong>{item.label || '—'}</Text>
            {item.detail && item.detail !== item.label ? (
              <Text type="secondary">{item.type === 'news' ? t(`news.category.${item.detail}` as TranslationKey) : item.detail}</Text>
            ) : null}
          </div>
        ),
      },
      {
        title: t('trash.table.deletedAt'),
        key: 'deletedAt',
        width: 170,
        responsive: ['md'],
        render: (_, item) => <Text type="secondary">{formatDate(item.deletedAt, language)}</Text>,
      },
      {
        title: t('trash.table.remaining'),
        key: 'remaining',
        width: 150,
        render: (_, item) => {
          const days = daysLeft(item.purgeAt)

          return <Text type={days < SOON ? 'warning' : 'secondary'}>{days === 0 ? t('trash.lastDay') : t('trash.daysLeft', { days })}</Text>
        },
      },
      {
        title: t('common.actions'),
        key: 'actions',
        width: compactActions ? 96 : 240,
        align: 'right',
        fixed: pinActions,
        render: (_, item) => (
          <Space>
            <Button
              size="small"
              type="primary"
              ghost
              icon={<RollbackOutlined />}
              aria-label={t('trash.restore')}
              loading={restoringId === item.id}
              onClick={() => handleRestore(item)}
            >
              {compactActions ? null : t('trash.restore')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('trash.purge')} onClick={() => handlePurge(item)}>
              {compactActions ? null : t('trash.purge')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handlePurge, handleRestore, language, pinActions, restoringId, t],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('session.adminPanel')} title={t('trash.title')} description={t('trash.subtitle')} />

      <Alert type="info" showIcon message={t('trash.policy')} />

      {items.length > 0 ? (
        <Card className="surface-card filter-card">
          <Segmented options={typeOptions} value={activeType} onChange={(value) => setType(value as TrashType | 'all')} />
        </Card>
      ) : null}

      <ErrorAlert error={trash.error} fallback={t('trash.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey={(item) => `${item.type}:${item.id}`}
          loading={trash.isPending}
          pagination={rows.length > 20 ? { pageSize: 20, showSizeChanger: false } : false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('trash.empty') }}
        />
      </Card>
    </div>
  )
}
